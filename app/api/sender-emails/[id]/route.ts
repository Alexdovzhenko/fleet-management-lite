import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateSchema = z.object({
  email:     z.string().email().optional(),
  label:     z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  const existing = await prisma.senderEmail.findFirst({ where: { id, companyId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await request.json()
  const data = updateSchema.parse(body)

  if (data.isDefault) {
    await prisma.senderEmail.updateMany({ where: { companyId }, data: { isDefault: false } })
  }

  const updated = await prisma.senderEmail.update({
    where: { id },
    data: {
      ...(data.email     !== undefined ? { email:     data.email }     : {}),
      ...(data.label     !== undefined ? { label:     data.label }     : {}),
      ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  const existing = await prisma.senderEmail.findFirst({ where: { id, companyId } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.senderEmail.delete({ where: { id } })

  // Promote another sender to default if we deleted the default
  if (existing.isDefault) {
    const next = await prisma.senderEmail.findFirst({ where: { companyId }, orderBy: { createdAt: "asc" } })
    if (next) await prisma.senderEmail.update({ where: { id: next.id }, data: { isDefault: true } })
  }

  return NextResponse.json({ success: true })
}
