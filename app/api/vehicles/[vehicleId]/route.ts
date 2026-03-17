import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]).optional(),
  capacity: z.number().int().min(1).optional(),
  licensePlate: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { vehicleId } = await params

  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await request.json()
    const data = updateSchema.parse(body)

    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(data.name       !== undefined && { name: data.name }),
        ...(data.type       !== undefined && { type: data.type }),
        ...(data.capacity   !== undefined && { capacity: data.capacity }),
        ...(data.status     !== undefined && { status: data.status }),
        ...(data.photos     !== undefined && { photos: data.photos }),
        licensePlate: data.licensePlate ?? existing.licensePlate,
        color:        data.color        ?? existing.color,
        year:         data.year         ?? existing.year,
        make:         data.make         ?? existing.make,
        model:        data.model        ?? existing.model,
        notes:        data.notes        ?? existing.notes,
      },
    })

    return NextResponse.json(vehicle)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PUT /api/vehicles/[vehicleId] error:", error)
    return NextResponse.json({ error: "Failed to update vehicle" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { vehicleId } = await params

  try {
    const existing = await prisma.vehicle.findFirst({ where: { id: vehicleId, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.vehicle.delete({ where: { id: vehicleId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/vehicles/[vehicleId] error:", error)
    return NextResponse.json({ error: "Failed to delete vehicle" }, { status: 500 })
  }
}
