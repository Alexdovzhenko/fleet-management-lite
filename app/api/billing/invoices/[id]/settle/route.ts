import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const settleSchema = z.object({
  settledAt: z.string().datetime().optional(),
  settledBy: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, userId, role } = auth.ctx

  // Only OWNER or DISPATCHER can settle invoices
  if (role !== "OWNER" && role !== "DISPATCHER") {
    return NextResponse.json(
      { error: "Unauthorized: only OWNER or DISPATCHER can settle invoices" },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validated = settleSchema.parse(body)

    // Fetch invoice to verify ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.companyId !== companyId) {
      return NextResponse.json(
        { error: "Unauthorized: invoice belongs to another company" },
        { status: 403 }
      )
    }

    // Update invoice status to SETTLED
    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: "SETTLED",
        paidAt: validated.settledAt ? new Date(validated.settledAt) : new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Settle invoice error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to settle invoice" },
      { status: 500 }
    )
  }
}
