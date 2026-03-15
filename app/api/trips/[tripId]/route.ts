import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateTripSchema = z.object({
  status: z.enum(["QUOTE", "CONFIRMED", "DISPATCHED", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  tripType: z.string().optional(),
  pickupDate: z.string().optional(),
  pickupTime: z.string().optional(),
  pickupAddress: z.string().optional(),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupNotes: z.string().optional().nullable(),
  dropoffAddress: z.string().optional(),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  dropoffNotes: z.string().optional().nullable(),
  passengerCount: z.number().int().min(1).optional(),
  passengerName: z.string().optional().nullable(),
  passengerPhone: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  gratuity: z.number().optional().nullable(),
  totalPrice: z.number().optional().nullable(),
  pricingNotes: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  flightArrival: z.string().optional().nullable(),
  airportCode: z.string().optional().nullable(),
  meetAndGreet: z.boolean().optional(),
  childSeat: z.boolean().optional(),
  childSeatDetails: z.string().optional().nullable(),
  wheelchairAccess: z.boolean().optional(),
  vip: z.boolean().optional(),
  clientRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  driverEnRouteAt: z.string().optional().nullable(),
  driverArrivedAt: z.string().optional().nullable(),
  passengerOnBoardAt: z.string().optional().nullable(),
  tripCompletedAt: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { tripId } = await params
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        stops: { orderBy: { order: "asc" } },
        notifications: { orderBy: { sentAt: "desc" }, take: 20 },
        invoice: true,
      },
    })

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    return NextResponse.json(trip)
  } catch (error) {
    console.error("GET /api/trips/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { tripId } = await params
    const existing = await prisma.trip.findFirst({ where: { id: tripId, companyId } })
    if (!existing) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    const body = await request.json()
    const data = updateTripSchema.parse(body)

    const statusTimestamps: Record<string, object> = {
      DRIVER_EN_ROUTE: { driverEnRouteAt: new Date() },
      DRIVER_ARRIVED: { driverArrivedAt: new Date() },
      IN_PROGRESS: { passengerOnBoardAt: new Date() },
      COMPLETED: { tripCompletedAt: new Date() },
    }
    const extraData = data.status ? (statusTimestamps[data.status] || {}) : {}

    const { customerId, ...restData } = data
    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        ...restData,
        ...extraData,
        ...(customerId ? { customerId } : {}),
        pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
        flightArrival: data.flightArrival ? new Date(data.flightArrival) : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true } },
        vehicle: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json(trip)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PUT /api/trips/[id] error:", error)
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { tripId } = await params
    const existing = await prisma.trip.findFirst({ where: { id: tripId, companyId } })
    if (!existing) return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    await prisma.trip.delete({ where: { id: tripId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/trips/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 })
  }
}
