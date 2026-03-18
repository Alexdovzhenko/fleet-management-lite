import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notifId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { notifId } = await params

  const notif = await prisma.appNotification.findFirst({
    where: { id: notifId, companyId },
  })
  if (!notif) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.appNotification.update({
    where: { id: notifId },
    data: { readAt: notif.readAt ? notif.readAt : new Date() },
  })

  return NextResponse.json(updated)
}
