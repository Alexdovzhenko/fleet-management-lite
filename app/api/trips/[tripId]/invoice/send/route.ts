import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"
import { generateInvoicePdf } from "@/lib/pdf"
import { sendEmailWithPdf, buildInvoiceEmailHtml } from "@/lib/email"

// Zod schema for request validation
const sendInvoiceSchema = z.object({
  primaryEmail: z.string().email("Invalid primary email"),
  secondaryEmail: z.string().email("Invalid secondary email").optional(),
  message: z.string().max(500).optional(),
  senderEmailId: z.string().optional(),
})

// Reuse invoice computation logic from invoice/pdf route
interface InvoiceLineItem {
  description: string
  qty: number
  unitPrice: number
  amount: number
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  billTo: {
    name: string
    email?: string
    phone?: string
  }
  company: {
    name: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
  primaryCharges: InvoiceLineItem[]
  additionalCharges: InvoiceLineItem[]
  farmOutCharges: InvoiceLineItem[]
  trip?: {
    pickupDate?: string
    pickupTime?: string
    vehicleType?: string | null
    tripType?: string | null
    pickupAddress?: string
    dropoffAddress?: string
    stops?: Array<{ order: number; address: string; notes?: string | null; role?: string | null }>
  }
  summary: {
    subtotal: number
    block1Subtotal: number
    block2Subtotal: number
    block3Subtotal: number
    discount: number
    discountPct: number
    gratuity: number
    gratuityPct: number
    creditCardFee: number
    creditCardFeePct: number
    subtotalWithAdjustments: number
    farmOutTotal: number
    farmOutDiscount: number
    farmOutDiscountPct: number
    farmOutLateEarlyCharge: number
    farmOutCCFee: number
    farmOutCCFeePct: number
    tax: number
    total: number
  }
  paymentTerms: string
  footerNote?: string
}

function computeInvoiceData(billingData: any, trip: any, settings: any): InvoiceData {
  const b = billingData || {}

  // Block 1 - Primary Charges
  const primaryCharges: InvoiceLineItem[] = []

  if (b.flatRate && b.flatRate > 0) {
    primaryCharges.push({
      description: "Base Rate",
      qty: 1,
      unitPrice: b.flatRate,
      amount: b.flatRate,
    })
  }

  if (b.perHourQty && b.perHourRate) {
    const amount = b.perHourQty * b.perHourRate
    primaryCharges.push({
      description: "Per Hour",
      qty: b.perHourQty,
      unitPrice: b.perHourRate,
      amount,
    })
  }

  if (b.travelTimeQty && b.travelTimeRate) {
    const amount = b.travelTimeQty * b.travelTimeRate
    primaryCharges.push({
      description: "Travel Time",
      qty: b.travelTimeQty,
      unitPrice: b.travelTimeRate,
      amount,
    })
  }

  if (b.waitTimeQty && b.waitTimeRate) {
    const amount = b.waitTimeQty * b.waitTimeRate
    primaryCharges.push({
      description: "Wait Time",
      qty: b.waitTimeQty,
      unitPrice: b.waitTimeRate,
      amount,
    })
  }

  if (b.extraStopsQty && b.extraStopsRate) {
    const amount = b.extraStopsQty * b.extraStopsRate
    primaryCharges.push({
      description: "Extra Stops",
      qty: b.extraStopsQty,
      unitPrice: b.extraStopsRate,
      amount,
    })
  }

  if (b.airportFee && b.airportFee > 0) {
    primaryCharges.push({
      description: "Airport Fee",
      qty: 1,
      unitPrice: b.airportFee,
      amount: b.airportFee,
    })
  }

  if (b.parkingFee && b.parkingFee > 0) {
    primaryCharges.push({
      description: "Parking Fee",
      qty: 1,
      unitPrice: b.parkingFee,
      amount: b.parkingFee,
    })
  }

  if (b.meetAndGreet && b.meetAndGreet > 0) {
    primaryCharges.push({
      description: "Meet & Greet",
      qty: 1,
      unitPrice: b.meetAndGreet,
      amount: b.meetAndGreet,
    })
  }

  if (b.carSeatQty && b.carSeatRate) {
    const amount = b.carSeatQty * b.carSeatRate
    primaryCharges.push({
      description: "Car Seat",
      qty: b.carSeatQty,
      unitPrice: b.carSeatRate,
      amount,
    })
  }

  if (b.lateEarlyCharge && b.lateEarlyCharge > 0) {
    primaryCharges.push({
      description: `${b.lateEarlyType === "late" ? "Late" : "Early"} Charge`,
      qty: 1,
      unitPrice: b.lateEarlyCharge,
      amount: b.lateEarlyCharge,
    })
  }

  const primarySubtotal = primaryCharges.reduce((sum, item) => sum + item.amount, 0)

  // Block 2 - Additional Charges
  const additionalCharges: InvoiceLineItem[] = []

  if (b.miscFee1Amount && b.miscFee1Amount > 0) {
    additionalCharges.push({
      description: b.miscFee1Label || "Misc Fee 1",
      qty: 1,
      unitPrice: b.miscFee1Amount,
      amount: b.miscFee1Amount,
    })
  }

  if (b.miscFee2Amount && b.miscFee2Amount > 0) {
    additionalCharges.push({
      description: b.miscFee2Label || "Misc Fee 2",
      qty: 1,
      unitPrice: b.miscFee2Amount,
      amount: b.miscFee2Amount,
    })
  }

  if (b.miscFee3Amount && b.miscFee3Amount > 0) {
    additionalCharges.push({
      description: b.miscFee3Label || "Misc Fee 3",
      qty: 1,
      unitPrice: b.miscFee3Amount,
      amount: b.miscFee3Amount,
    })
  }

  const additionalSubtotal = additionalCharges.reduce((sum, item) => sum + item.amount, 0)

  // Calculate subtotal
  const subtotal = primarySubtotal + additionalSubtotal

  // Block 3 - Farm-out Costs
  const farmOutCharges: InvoiceLineItem[] = []
  let farmOutTotal = 0

  if (b.farmOutRate && b.farmOutRate > 0) {
    farmOutCharges.push({
      description: "Farm-out Rate",
      qty: 1,
      unitPrice: b.farmOutRate,
      amount: b.farmOutRate,
    })
    farmOutTotal += b.farmOutRate
  }

  if (b.farmOutGratuity && b.farmOutGratuity > 0) {
    farmOutCharges.push({
      description: "Farm-out Gratuity",
      qty: 1,
      unitPrice: b.farmOutGratuity,
      amount: b.farmOutGratuity,
    })
    farmOutTotal += b.farmOutGratuity
  }

  const farmOutFields = [
    "farmOutStops",
    "farmOutTolls",
    "farmOutParking",
    "farmOutAirportFee",
    "farmOutWaitTime",
    "farmOutFuelSurcharge",
    "farmOutMeetAndGreet",
    "farmOutChildSeat",
  ]

  const farmOutLabels: Record<string, string> = {
    farmOutStops: "Stops",
    farmOutTolls: "Tolls",
    farmOutParking: "Parking",
    farmOutAirportFee: "Airport Fee",
    farmOutWaitTime: "Wait Time",
    farmOutFuelSurcharge: "Fuel Surcharge",
    farmOutMeetAndGreet: "Meet & Greet",
    farmOutChildSeat: "Child Seat",
  }

  farmOutFields.forEach((field) => {
    if (b[field] && b[field] > 0) {
      const amount = b[field]
      farmOutCharges.push({
        description: `Farm-out ${farmOutLabels[field]}`,
        qty: 1,
        unitPrice: amount,
        amount,
      })
      farmOutTotal += amount
    }
  })

  // Calculate discount
  let discount = 0
  if (b.discountPct && b.discountPct > 0) {
    discount = (subtotal * b.discountPct) / 100
  }

  // Calculate gratuity
  let gratuity = 0
  const subtotalAfterDiscount = subtotal - discount
  if (b.gratuityPct && b.gratuityPct > 0) {
    gratuity = (subtotalAfterDiscount * b.gratuityPct) / 100
  }

  // Calculate credit card fee
  let creditCardFee = 0
  if (b.creditCardFeePct && b.creditCardFeePct > 0) {
    const baseForCC = subtotalAfterDiscount + gratuity
    creditCardFee = (baseForCC * b.creditCardFeePct) / 100
  }

  // Farm-out discount and fees
  let farmOutDiscount = 0
  if (b.farmOutDiscountPct && b.farmOutDiscountPct > 0) {
    farmOutDiscount = (farmOutTotal * b.farmOutDiscountPct) / 100
  }

  if (b.farmOutLateEarlyCharge && b.farmOutLateEarlyCharge > 0) {
    farmOutTotal += b.farmOutLateEarlyCharge
  }

  let farmOutCCFee = 0
  if (b.farmOutCCFeePct && b.farmOutCCFeePct > 0) {
    farmOutCCFee = ((farmOutTotal - farmOutDiscount) * b.farmOutCCFeePct) / 100
  }

  const tax = 0

  const subtotalWithAdjustments = subtotalAfterDiscount + gratuity + creditCardFee

  const total = subtotalWithAdjustments + farmOutTotal - farmOutDiscount + farmOutCCFee + tax

  const invoiceNumber =
    settings?.invoicePrefix || "INV-" + trip.tripNumber.replace(/[^0-9]/g, "")

  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  const block1Subtotal = primarySubtotal
  const block2Subtotal = additionalSubtotal
  const block3Subtotal = farmOutCharges.reduce((sum, item) => sum + item.amount, 0)

  return {
    invoiceNumber,
    invoiceDate,
    billTo: {
      name: trip.passengerName || trip.customer?.name || "Customer",
      email: trip.passengerEmail || trip.customer?.email,
      phone: trip.passengerPhone || trip.customer?.phone,
    },
    company: {
      name: settings?.companyName || "",
      address: settings?.address,
      phone: settings?.phone,
      email: settings?.billingEmail,
      logoUrl: settings?.logoUrl,
    },
    primaryCharges,
    additionalCharges,
    farmOutCharges,
    trip: {
      pickupDate: trip.pickupDate?.toISOString(),
      pickupTime: trip.pickupTime,
      vehicleType: trip.vehicleType,
      tripType: trip.tripType,
      pickupAddress: trip.pickupAddress,
      dropoffAddress: trip.dropoffAddress,
      stops: trip.stops
        ?.map((s: any) => ({
          order: s.order,
          address: s.address,
          notes: s.notes,
          role: s.role,
        })) || [],
    },
    summary: {
      subtotal,
      block1Subtotal,
      block2Subtotal,
      block3Subtotal,
      discount,
      discountPct: b.discountPct || 0,
      gratuity,
      gratuityPct: b.gratuityPct || 0,
      creditCardFee,
      creditCardFeePct: b.creditCardFeePct || 0,
      subtotalWithAdjustments,
      farmOutTotal: farmOutTotal - farmOutDiscount + farmOutCCFee,
      farmOutDiscount,
      farmOutDiscountPct: b.farmOutDiscountPct || 0,
      farmOutLateEarlyCharge: b.farmOutLateEarlyCharge || 0,
      farmOutCCFee,
      farmOutCCFeePct: b.farmOutCCFeePct || 0,
      tax,
      total,
    },
    paymentTerms: settings?.paymentTerms || "Due on Receipt",
    footerNote: settings?.footerNote,
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured. Please add RESEND_API_KEY to environment variables." },
      { status: 503 }
    )
  }

  const { tripId } = await params

  try {
    // Parse and validate request body
    const body = await request.json()
    const { primaryEmail, secondaryEmail, message, senderEmailId } = sendInvoiceSchema.parse(body)

    // Fetch trip with billing data
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
        stops: { orderBy: { order: "asc" } },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Fetch billing settings
    const settings = await prisma.billingSettings.findUnique({
      where: { companyId },
    })

    // Fetch company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        logo: true,
        website: true,
      },
    })

    // Fetch sender email if specified
    let senderEmail: string | null = null
    if (senderEmailId) {
      const sender = await prisma.senderEmail.findUnique({
        where: { id: senderEmailId },
        select: { email: true },
      })
      if (sender) {
        senderEmail = sender.email
      }
    }

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Look up existing invoice for stored invoice number
    const existingInvoice = await prisma.invoice.findFirst({
      where: { tripId, companyId },
      select: { invoiceNumber: true },
    })

    // Compute invoice data and override with stored invoice number if exists
    const invoiceData = computeInvoiceData(trip.billingData, trip, settings)
    if (existingInvoice) {
      invoiceData.invoiceNumber = existingInvoice.invoiceNumber
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf(invoiceData)

    // Format total for display
    const totalFormatted = `$${invoiceData.summary.total.toFixed(2)}`

    // Build email HTML
    const htmlBody = buildInvoiceEmailHtml({
      companyName: company.name,
      invoiceNumber: invoiceData.invoiceNumber,
      invoiceDate: invoiceData.invoiceDate,
      passengerName: invoiceData.billTo.name,
      total: totalFormatted,
      message,
    })

    // Determine the reply-to email
    const replyToEmail = senderEmail || settings?.billingEmail || company.email

    // Send to primary email
    await sendEmailWithPdf({
      to: primaryEmail,
      replyTo: replyToEmail,
      fromLabel: company.name,
      subject: `Invoice ${invoiceData.invoiceNumber}`,
      html: htmlBody,
      pdfBuffer,
      pdfFilename: `invoice-${invoiceData.invoiceNumber}.pdf`,
    })

    // Send to secondary email if provided
    if (secondaryEmail) {
      await sendEmailWithPdf({
        to: secondaryEmail,
        replyTo: replyToEmail,
        fromLabel: company.name,
        subject: `Invoice ${invoiceData.invoiceNumber}`,
        html: htmlBody,
        pdfBuffer,
        pdfFilename: `invoice-${invoiceData.invoiceNumber}.pdf`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/trips/[tripId]/invoice/send]", error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const fieldError = error.issues[0]
      return NextResponse.json(
        { error: `${fieldError.path.join(".")}: ${fieldError.message}` },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : "Failed to send invoice"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
