import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// GET /api/affiliates/search?q=xxx
// Returns connected affiliates matching by company name OR affiliate code (LC-XXXXX)
// Only returns ACCEPTED connections — disconnected affiliates are invisible
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const q = new URL(request.url).searchParams.get("q")?.trim() || ""
  if (!q) return NextResponse.json([])

  try {
    // Find all accepted connections for this company
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
    })

    const qLower = q.toLowerCase()

    const results = connections
      .map((conn) => {
        // The "other" party is whoever isn't us
        const affiliate = conn.senderId === companyId ? conn.receiver : conn.sender
        return {
          connectionId: conn.id,
          affiliateCode: conn.affiliateCode,
          id: affiliate.id,
          name: affiliate.name,
          email: affiliate.email,
          phone: affiliate.phone,
          logo: affiliate.logo,
          city: affiliate.city,
          state: affiliate.state,
        }
      })
      .filter((a) =>
        a.name.toLowerCase().includes(qLower) ||
        (a.affiliateCode?.toLowerCase() === qLower) ||
        (a.affiliateCode?.toLowerCase().includes(qLower))
      )
      .slice(0, 8)

    return NextResponse.json(results)
  } catch (error) {
    console.error("GET /api/affiliates/search error:", error)
    return NextResponse.json({ error: "Failed to search affiliates" }, { status: 500 })
  }
}
