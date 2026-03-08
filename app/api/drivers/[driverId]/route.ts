import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
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
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        defaultVehicle: true,
        availability: { orderBy: { dayOfWeek: "asc" } },
        trips: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
          },
          orderBy: { pickupDate: "asc" },
          take: 10,
          include: {
            customer: { select: { id: true, name: true, phone: true } },
            vehicle: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

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
  try {
    const { driverId } = await params
    const body = await request.json()
    const data = updateDriverSchema.parse(body)

    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        ...data,
        email: data.email || null,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
      },
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
  _request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params
    await prisma.driver.delete({ where: { id: driverId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/drivers/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 })
  }
}
