import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import type { ConnectionView } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  // Can't view yourself via this endpoint
  if (id === companyId) {
    return NextResponse.json({ error: "Cannot view own profile via affiliates endpoint" }, { status: 400 })
  }

  try {
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        logo: true,
        banner: true,
        city: true,
        state: true,
        website: true,
        createdAt: true,
        sentConnections: {
          where: { receiverId: companyId },
          select: { id: true, status: true, affiliateCode: true },
        },
        receivedConnections: {
          where: { senderId: companyId },
          select: { id: true, status: true, affiliateCode: true },
        },
      },
    })

    if (!company) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    const theyToMe = company.sentConnections[0]
    const meToThem = company.receivedConnections[0]

    let connectionStatus: ConnectionView = "NONE"
    let connectionId: string | undefined

    if (theyToMe) {
      connectionId = theyToMe.id
      if (theyToMe.status === "ACCEPTED") connectionStatus = "CONNECTED"
      else if (theyToMe.status === "PENDING") connectionStatus = "RECEIVED"
      else if (theyToMe.status === "DECLINED") connectionStatus = "DECLINED_BY_ME"
    } else if (meToThem) {
      connectionId = meToThem.id
      if (meToThem.status === "ACCEPTED") connectionStatus = "CONNECTED"
      else if (meToThem.status === "PENDING") connectionStatus = "SENT"
      else if (meToThem.status === "DECLINED") connectionStatus = "DECLINED_BY_THEM"
    }

    const affiliateCode =
      connectionStatus === "CONNECTED"
        ? (theyToMe?.affiliateCode ?? meToThem?.affiliateCode ?? null)
        : null

    return NextResponse.json({
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      logo: company.logo,
      banner: company.banner,
      city: company.city,
      state: company.state,
      website: company.website,
      createdAt: company.createdAt,
      connectionId,
      connectionStatus,
      affiliateCode,
    })
  } catch (error) {
    console.error("GET /api/affiliates/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch affiliate" }, { status: 500 })
  }
}
