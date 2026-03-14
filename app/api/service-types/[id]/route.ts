import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { id } = await params
    const existing = await prisma.serviceType.findFirst({ where: { id, companyId } })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const body = await request.json()
    const type = await prisma.serviceType.update({ where: { id }, data: { isEnabled: body.isEnabled } })
    return NextResponse.json(type)
  } catch {
    return NextResponse.json({ error: "Failed to update service type" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { id } = await params
    const type = await prisma.serviceType.findFirst({ where: { id, companyId } })
    if (!type) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (type.isBuiltIn) return NextResponse.json({ error: "Cannot delete built-in types" }, { status: 400 })
    await prisma.serviceType.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete service type" }, { status: 500 })
  }
}
