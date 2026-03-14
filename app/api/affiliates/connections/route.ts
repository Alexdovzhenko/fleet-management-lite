import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const affiliateSelect = {
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
}

// GET /api/affiliates/connections?type=pending|sent|connected|all
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  const type = new URL(request.url).searchParams.get("type") || "all"

  try {
    let where: object = {}

    if (type === "pending") {
      // Incoming PENDING requests (others sent to me)
      where = { receiverId: companyId, status: "PENDING" }
    } else if (type === "sent") {
      // Outgoing PENDING requests (I sent)
      where = { senderId: companyId, status: "PENDING" }
    } else if (type === "connected") {
      // All ACCEPTED connections (either direction)
      where = {
        status: "ACCEPTED",
        OR: [{ senderId: companyId }, { receiverId: companyId }],
      }
    } else {
      // All connections involving this company
      where = {
        OR: [{ senderId: companyId }, { receiverId: companyId }],
      }
    }

    const connections = await prisma.affiliateConnection.findMany({
      where,
      include: {
        sender: { select: affiliateSelect },
        receiver: { select: affiliateSelect },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(connections)
  } catch (error) {
    console.error("GET /api/affiliates/connections error:", error)
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 })
  }
}

const sendRequestSchema = z.object({
  receiverId: z.string().min(1),
})

// POST /api/affiliates/connections — send a connection request
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const { receiverId } = sendRequestSchema.parse(body)

    // Prevent self-connection
    if (receiverId === companyId) {
      return NextResponse.json({ error: "Cannot connect with yourself" }, { status: 400 })
    }

    // Check receiver exists
    const receiver = await prisma.company.findUnique({ where: { id: receiverId } })
    if (!receiver) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 })
    }

    // Check for any existing connection in either direction
    const existing = await prisma.affiliateConnection.findFirst({
      where: {
        OR: [
          { senderId: companyId, receiverId },
          { senderId: receiverId, receiverId: companyId },
        ],
      },
    })

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return NextResponse.json({ error: "Already connected" }, { status: 409 })
      }
      if (existing.status === "PENDING") {
        return NextResponse.json({ error: "Connection request already pending" }, { status: 409 })
      }
      // If DECLINED — allow resending by deleting old record and creating new
      if (existing.status === "DECLINED") {
        await prisma.affiliateConnection.delete({ where: { id: existing.id } })
      }
    }

    const connection = await prisma.affiliateConnection.create({
      data: {
        senderId: companyId,
        receiverId,
        status: "PENDING",
      },
      include: {
        sender: { select: affiliateSelect },
        receiver: { select: affiliateSelect },
      },
    })

    return NextResponse.json(connection, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/affiliates/connections error:", error)
    return NextResponse.json({ error: "Failed to send connection request" }, { status: 500 })
  }
}
