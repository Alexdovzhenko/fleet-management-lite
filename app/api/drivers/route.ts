import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const createDriverSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
  licenseNumber: z.string().optional().nullable(),
  licenseExpiry: z.string().optional().nullable(),
  birthday: z.string().optional().nullable(),
  homeAddress: z.string().optional().nullable(),
  homeCity: z.string().optional().nullable(),
  homeState: z.string().optional().nullable(),
  homeZip: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  defaultVehicleId: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  licensePhotoFront: z.string().optional().nullable(),
  licensePhotoBack: z.string().optional().nullable(),
  document1Url: z.string().optional().nullable(),
  document1Name: z.string().optional().nullable(),
  document2Url: z.string().optional().nullable(),
  document2Name: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")

    const drivers = await prisma.driver.findMany({
      where: {
        companyId,
        ...(status && { status: status as "ACTIVE" | "INACTIVE" | "ON_LEAVE" }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { name: "asc" },
      include: {
        defaultVehicle: { select: { id: true, name: true, type: true } },
        _count: { select: { trips: true } },
      },
    })

    return NextResponse.json(drivers)
  } catch (error) {
    console.error("GET /api/drivers error:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = createDriverSchema.parse(body)

    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        status: data.status ?? "ACTIVE",
        licenseNumber: data.licenseNumber || null,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null,
        birthday: data.birthday ? new Date(data.birthday) : null,
        homeAddress: data.homeAddress || null,
        homeCity: data.homeCity || null,
        homeState: data.homeState || null,
        homeZip: data.homeZip || null,
        notes: data.notes || null,
        defaultVehicleId: data.defaultVehicleId || null,
        avatarUrl: data.avatarUrl || null,
        licensePhotoFront: data.licensePhotoFront || null,
        licensePhotoBack: data.licensePhotoBack || null,
        document1Url: data.document1Url || null,
        document1Name: data.document1Name || null,
        document2Url: data.document2Url || null,
        document2Name: data.document2Name || null,
        companyId,
      },
    })

    return NextResponse.json(driver, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/drivers error:", error)
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 })
  }
}
