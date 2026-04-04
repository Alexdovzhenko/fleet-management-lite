import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createNotification } from "@/lib/create-notification"
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
  passengerEmail: z.string().optional().nullable(),
  additionalPassengers: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
  })).optional().nullable(),
  customerId: z.string().optional().nullable(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  secondaryDriverId: z.string().optional().nullable(),
  secondaryVehicleId: z.string().optional().nullable(),
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
      where: {
        id: tripId,
        OR: [
          { companyId },
          { farmOuts: { some: { toCompanyId: companyId, status: "ACCEPTED" } } },
        ],
      },
      include: {
        customer: true,
        driver: true,
        vehicle: true,
        secondaryDriver: true,
        secondaryVehicle: true,
        createdBy: { select: { id: true, name: true, role: true } },
        stops: { orderBy: { order: "asc" } },
        notifications: { orderBy: { sentAt: "desc" }, take: 20 },
        invoice: true,
        farmOuts: {
          where: { status: "ACCEPTED" },
          take: 1,
          select: { fromCompany: { select: { id: true, name: true } } },
        },
      },
    })

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    // Sanitize if this is a farm-in
    if (trip.companyId !== companyId) {
      const { farmOuts, ...rest } = trip as typeof trip & { farmOuts?: Array<{ fromCompany: { id: string; name: string } | null }> }
      return NextResponse.json({
        ...rest,
        customer: null,
        internalNotes: null,
        farmedIn: farmOuts?.[0]?.fromCompany ?? null,
      })
    }

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
    const existing = await prisma.trip.findFirst({
      where: {
        id: tripId,
        OR: [
          { companyId },
          { farmOuts: { some: { toCompanyId: companyId, status: "ACCEPTED" } } },
        ],
      },
    })
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

    const isOwned = existing.companyId === companyId

    // Farm-in trips: only allow updating dispatch fields and status
    const updateData = isOwned
      ? (() => {
          const { customerId, additionalPassengers, ...restData } = data
          return {
            ...restData,
            ...extraData,
            ...(customerId ? { customerId } : {}),
            ...(additionalPassengers !== undefined ? { additionalPassengers: additionalPassengers ?? [] } : {}),
            pickupDate: data.pickupDate ? new Date(data.pickupDate) : undefined,
            flightArrival: data.flightArrival ? new Date(data.flightArrival) : undefined,
          }
        })()
      : {
          // Receiving company can only update dispatch + status
          ...(data.status !== undefined ? { status: data.status, ...extraData } : {}),
          ...(data.driverId !== undefined ? { driverId: data.driverId } : {}),
          ...(data.vehicleId !== undefined ? { vehicleId: data.vehicleId } : {}),
          ...(data.secondaryDriverId !== undefined ? { secondaryDriverId: data.secondaryDriverId } : {}),
          ...(data.secondaryVehicleId !== undefined ? { secondaryVehicleId: data.secondaryVehicleId } : {}),
        }

    const trip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData as never,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        vehicle: { select: { id: true, name: true, type: true } },
        secondaryDriver: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        secondaryVehicle: { select: { id: true, name: true, type: true } },
      },
    })

    // ── Notification triggers ────────────────────────────────────────────
    // Determine which company to notify: if the updater is the owner, notify
    // the accepted affiliate (if any); if the updater is the affiliate, notify the owner.
    const acceptedFarmOut = await prisma.farmOut.findFirst({
      where: { tripId, status: "ACCEPTED" },
      select: { fromCompanyId: true, toCompanyId: true },
    })
    const notifyCompanyId = isOwned
      ? (acceptedFarmOut?.toCompanyId ?? null)
      : existing.companyId

    if (notifyCompanyId && isOwned) {
      // Owner made changes — notify affiliate
      if (data.pickupTime && data.pickupTime !== existing.pickupTime) {
        await createNotification({
          companyId: notifyCompanyId,
          type: "TRIP_PICKUP_TIME_CHANGED",
          title: "Pickup time changed",
          body: `Job ${existing.tripNumber}: pickup time changed from ${existing.pickupTime} to ${data.pickupTime}`,
          entityId: tripId,
          entityType: "trip",
          metadata: { tripNumber: existing.tripNumber, oldValue: existing.pickupTime, newValue: data.pickupTime },
        })
      }
      if (data.pickupAddress && data.pickupAddress !== existing.pickupAddress) {
        await createNotification({
          companyId: notifyCompanyId,
          type: "TRIP_PICKUP_ADDRESS_CHANGED",
          title: "Pickup address changed",
          body: `Job ${existing.tripNumber}: pickup address was updated`,
          entityId: tripId,
          entityType: "trip",
          metadata: { tripNumber: existing.tripNumber, oldValue: existing.pickupAddress, newValue: data.pickupAddress },
        })
      }
      if (data.dropoffAddress && data.dropoffAddress !== existing.dropoffAddress) {
        await createNotification({
          companyId: notifyCompanyId,
          type: "TRIP_DROPOFF_ADDRESS_CHANGED",
          title: "Drop-off address changed",
          body: `Job ${existing.tripNumber}: drop-off address was updated`,
          entityId: tripId,
          entityType: "trip",
          metadata: { tripNumber: existing.tripNumber, oldValue: existing.dropoffAddress, newValue: data.dropoffAddress },
        })
      }
      if (data.notes !== undefined && data.notes !== existing.notes) {
        await createNotification({
          companyId: notifyCompanyId,
          type: "TRIP_NOTES_CHANGED",
          title: "Trip notes updated",
          body: `Job ${existing.tripNumber}: trip notes were modified`,
          entityId: tripId,
          entityType: "trip",
          metadata: { tripNumber: existing.tripNumber },
        })
      }
      if (data.status === "CANCELLED") {
        await createNotification({
          companyId: notifyCompanyId,
          type: "TRIP_CANCELLED",
          title: "Trip cancelled",
          body: `Job ${existing.tripNumber} has been cancelled by the sending company`,
          entityId: tripId,
          entityType: "trip",
          metadata: { tripNumber: existing.tripNumber },
        })
      }
    }
    // ────────────────────────────────────────────────────────────────────

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
