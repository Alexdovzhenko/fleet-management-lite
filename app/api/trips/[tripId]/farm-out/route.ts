import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createNotification } from "@/lib/create-notification"
import { z } from "zod"

const VEHICLE_TYPES = ["SEDAN","SUV","STRETCH_LIMO","SPRINTER","PARTY_BUS","COACH","OTHER"] as const

const farmOutSchema = z.object({
  toCompanyId: z.string().min(1),
  message: z.string().optional(),
  agreedPrice: z.number().positive().optional(),
  vehicleType: z.enum(VEHICLE_TYPES).optional(),
})

// POST /api/trips/[tripId]/farm-out — create a farm-out request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { tripId } = await params

  try {
    const body = await request.json()
    const data = farmOutSchema.parse(body)

    // Verify the trip belongs to this company
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, companyId },
    })
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 })
    }

    // Cannot farm out to yourself
    if (data.toCompanyId === companyId) {
      return NextResponse.json({ error: "Cannot farm out to your own company" }, { status: 400 })
    }

    // Verify the two companies are connected affiliates
    const connection = await prisma.affiliateConnection.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { senderId: companyId, receiverId: data.toCompanyId },
          { senderId: data.toCompanyId, receiverId: companyId },
        ],
      },
    })
    if (!connection) {
      return NextResponse.json({ error: "Not connected to this affiliate" }, { status: 403 })
    }

    // Check for an existing pending farm-out for this trip to the same company
    const existing = await prisma.farmOut.findFirst({
      where: { tripId, toCompanyId: data.toCompanyId, status: "PENDING" },
    })
    if (existing) {
      return NextResponse.json({ error: "A pending farm-out already exists for this trip to this affiliate" }, { status: 409 })
    }

    // Check if this trip was itself received via a farm-in (for double farm-out tracking)
    const parentFarmOut = await prisma.farmOut.findFirst({
      where: { tripId, toCompanyId: companyId, status: "ACCEPTED" },
      orderBy: { createdAt: "desc" },
    })

    const farmOut = await prisma.farmOut.create({
      data: {
        tripId,
        fromCompanyId: companyId,
        toCompanyId: data.toCompanyId,
        message: data.message || null,
        agreedPrice: data.agreedPrice ?? null,
        vehicleType: data.vehicleType ?? null,
        parentFarmOutId: parentFarmOut?.id ?? null,
      },
      include: {
        fromCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
        toCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
      },
    })

    // Notify receiving company
    await createNotification({
      companyId: data.toCompanyId,
      type: "FARM_OUT_RECEIVED",
      title: "New farm-out request",
      body: `${farmOut.fromCompany.name} sent you job ${trip.tripNumber} to cover`,
      entityId: trip.id,
      entityType: "trip",
      metadata: { farmOutId: farmOut.id, tripNumber: trip.tripNumber, affiliateName: farmOut.fromCompany.name },
    })

    return NextResponse.json(farmOut, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/trips/[tripId]/farm-out error:", error)
    return NextResponse.json({ error: "Failed to create farm-out" }, { status: 500 })
  }
}

// GET /api/trips/[tripId]/farm-out — list farm-outs for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { tripId } = await params

  try {
    const trip = await prisma.trip.findFirst({ where: { id: tripId, companyId } })
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    const farmOuts = await prisma.farmOut.findMany({
      where: { tripId },
      include: {
        fromCompany: { select: { id: true, name: true, logo: true, city: true, state: true } },
        toCompany: { select: { id: true, name: true, logo: true, city: true, state: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(farmOuts)
  } catch (error) {
    console.error("GET /api/trips/[tripId]/farm-out error:", error)
    return NextResponse.json({ error: "Failed to fetch farm-outs" }, { status: 500 })
  }
}
