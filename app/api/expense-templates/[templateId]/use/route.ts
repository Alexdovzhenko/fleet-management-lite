import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const UseTemplateSchema = z.object({
  date: z.string().optional(),
  amount: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can use templates" },
      { status: 403 }
    )
  }

  try {
    const { templateId } = await params
    const body = await request.json()
    const validatedData = UseTemplateSchema.parse(body)

    // Get template
    const template = await prisma.expenseTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template || template.companyId !== companyId) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      )
    }

    // Create expense from template
    const expense = await prisma.expense.create({
      data: {
        companyId,
        category: template.category,
        subcategory: template.subcategory,
        amount: validatedData.amount || template.defaultAmount,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        vehicleId: template.vehicleId,
      },
    })

    // Update template usage
    await prisma.expenseTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("[POST /api/expense-templates/[templateId]/use]", error)
    return NextResponse.json(
      { error: "Failed to create expense from template" },
      { status: 500 }
    )
  }
}
