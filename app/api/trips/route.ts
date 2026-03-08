import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { generateTripNumber } from "@/lib/utils"

const createTripSchema = z.object({
  customerId: z.string().min(1),
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP", "HOURLY", "AIRPORT_PICKUP", "AIRPORT_DROPOFF", "MULTI_STOP", "SHUTTLE"]).default("ONE_WAY"),
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
  passengerName: z.string().optional(),
  passengerPhone: z.string().optional(),
  driverId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  price: z.number().optional(),
  gratuity: z.number().optional(),
  totalPrice: z.number().optional(),
  pricingNotes: z.string().optional(),
  flightNumber: z.string().optional(),
  flightArrival: z.string().optional(),
  airportCode: z.string().optional(),
  meetAndGreet: z.boolean().default(false),
  childSeat: z.boolean().default(false),
  wheelchairAccess: z.boolean().default(false),
  vip: z.boolean().default(false),
  internalNotes: z.string().optional(),
  companyId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId") || "demo-company"
    const date = searchParams.get("date")
    const status = searchParams.get("status")
    const driverId = searchParams.get("driverId")
    const search = searchParams.get("search") || ""

    const trips = await prisma.trip.findMany({
      where: {
        companyId,
        ...(date && {
          pickupDate: {
            gte: new Date(date + "T00:00:00"),
            lte: new Date(date + "T23:59:59"),
          },
        }),
        ...(status && { status: status as never }),
        ...(driverId && { driverId }),
        ...(search && {
          OR: [
            { tripNumber: { contains: search, mode: "insensitive" } },
            { pickupAddress: { contains: search, mode: "insensitive" } },
            { dropoffAddress: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      orderBy: [{ pickupDate: "asc" }, { pickupTime: "asc" }],
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        driver: { select: { id: true, name: true, phone: true, avatarUrl: true } },
        vehicle: { select: { id: true, name: true, type: true } },
        stops: { orderBy: { order: "asc" } },
      },
    })

    return NextResponse.json(trips)
  } catch (error) {
    console.error("GET /api/trips error:", error)
    return NextResponse.json({ error: "Failed to fetch trips" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTripSchema.parse(body)

    const trip = await prisma.trip.create({
      data: {
        tripNumber: generateTripNumber(),
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
        passengerName: data.passengerName || null,
        passengerPhone: data.passengerPhone || null,
        driverId: data.driverId || null,
        vehicleId: data.vehicleId || null,
        price: data.price,
        gratuity: data.gratuity,
        totalPrice: data.totalPrice,
        pricingNotes: data.pricingNotes || null,
        flightNumber: data.flightNumber || null,
        flightArrival: data.flightArrival ? new Date(data.flightArrival) : null,
        airportCode: data.airportCode || null,
        meetAndGreet: data.meetAndGreet,
        childSeat: data.childSeat,
        wheelchairAccess: data.wheelchairAccess,
        vip: data.vip,
        internalNotes: data.internalNotes || null,
        companyId: data.companyId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true } },
        vehicle: { select: { id: true, name: true, type: true } },
      },
    })

    return NextResponse.json(trip, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/trips error:", error)
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 })
  }
}
