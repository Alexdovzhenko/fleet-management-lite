import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// GET /api/farm-outs — all farm-outs involving my company (sent + received)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const { searchParams } = new URL(request.url)
  const direction = searchParams.get("direction") // "sent" | "received" | null (both)
  const status = searchParams.get("status") // "PENDING" | "ACCEPTED" etc.

  try {
    const where: Record<string, unknown> = {
      ...(status ? { status } : {}),
    }

    if (direction === "sent") {
      where.fromCompanyId = companyId
    } else if (direction === "received") {
      where.toCompanyId = companyId
    } else {
      where.OR = [{ fromCompanyId: companyId }, { toCompanyId: companyId }]
    }

    const farmOuts = await prisma.farmOut.findMany({
      where,
      include: {
        trip: {
          select: {
            id: true,
            tripNumber: true,
            pickupDate: true,
            pickupTime: true,
            pickupAddress: true,
            dropoffAddress: true,
            passengerCount: true,
            status: true,
          },
        },
        fromCompany: { select: { id: true, name: true, logo: true, city: true, state: true } },
        toCompany: { select: { id: true, name: true, logo: true, city: true, state: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(farmOuts)
  } catch (error) {
    console.error("GET /api/farm-outs error:", error)
    return NextResponse.json({ error: "Failed to fetch farm-outs" }, { status: 500 })
  }
}
