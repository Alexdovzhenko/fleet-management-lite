import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"
import { format, parse, isValid } from "date-fns"
import { sendEmailWithPdf, buildDriverEmailHtml, buildClientEmailHtml, buildAffiliateEmailHtml } from "@/lib/email"
import { generateDriverJobOrderPdf, generateReservationPdf } from "@/lib/pdf"
import type { PdfTripData, PdfCompanyBranding } from "@/lib/pdf"

const sendEmailSchema = z.object({
  recipientType:   z.enum(["driver", "client", "affiliate"]),
  recipientEmail:  z.string().email().optional(),   // override if none on record
  senderEmailId:   z.string().optional(),           // defaults to company default
})

function formatPickupDate(raw: string | Date): string {
  try {
    const d = raw instanceof Date ? raw : new Date(raw)
    return format(d, "EEE, MMM d yyyy")
  } catch { return String(raw) }
}

function formatPickupTime(raw: string): string {
  // raw is stored as "HH:MM" (24h) or already formatted
  try {
    const d = parse(raw, "HH:mm", new Date())
    if (isValid(d)) return format(d, "h:mm a")
  } catch { /* ignore */ }
  return raw
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email service not configured. Please add RESEND_API_KEY to environment variables." }, { status: 503 })
  }

  const { tripId } = await params

  // ── Fetch trip with all needed relations ────────────────────────────────────
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      OR: [{ companyId }, { farmOuts: { some: { toCompanyId: companyId, status: "ACCEPTED" } } }],
    },
    include: {
      customer: { select: { id: true, name: true, email: true, phone: true } },
      driver:   { select: { id: true, name: true, email: true, phone: true } },
      vehicle:  { select: { id: true, name: true, type: true } },
      stops:    { orderBy: { order: "asc" } },
      farmOuts: {
        where:  { status: "ACCEPTED" },
        take:   1,
        select: { toCompany: { select: { id: true, name: true, email: true } } },
      },
    },
  })

  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

  // ── Parse request body ──────────────────────────────────────────────────────
  const body = await request.json()
  const { recipientType, recipientEmail: overrideEmail, senderEmailId } = sendEmailSchema.parse(body)

  // ── Resolve recipient email ─────────────────────────────────────────────────
  let toEmail: string | null | undefined = overrideEmail

  if (!toEmail) {
    if (recipientType === "driver") {
      toEmail = trip.driver?.email
    } else if (recipientType === "client") {
      toEmail = trip.passengerEmail ?? trip.customer?.email
    } else if (recipientType === "affiliate") {
      toEmail = trip.farmOuts?.[0]?.toCompany?.email
    }
  }

  if (!toEmail) {
    return NextResponse.json({
      error: `No email address found for ${recipientType}. Please add an email or enter one manually.`,
    }, { status: 422 })
  }

  // ── Fetch company branding ──────────────────────────────────────────────────
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, email: true, phone: true, address: true, city: true, state: true, zip: true, logo: true, website: true },
  })

  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  // ── Resolve sender email ────────────────────────────────────────────────────
  let senderEmail: string | undefined

  if (senderEmailId) {
    const se = await prisma.senderEmail.findFirst({ where: { id: senderEmailId, companyId } })
    senderEmail = se?.email
  }

  if (!senderEmail) {
    const defaultSe = await prisma.senderEmail.findFirst({ where: { companyId, isDefault: true } })
    senderEmail = defaultSe?.email ?? company.email
  }

  // ── Prepare shared PDF data ─────────────────────────────────────────────────
  const pdfCompany: PdfCompanyBranding = {
    name:    company.name,
    logo:    company.logo,
    phone:   company.phone,
    address: company.address,
    city:    company.city,
    state:   company.state,
    zip:     company.zip,
    website: company.website,
    email:   company.email,
  }

  const pickupDate = formatPickupDate(trip.pickupDate)
  const pickupTime = formatPickupTime(trip.pickupTime)

  const pdfTrip: PdfTripData = {
    tripNumber:      trip.tripNumber,
    status:          trip.status,
    tripType:        trip.tripType,
    pickupDate,
    pickupTime,
    pickupAddress:   trip.pickupAddress,
    pickupNotes:     trip.pickupNotes,
    dropoffAddress:  trip.dropoffAddress,
    dropoffNotes:    trip.dropoffNotes,
    passengerName:   trip.passengerName,
    passengerPhone:  trip.passengerPhone,
    passengerEmail:  trip.passengerEmail,
    passengerCount:  trip.passengerCount,
    luggageCount:    trip.luggageCount,
    flightNumber:    trip.flightNumber,
    airportCode:     trip.airportCode,
    driverName:      trip.driver?.name,
    driverPhone:     trip.driver?.phone ?? null,
    vehicleType:     trip.vehicle?.type ?? null,
    vehicleName:     trip.vehicle?.name ?? null,
    meetAndGreet:    trip.meetAndGreet,
    childSeat:       trip.childSeat,
    wheelchairAccess: trip.wheelchairAccess,
    vip:             trip.vip,
    notes:           trip.notes,
    price:           trip.price ? String(trip.price) : null,
    gratuity:        trip.gratuity ? String(trip.gratuity) : null,
    totalPrice:      trip.totalPrice ? String(trip.totalPrice) : null,
    clientRef:       trip.clientRef,
    stops:           trip.stops.map(s => ({ order: s.order, address: s.address, notes: s.notes })),
  }

  // ── Generate PDF + HTML and send ────────────────────────────────────────────
  try {
    let pdfBuffer: Buffer
    let htmlBody: string
    let subject: string
    let pdfFilename: string

    if (recipientType === "driver") {
      pdfBuffer   = await generateDriverJobOrderPdf(pdfTrip, pdfCompany)
      pdfFilename = `job-order-${trip.tripNumber}.pdf`
      subject     = `Job Order: ${trip.tripNumber} · ${pickupDate}`
      htmlBody    = buildDriverEmailHtml({
        companyName:    company.name,
        tripNumber:     trip.tripNumber,
        pickupDate,
        pickupTime,
        pickupAddress:  trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        passengerName:  trip.passengerName ?? trip.customer?.name ?? "",
        driverName:     trip.driver?.name,
      })

    } else if (recipientType === "affiliate") {
      pdfBuffer   = await generateReservationPdf(pdfTrip, pdfCompany, true)
      pdfFilename = `reservation-${trip.tripNumber}.pdf`
      subject     = `Reservation Details: ${trip.tripNumber} · ${pickupDate}`
      htmlBody    = buildAffiliateEmailHtml({
        companyName:    company.name,
        tripNumber:     trip.tripNumber,
        pickupDate,
        pickupTime,
        pickupAddress:  trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        passengerCount: trip.passengerCount,
        agreedPrice:    trip.farmOuts?.[0] ? undefined : undefined, // agreedPrice lives on FarmOut
      })

    } else {
      // client
      pdfBuffer   = await generateReservationPdf(pdfTrip, pdfCompany, false)
      pdfFilename = `reservation-${trip.tripNumber}.pdf`
      subject     = `Reservation Confirmation: ${trip.tripNumber}`
      htmlBody    = buildClientEmailHtml({
        companyName:    company.name,
        tripNumber:     trip.tripNumber,
        pickupDate,
        pickupTime,
        pickupAddress:  trip.pickupAddress,
        dropoffAddress: trip.dropoffAddress,
        passengerName:  trip.passengerName ?? trip.customer?.name ?? "there",
        totalPrice:     trip.totalPrice ? `$${parseFloat(String(trip.totalPrice)).toFixed(2)}` : undefined,
        companyPhone:   company.phone ?? undefined,
      })
    }

    const result = await sendEmailWithPdf({
      to:          toEmail,
      replyTo:     senderEmail,
      fromLabel:   company.name,
      subject,
      html:        htmlBody,
      pdfBuffer,
      pdfFilename,
    })

    // ── Record notification ───────────────────────────────────────────────────
    const notifType = recipientType === "driver" ? "DRIVER_ASSIGNED" : "CONFIRMATION"
    await prisma.tripNotification.create({
      data: {
        tripId,
        type:      notifType,
        channel:   "EMAIL",
        recipient: toEmail,
        sentAt:    new Date(),
        content:   subject,
      },
    }).catch(() => {}) // non-fatal

    return NextResponse.json({ success: true, messageId: (result as { data?: { id?: string } })?.data?.id })

  } catch (err) {
    console.error("send-email error:", err)
    const message = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
