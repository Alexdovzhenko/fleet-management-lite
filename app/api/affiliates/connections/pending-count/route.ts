import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// GET /api/affiliates/connections/pending-count
// Returns the count of incoming PENDING connection requests for the current company.
// Used by the dock navigation badge.
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const count = await prisma.affiliateConnection.count({
      where: {
        receiverId: companyId,
        status: "PENDING",
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error("GET /api/affiliates/connections/pending-count error:", error)
    return NextResponse.json({ count: 0 })
  }
}
