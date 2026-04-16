import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    // Fetch all customers for this company
    const customers = await prisma.customer.findMany({
      where: { companyId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    })

    // Fetch all affiliate connections where this company is the receiver
    // (companies that have accepted connection with us)
    const affiliateConnections = await prisma.affiliateConnection.findMany({
      where: {
        receiverId: companyId,
        status: "ACCEPTED",
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Format affiliates
    const affiliates = affiliateConnections.map((conn) => ({
      id: conn.sender.id,
      name: conn.sender.name,
      company: null,
    }))

    return NextResponse.json({
      customers,
      affiliates,
    })
  } catch (error) {
    console.error("Billing accounts error:", error)
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    )
  }
}
