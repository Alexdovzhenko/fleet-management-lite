import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const CreateExpenseSchema = z.object({
  category: z.enum(["FIXED", "VARIABLE"]),
  subcategory: z.string().min(1),
  amount: z.string(),
  date: z.string(),
  vehicleId: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceDay: z.number().optional().nullable(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  // Only admins can create expenses
  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can manage expenses" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = CreateExpenseSchema.parse(body)

    const expense = await prisma.expense.create({
      data: {
        companyId,
        category: validatedData.category,
        subcategory: validatedData.subcategory,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        vehicleId: validatedData.vehicleId || null,
        isRecurring: validatedData.isRecurring || false,
        recurrenceDay: validatedData.recurrenceDay || null,
        notes: validatedData.notes || null,
        lastRecurredAt: validatedData.isRecurring ? new Date() : null,
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

    console.error("[POST /api/expenses]", error)
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  // Only admins can view expenses
  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can view expenses" },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    const category = searchParams.get("category") as "FIXED" | "VARIABLE" | null

    let where: any = { companyId }

    if (startDateStr && endDateStr) {
      const startDate = new Date(startDateStr)
      const endDate = new Date(endDateStr)
      endDate.setDate(endDate.getDate() + 1)

      where.date = {
        gte: startDate,
        lt: endDate,
      }
    }

    if (category) {
      where.category = category
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error("[GET /api/expenses]", error)
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    )
  }
}
