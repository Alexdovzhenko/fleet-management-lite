import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateSchema = z.object({
  name:     z.string().optional(),
  address1: z.string().min(1).optional(),
  address2: z.string().optional(),
  city:     z.string().optional(),
  state:    z.string().optional(),
  zip:      z.string().optional(),
  country:  z.string().optional(),
  phone:    z.string().optional(),
  notes:    z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const existing = await prisma.companyAddress.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.companyAddress.update({ where: { id }, data })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PUT /api/addresses/[id] error:", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  try {
    const existing = await prisma.companyAddress.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.companyAddress.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("DELETE /api/addresses/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
