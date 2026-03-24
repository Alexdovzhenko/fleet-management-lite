import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const patchSchema = z.object({
  price:  z.number().positive().optional(),
  status: z.enum(["NEW", "PENDING", "ACCEPTED", "DECLINED"]).optional(),
  notes:  z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  try {
    const quote = await prisma.quoteRequest.findFirst({
      where: { id, companyId },
    })
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(quote)
  } catch (err) {
    console.error("GET /api/quote-requests/[id] error:", err)
    return NextResponse.json({ error: "Failed to fetch quote request" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  try {
    const body = await request.json()
    const data = patchSchema.parse(body)

    const existing = await prisma.quoteRequest.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: {
        ...(data.price  !== undefined ? { price: data.price, status: "PENDING" } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.notes  !== undefined ? { notes: data.notes } : {}),
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 })
    console.error("PATCH /api/quote-requests/[id] error:", err)
    return NextResponse.json({ error: "Failed to update quote request" }, { status: 500 })
  }
}
