import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const CreateTemplateSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["FIXED", "VARIABLE"]),
  subcategory: z.string().min(1),
  defaultAmount: z.string(),
  vehicleId: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can view templates" },
      { status: 403 }
    )
  }

  try {
    const templates = await prisma.expenseTemplate.findMany({
      where: { companyId },
      include: {
        vehicle: {
          select: { id: true, name: true },
        },
      },
      orderBy: { lastUsedAt: "desc" },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("[GET /api/expense-templates]", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can create templates" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = CreateTemplateSchema.parse(body)

    const template = await prisma.expenseTemplate.create({
      data: {
        companyId,
        name: validatedData.name,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        defaultAmount: validatedData.defaultAmount,
        vehicleId: validatedData.vehicleId || null,
      },
      include: {
        vehicle: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("[POST /api/expense-templates]", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}
