import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"
import { generateConfirmationNumber } from "@/lib/utils"

async function generateUniqueTripNumber(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const candidate = generateConfirmationNumber()
    const existing = await prisma.trip.findUnique({ where: { tripNumber: candidate } })
    if (!existing) return candidate
  }
  // Fallback: append milliseconds for guaranteed uniqueness
  return `LC-${Date.now()}`
}

const createTripSchema = z.object({
  tripNumber: z.string().optional(),
  customerId: z.string().min(1),
  tripType: z.string().default("ONE_WAY"),
  pickupDate: z.string().min(1),
  pickupTime: z.string().min(1),
  pickupAddress: z.string().min(1),
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  pickupNotes: z.string().optional(),
  dropoffAddress: z.string().min(1),
  dropoffLat: z.number().optional(),
  dropoffLng: z.number().optional(),
  dropoffNotes: z.string().optional(),
  passengerCount: z.number().int().min(1).default(1),
  luggageCount: z.number().int().min(0).optional(),
  passengerName: z.string().optional(),
  passengerPhone: z.string().optional(),
  passengerEmail: z.string().optional(),
  additionalPassengers: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    email: z.string().optional(),
  })).optional(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  secondaryDriverId: z.string().optional().nullable(),
  secondaryVehicleId: z.string().optional().nullable(),
  price: z.number().optional(),
  gratuity: z.number().optional(),
  totalPrice: z.number().optional(),
  pricingNotes: z.string().optional(),
  flightNumber: z.string().optional(),
  flightArrival: z.string().optional(),
  airportCode: z.string().optional(),
  meetAndGreet: z.boolean().default(false),
  childSeat: z.boolean().default(false),
  childSeatDetails: z.string().optional(),
  wheelchairAccess: z.boolean().default(false),
  vip: z.boolean().default(false),
  clientRef: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attachments: z.array(z.object({
    url: z.string().url(),
    storagePath: z.string(),
    name: z.string(),
    mimeType: z.string(),
    size: z.number().int().positive(),
  })).max(5).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const status = searchParams.get("status")
    const driverId = searchParams.get("driverId")
    const search = searchParams.get("search") || ""

    const dateFilter = date ? { pickupDate: { gte: new Date(date + "T00:00:00"), lte: new Date(date + "T23:59:59") } } : {}
    const statusFilter = status ? { status: status as never } : {}
    const driverFilter = driverId ? { driverId } : {}
    const searchFilter = search ? {
      OR: [
        { tripNumber: { contains: search, mode: "insensitive" as const } },
        { clientRef: { contains: search, mode: "insensitive" as const } },
        { pickupAddress: { contains: search, mode: "insensitive" as const } },
        { dropoffAddress: { contains: search, mode: "insensitive" as const } },
        { passengerName: { contains: search, mode: "insensitive" as const } },
        { customer: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    } : {}

    const tripInclude = {
      customer: { select: { id: true, name: true, phone: true, email: true, company: true } },
      driver: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      vehicle: { select: { id: true, name: true, type: true } },
      secondaryDriver: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      secondaryVehicle: { select: { id: true, name: true, type: true } },
      createdBy: { select: { id: true, name: true, role: true } },
      stops: { orderBy: { order: "asc" as const } },
      farmOuts: {
        where: { status: { in: ["PENDING" as const, "ACCEPTED" as const] } },
        orderBy: { createdAt: "desc" as const },
        take: 1,
        select: {
          id: true, status: true,
          toCompany: { select: { id: true, name: true } },
          fromCompany: { select: { id: true, name: true } },
        },
      },
    }

    // Query 1: owned trips
    const ownedTrips = await prisma.trip.findMany({
      where: { companyId, ...dateFilter, ...statusFilter, ...driverFilter, ...searchFilter },
      orderBy: [{ pickupDate: "asc" }, { pickupTime: "asc" }],
      include: tripInclude,
    })

    // Query 2: accepted farm-ins for this company
    const acceptedFarmIns = await prisma.farmOut.findMany({
      where: { toCompanyId: companyId, status: "ACCEPTED" },
      select: { tripId: true, fromCompany: { select: { id: true, name: true } }, agreedPrice: true },
    })

    let farmInTrips: unknown[] = []
    if (acceptedFarmIns.length > 0) {
      const fromCompanyByTripId = new Map(acceptedFarmIns.map((f) => [f.tripId, f.fromCompany]))
      const agreedPriceByTripId = new Map(acceptedFarmIns.map((f) => [f.tripId, f.agreedPrice]))
      const farmInSearchFilter = search ? {
        OR: [
          { tripNumber: { contains: search, mode: "insensitive" as const } },
          { pickupAddress: { contains: search, mode: "insensitive" as const } },
          { dropoffAddress: { contains: search, mode: "insensitive" as const } },
          { passengerName: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}

      const rawFarmInTrips = await prisma.trip.findMany({
        where: {
          id: { in: acceptedFarmIns.map((f) => f.tripId) },
          ...dateFilter,
          ...statusFilter,
          ...driverFilter,
          ...farmInSearchFilter,
        },
        orderBy: [{ pickupDate: "asc" }, { pickupTime: "asc" }],
        include: tripInclude,
      })

      farmInTrips = rawFarmInTrips.map((trip) => ({
        ...trip,
        customer: null,
        internalNotes: null,
        price: null,
        gratuity: null,
        totalPrice: null,
        farmedIn: fromCompanyByTripId.get(trip.id) ?? null,
        agreedPrice: agreedPriceByTripId.get(trip.id)?.toString() ?? null,
      }))
    }

    function timeToMinutes(t: string): number {
      const m = t?.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (!m) return 0
      let h = parseInt(m[1])
      const min = parseInt(m[2])
      const pm = m[3].toUpperCase() === "PM"
      if (pm && h < 12) h += 12
      if (!pm && h === 12) h = 0
      return h * 60 + min
    }

    // Merge and sort by date + time
    const allTrips = [...ownedTrips, ...(farmInTrips as typeof ownedTrips)]
      .sort((a, b) => {
        const d = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime()
        return d !== 0 ? d : timeToMinutes(a.pickupTime) - timeToMinutes(b.pickupTime)
      })

    return NextResponse.json(allTrips)
  } catch (error) {
    console.error("GET /api/trips error:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, userId } = auth.ctx

  try {
    const body = await request.json()
    const data = createTripSchema.parse(body)

    // Use client-provided tripNumber if given (pre-displayed to user), otherwise generate one
    const tripNumber = data.tripNumber || await generateUniqueTripNumber()

    const trip = await prisma.trip.create({
      data: {
        tripNumber,
        customerId: data.customerId,
        tripType: data.tripType,
        pickupDate: new Date(data.pickupDate),
        pickupTime: data.pickupTime,
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        pickupNotes: data.pickupNotes || null,
        dropoffAddress: data.dropoffAddress,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        dropoffNotes: data.dropoffNotes || null,
        passengerCount: data.passengerCount,
        luggageCount: data.luggageCount ?? null,
        passengerName: data.passengerName || null,
        passengerPhone: data.passengerPhone || null,
        passengerEmail: data.passengerEmail || null,
        additionalPassengers: data.additionalPassengers ?? undefined,
        driverId: data.driverId || null,
        vehicleId: data.vehicleId || null,
        secondaryDriverId: data.secondaryDriverId || null,
        secondaryVehicleId: data.secondaryVehicleId || null,
        price: data.price,
        gratuity: data.gratuity,
        totalPrice: data.totalPrice,
        pricingNotes: data.pricingNotes || null,
        flightNumber: data.flightNumber || null,
        flightArrival: data.flightArrival ? new Date(data.flightArrival) : null,
        airportCode: data.airportCode || null,
        meetAndGreet: data.meetAndGreet,
        childSeat: data.childSeat,
        childSeatDetails: data.childSeatDetails || null,
        wheelchairAccess: data.wheelchairAccess,
        vip: data.vip,
        clientRef: data.clientRef || null,
        notes: data.notes || null,
        internalNotes: data.internalNotes || null,
        companyId,
        createdById: userId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        vehicle: { select: { id: true, name: true, type: true } },
      },
    })

    // Create attachment records if provided
    if (data.attachments && data.attachments.length > 0) {
      await prisma.tripAttachment.createMany({
        data: data.attachments.map((a) => ({
          tripId: trip.id,
          companyId,
          name: a.name,
          url: a.url,
          mimeType: a.mimeType,
          size: a.size,
          storagePath: a.storagePath,
        })),
      })
    }

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/trips error:", error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Failed to create trip", detail: msg }, { status: 500 })
  }
}
