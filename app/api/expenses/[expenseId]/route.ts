import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const UpdateExpenseSchema = z.object({
  category: z.enum(["FIXED", "VARIABLE"]).optional(),
  subcategory: z.string().min(1).optional(),
  amount: z.string().optional(),
  date: z.string().optional(),
  vehicleId: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceDay: z.number().optional().nullable(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can manage expenses" },
      { status: 403 }
    )
  }

  try {
    const { expenseId } = await params

    // Verify ownership
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense || expense.companyId !== companyId) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateExpenseSchema.parse(body)

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.subcategory && { subcategory: validatedData.subcategory }),
        ...(validatedData.amount && { amount: validatedData.amount }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.vehicleId !== undefined && { vehicleId: validatedData.vehicleId }),
        ...(validatedData.isRecurring !== undefined && { isRecurring: validatedData.isRecurring }),
        ...(validatedData.recurrenceDay !== undefined && { recurrenceDay: validatedData.recurrenceDay }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }

    console.error("[PATCH /api/expenses/[expenseId]]", error)
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can manage expenses" },
      { status: 403 }
    )
  }

  try {
    const { expenseId } = await params

    // Verify ownership
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense || expense.companyId !== companyId) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      )
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/expenses/[expenseId]]", error)
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    )
  }
}
