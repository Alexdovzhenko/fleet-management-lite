import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

// Validation schema for billing data
const billingDataSchema = z.object({
  // Block 1 - Primary Charges
  flatRate: z.number().min(0).default(0),
  perHourQty: z.number().min(0).default(0),
  perHourRate: z.number().min(0).default(0),
  travelTimeQty: z.number().min(0).default(0),
  travelTimeRate: z.number().min(0).default(0),
  waitTimeQty: z.number().min(0).default(0),
  waitTimeRate: z.number().min(0).default(0),
  extraStopsQty: z.number().int().min(0).default(0),
  extraStopsRate: z.number().min(0).default(0),
  airportFee: z.number().min(0).default(0),
  parkingFee: z.number().min(0).default(0),
  meetAndGreet: z.number().min(0).default(0),
  carSeatQty: z.number().int().min(0).default(0),
  carSeatRate: z.number().min(0).default(0),
  lateEarlyCharge: z.number().min(0).default(0),
  lateEarlyType: z.enum(["late", "early"]).default("late"),
  creditCardFeePct: z.number().min(0).max(10).default(0),
  gratuityPct: z.number().min(0).max(50).default(0),
  discountPct: z.number().min(0).max(100).default(0),

  // Block 2 - Additional Charges
  miscFee1Label: z.string().default("Misc Fee 1"),
  miscFee1Amount: z.number().min(0).default(0),
  miscFee2Label: z.string().default("Misc Fee 2"),
  miscFee2Amount: z.number().min(0).default(0),
  miscFee3Label: z.string().default("Misc Fee 3"),
  miscFee3Amount: z.number().min(0).default(0),

  // Block 3 - Farm-out Costs
  farmOutRate: z.number().min(0).default(0),
  farmOutGratuity: z.number().min(0).default(0),
  farmOutStops: z.number().min(0).default(0),
  farmOutTolls: z.number().min(0).default(0),
  farmOutParking: z.number().min(0).default(0),
  farmOutAirportFee: z.number().min(0).default(0),
  farmOutWaitTime: z.number().min(0).default(0),
  farmOutFuelSurcharge: z.number().min(0).default(0),
  farmOutMeetAndGreet: z.number().min(0).default(0),
  farmOutChildSeat: z.number().min(0).default(0),
  farmOutDiscountPct: z.number().min(0).max(100).default(0),
  farmOutLateEarlyCharge: z.number().min(0).default(0),
  farmOutLateEarlyType: z.enum(["late", "early"]).default("late"),
  farmOutCCFeePct: z.number().min(0).max(10).default(0),
})

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
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    return NextResponse.json({
      billingData: trip.billingData || {},
    })
  } catch (error) {
    console.error("[GET /api/trips/[tripId]/billing]", error)
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 })
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
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const body = await request.json()
    const billingData = billingDataSchema.parse(body)

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { billingData },
    })

    return NextResponse.json({ billingData: updated.billingData }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid billing data", issues: error.issues },
        { status: 400 }
      )
    }
    console.error("[POST /api/trips/[tripId]/billing]", error)
    return NextResponse.json({ error: "Failed to create billing data" }, { status: 500 })
  }
}

export async function PUT(
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
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const body = await request.json()
    const billingData = billingDataSchema.parse(body)

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { billingData },
    })

    return NextResponse.json({ billingData: updated.billingData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid billing data", issues: error.issues },
        { status: 400 }
      )
    }
    console.error("[PUT /api/trips/[tripId]/billing]", error)
    return NextResponse.json({ error: "Failed to update billing data" }, { status: 500 })
  }
}

export async function PATCH(
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
    })

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    const body = await request.json()
    // For PATCH, allow partial updates - merge with existing data
    const partialData = billingDataSchema.partial().parse(body)
    const billingData = Object.assign({}, trip.billingData || {}, partialData)

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { billingData },
    })

    return NextResponse.json({ billingData: updated.billingData })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid billing data", issues: error.issues },
        { status: 400 }
      )
    }
    console.error("[PATCH /api/trips/[tripId]/billing]", error)
    return NextResponse.json({ error: "Failed to update billing data" }, { status: 500 })
  }
}
