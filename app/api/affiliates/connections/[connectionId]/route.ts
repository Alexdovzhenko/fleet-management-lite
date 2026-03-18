import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createNotification } from "@/lib/create-notification"
import { z } from "zod"

const actionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
})

// Generate a unique LC-XXXXX affiliate code
async function generateAffiliateCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(10000 + Math.random() * 90000) // 10000–99999
    const code = `LC-${num}`
    const existing = await prisma.affiliateConnection.findUnique({
      where: { affiliateCode: code },
    })
    if (!existing) return code
  }
  throw new Error("Failed to generate unique affiliate code")
}

// PATCH /api/affiliates/connections/[connectionId]
// action: "accept" | "decline" | "cancel"
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { connectionId } = await params

  try {
    const body = await request.json()
    const { action } = actionSchema.parse(body)

    const connection = await prisma.affiliateConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    if (action === "cancel") {
      if (connection.senderId !== companyId) {
        return NextResponse.json({ error: "Only the sender can cancel a request" }, { status: 403 })
      }
      if (connection.status !== "PENDING") {
        return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 })
      }
      await prisma.affiliateConnection.delete({ where: { id: connectionId } })
      return NextResponse.json({ deleted: true })
    }

    if (action === "accept" || action === "decline") {
      if (connection.receiverId !== companyId) {
        return NextResponse.json({ error: "Only the receiver can accept or decline" }, { status: 403 })
      }
      if (connection.status !== "PENDING") {
        return NextResponse.json({ error: "Can only respond to pending requests" }, { status: 400 })
      }

      const updateData: {
        status: "ACCEPTED" | "DECLINED"
        updatedAt: Date
        affiliateCode?: string
      } = {
        status: action === "accept" ? "ACCEPTED" : "DECLINED",
        updatedAt: new Date(),
      }

      // Generate unique affiliate code when accepting
      if (action === "accept") {
        updateData.affiliateCode = await generateAffiliateCode()
      }

      const updated = await prisma.affiliateConnection.update({
        where: { id: connectionId },
        data: updateData,
        include: {
          sender: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
      })

      // Notify the original sender
      if (action === "accept") {
        await createNotification({
          companyId: connection.senderId,
          type: "AFFILIATE_INVITE_ACCEPTED",
          title: "Affiliate invite accepted",
          body: `${updated.receiver.name} accepted your affiliate connection invite`,
          entityId: connectionId,
          entityType: "affiliate",
          metadata: { affiliateName: updated.receiver.name, affiliateCode: updated.affiliateCode },
        })
        // Notify receiver too — they're now connected
        await createNotification({
          companyId: connection.receiverId,
          type: "AFFILIATE_INVITE_ACCEPTED",
          title: "Affiliate connection established",
          body: `You are now connected with ${updated.sender.name}`,
          entityId: connectionId,
          entityType: "affiliate",
          metadata: { affiliateName: updated.sender.name, affiliateCode: updated.affiliateCode },
        })
      } else {
        await createNotification({
          companyId: connection.senderId,
          type: "AFFILIATE_INVITE_DECLINED",
          title: "Affiliate invite declined",
          body: `${updated.receiver.name} declined your affiliate connection invite`,
          entityId: connectionId,
          entityType: "affiliate",
          metadata: { affiliateName: updated.receiver.name },
        })
      }

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PATCH /api/affiliates/connections/[id] error:", error)
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 })
  }
}

// DELETE /api/affiliates/connections/[connectionId] — remove an accepted connection
// The affiliateCode is deleted with the row — no longer usable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { connectionId } = await params

  try {
    const connection = await prisma.affiliateConnection.findUnique({
      where: { id: connectionId },
    })

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    if (connection.senderId !== companyId && connection.receiverId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.affiliateConnection.delete({ where: { id: connectionId } })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("DELETE /api/affiliates/connections/[id] error:", error)
    return NextResponse.json({ error: "Failed to remove connection" }, { status: 500 })
  }
}
