import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  await prisma.appNotification.updateMany({
    where: { companyId, readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ success: true })
}
