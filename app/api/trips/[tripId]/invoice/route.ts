import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

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
  lineItems: InvoiceLineItem[]
  summary: {
    subtotal: number
    farmOutTotal: number
    discount: number
    creditCardFee: number
    gratuity: number
    subtotalWithAdjustments: number
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

  // Block 3 - Farm-out Costs (separate, not included in main subtotal)
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

  // Add other farm-out items...
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

  // Calculate discount (on subtotal)
  let discount = 0
  if (b.discountPct && b.discountPct > 0) {
    discount = (subtotal * b.discountPct) / 100
  }

  // Calculate gratuity (on subtotal after discount)
  let gratuity = 0
  const subtotalAfterDiscount = subtotal - discount
  if (b.gratuityPct && b.gratuityPct > 0) {
    gratuity = (subtotalAfterDiscount * b.gratuityPct) / 100
  }

  // Calculate credit card fee (on subtotal after discount and gratuity)
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

  // For now, tax is not shown in invoice (can be added later if needed)
  const tax = 0

  const subtotalWithAdjustments =
    subtotalAfterDiscount + gratuity + creditCardFee

  const total =
    subtotalWithAdjustments + farmOutTotal - farmOutDiscount + farmOutCCFee + tax

  // Compile all line items for display
  const allLineItems = [
    ...primaryCharges,
    ...additionalCharges,
  ]

  // Generate invoice number
  const invoiceNumber =
    settings?.invoicePrefix || "INV-" + trip.tripNumber.replace(/[^0-9]/g, "")

  // Format invoice date
  const invoiceDate = new Date().toLocaleDateString(
    "en-US",
    settings?.dateFormat === "DD/MM/YYYY"
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : settings?.dateFormat === "YYYY-MM-DD"
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : { year: "numeric", month: "2-digit", day: "2-digit" }
  )

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
    lineItems: allLineItems,
    summary: {
      subtotal,
      farmOutTotal: farmOutTotal - farmOutDiscount + farmOutCCFee,
      discount,
      creditCardFee,
      gratuity,
      subtotalWithAdjustments,
      tax,
      total,
    },
    paymentTerms: settings?.paymentTerms || "Due on Receipt",
    footerNote: settings?.footerNote,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { tripId } = await params

  try {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: {
        customer: { select: { name: true, email: true, phone: true } },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const settings = await prisma.billingSettings.findUnique({
      where: { companyId },
    })

    const invoiceData = computeInvoiceData(trip.billingData, trip, settings)

    return NextResponse.json(invoiceData)
  } catch (error) {
    console.error("[GET /api/trips/[tripId]/invoice]", error)
    return NextResponse.json({ error: "Failed to compute invoice" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { tripId } = await params

  try {
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
      },
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    if (!trip.customerId) {
      return NextResponse.json({ error: "Trip must have a customer assigned" }, { status: 400 })
    }

    // Check if invoice already exists for this trip
    const existingInvoice = await prisma.invoice.findFirst({
      where: { tripId },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice already exists for this trip", invoiceId: existingInvoice.id },
        { status: 409 }
      )
    }

    const settings = await prisma.billingSettings.findUnique({
      where: { companyId },
    })

    const invoiceData = computeInvoiceData(trip.billingData, trip, settings)

    // Create the invoice record
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        status: "DRAFT",
        customerId: trip.customerId,
        tripId: tripId,
        companyId: companyId,
        subtotal: invoiceData.summary.subtotal,
        gratuity: invoiceData.summary.gratuity,
        tax: invoiceData.summary.tax,
        total: invoiceData.summary.total,
        notes: invoiceData.footerNote,
      },
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[POST /api/trips/[tripId]/invoice]", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
