import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        company: true,
      },
      orderBy: { name: "asc" },
    })

    // Fetch affiliates (accepted connections)
    const affiliates = await prisma.affiliateConnection.findMany({
      where: {
        senderId: companyId,
        status: "ACCEPTED",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
      })),
      affiliates: affiliates.map((a) => ({
        id: a.receiver.id,
        name: a.receiver.name,
      })),
    })
  } catch (error) {
    console.error("[GET /api/billing/accounts]", error)
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
  }
}
