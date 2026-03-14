import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const vehicleSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]),
  capacity: z.number().int().min(1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const status = new URL(request.url).searchParams.get("status")
    const vehicles = await prisma.vehicle.findMany({
      where: { companyId, ...(status && { status: status as "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE" }) },
      orderBy: { name: "asc" },
      include: { _count: { select: { trips: true } }, defaultDrivers: { select: { id: true, name: true } } },
    })
    return NextResponse.json(vehicles)
  } catch (error) {
    console.error("GET /api/vehicles error:", error)
    return NextResponse.json({ error: "Failed to fetch vehicles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = vehicleSchema.parse(body)
    const vehicle = await prisma.vehicle.create({
      data: {
        name: data.name, type: data.type, capacity: data.capacity,
        licensePlate: data.licensePlate || null, color: data.color || null,
        year: data.year || null, make: data.make || null, model: data.model || null,
        notes: data.notes || null, companyId,
      },
    })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/vehicles error:", error)
    return NextResponse.json({ error: "Failed to create vehicle" }, { status: 500 })
  }
}
