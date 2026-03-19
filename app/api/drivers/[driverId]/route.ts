import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1).optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  defaultVehicleId: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  licensePhotoFront: z.string().optional().nullable(),
  licensePhotoBack: z.string().optional().nullable(),
  document1Url: z.string().optional().nullable(),
  document1Name: z.string().optional().nullable(),
  document2Url: z.string().optional().nullable(),
  document2Name: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { driverId } = await params
    const driver = await prisma.driver.findFirst({
      where: { id: driverId, companyId },
      include: {
        defaultVehicle: true,
        availability: { orderBy: { dayOfWeek: "asc" } },
        trips: {
          where: { status: { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
          orderBy: { pickupDate: "asc" },
          take: 10,
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            vehicle: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!driver) return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    return NextResponse.json(driver)
  } catch (error) {
    console.error("GET /api/drivers/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch driver" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { driverId } = await params
    const existing = await prisma.driver.findFirst({ where: { id: driverId, companyId } })
    if (!existing) return NextResponse.json({ error: "Driver not found" }, { status: 404 })

    const body = await request.json()
    const data = updateDriverSchema.parse(body)
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { ...data, email: data.email || null, licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined },
    })
    return NextResponse.json(driver)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PUT /api/drivers/[id] error:", error)
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { driverId } = await params
    const existing = await prisma.driver.findFirst({ where: { id: driverId, companyId } })
    if (!existing) return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    await prisma.driver.delete({ where: { id: driverId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/drivers/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 })
  }
}
