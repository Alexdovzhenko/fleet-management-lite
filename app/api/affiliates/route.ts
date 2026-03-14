import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import type { ConnectionView } from "@/types"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const sp = new URL(request.url).searchParams
    const search      = sp.get("search")      || ""
    const location    = sp.get("location")    || ""
    const vehicleTypes = sp.get("vehicleTypes")
      ? sp.get("vehicleTypes")!.split(",").filter(Boolean)
      : []

    const companies = await prisma.company.findMany({
      where: {
        id: { not: companyId },
        onboardingCompleted: true,
        ...(search && {
          OR: [
            { name:  { contains: search,   mode: "insensitive" } },
            { email: { contains: search,   mode: "insensitive" } },
          ],
        }),
        ...(location && (() => {
          // Support "City, ST" format — search city part against city, state part against state
          const [cityPart, statePart] = location.split(",").map((s) => s.trim())
          const conditions: object[] = [
            { city:  { contains: cityPart,  mode: "insensitive" } },
            { state: { contains: cityPart,  mode: "insensitive" } },
          ]
          if (statePart) {
            conditions.push({ state: { contains: statePart, mode: "insensitive" } })
          }
          return { OR: conditions }
        })()),
        ...(vehicleTypes.length > 0 && {
          vehicles: {
            some: {
              type:   { in: vehicleTypes as any[] },
              status: "ACTIVE",
            },
          },
        }),
      },
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
      orderBy: { name: "asc" },
      take: 100,
    })

    const result = companies.map((c) => {
      const theyToMe = c.sentConnections[0]
      const meToThem = c.receivedConnections[0]

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

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        logo: c.logo,
        banner: c.banner,
        city: c.city,
        state: c.state,
        website: c.website,
        createdAt: c.createdAt,
        connectionId,
        connectionStatus,
        affiliateCode,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /api/affiliates error:", error)
    return NextResponse.json({ error: "Failed to fetch affiliates" }, { status: 500 })
  }
}
