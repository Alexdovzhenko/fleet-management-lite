import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// GET /api/affiliates/connections/partners
// Returns a flat list of connected affiliate companies (the OTHER side only).
// The server knows who "me" is, so no client-side filtering needed.
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const connections = await prisma.affiliateConnection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: companyId }, { receiverId: companyId }],
      },
      select: {
        id: true,
        affiliateCode: true,
        senderId: true,
        receiverId: true,
        sender: {
          select: { id: true, name: true, email: true, phone: true, logo: true, city: true, state: true },
        },
        receiver: {
          select: { id: true, name: true, email: true, phone: true, logo: true, city: true, state: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Return only the "other" company for each connection
    const partners = connections.map((c) => {
      const other = c.senderId === companyId ? c.receiver : c.sender
      return {
        connectionId: c.id,
        affiliateCode: c.affiliateCode,
        ...other,
      }
    })

    return NextResponse.json(partners)
  } catch (error) {
    console.error("GET /api/affiliates/connections/partners error:", error)
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 })
  }
}
