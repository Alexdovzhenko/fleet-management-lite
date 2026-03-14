import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const last = await prisma.customer.findFirst({
    where: { companyId, customerNumber: { not: null } },
    orderBy: { customerNumber: "desc" },
  })
  const next = last?.customerNumber ? parseInt(last.customerNumber) + 1 : 1001
  return NextResponse.json({ nextNumber: String(next) })
}
