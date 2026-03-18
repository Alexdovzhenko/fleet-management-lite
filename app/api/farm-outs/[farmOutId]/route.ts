import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { createNotification } from "@/lib/create-notification"
import { z } from "zod"

const respondSchema = z.object({
  action: z.enum(["ACCEPT", "DECLINE"]),
})

// PATCH /api/farm-outs/[farmOutId] — accept or decline an incoming farm-in
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ farmOutId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { farmOutId } = await params

  try {
    const body = await request.json()
    const { action } = respondSchema.parse(body)

    // Only the receiving company can respond
    const farmOut = await prisma.farmOut.findFirst({
      where: { id: farmOutId, toCompanyId: companyId, status: "PENDING" },
      include: {
        trip: true,
        fromCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
        toCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
      },
    })

    if (!farmOut) {
      return NextResponse.json({ error: "Farm-out not found or already responded" }, { status: 404 })
    }

    const updated = await prisma.farmOut.update({
      where: { id: farmOutId },
      data: {
        status: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
        respondedAt: new Date(),
      },
      include: {
        fromCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
        toCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
      },
    })

    // Notify the sender
    if (action === "ACCEPT") {
      await createNotification({
        companyId: farmOut.fromCompanyId,
        type: "FARM_OUT_ACCEPTED",
        title: "Farm-out accepted",
        body: `${farmOut.toCompany.name} accepted job ${farmOut.trip.tripNumber}`,
        entityId: farmOut.tripId,
        entityType: "trip",
        metadata: { farmOutId, tripNumber: farmOut.trip.tripNumber, affiliateName: farmOut.toCompany.name },
      })
    } else {
      await createNotification({
        companyId: farmOut.fromCompanyId,
        type: "FARM_OUT_DECLINED",
        title: "Farm-out declined",
        body: `${farmOut.toCompany.name} declined job ${farmOut.trip.tripNumber}`,
        entityId: farmOut.tripId,
        entityType: "trip",
        metadata: { farmOutId, tripNumber: farmOut.trip.tripNumber, affiliateName: farmOut.toCompany.name },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PATCH /api/farm-outs/[farmOutId] error:", error)
    return NextResponse.json({ error: "Failed to respond to farm-out" }, { status: 500 })
  }
}

// DELETE /api/farm-outs/[farmOutId] — cancel a pending farm-out (sender only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ farmOutId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { farmOutId } = await params

  try {
    const farmOut = await prisma.farmOut.findFirst({
      where: { id: farmOutId, fromCompanyId: companyId, status: { in: ["PENDING", "ACCEPTED"] } },
      include: {
        trip: { select: { tripNumber: true } },
        fromCompany: { select: { name: true } },
      },
    })
    if (!farmOut) {
      return NextResponse.json({ error: "Farm-out not found or cannot be cancelled" }, { status: 404 })
    }

    await prisma.farmOut.update({
      where: { id: farmOutId },
      data: { status: "CANCELLED" },
    })

    // Notify the receiving company
    await createNotification({
      companyId: farmOut.toCompanyId,
      type: "FARM_OUT_CANCELLED",
      title: "Farm-out cancelled",
      body: `${farmOut.fromCompany.name} cancelled the farm-out for job ${farmOut.trip.tripNumber}`,
      entityId: farmOut.tripId,
      entityType: "trip",
      metadata: { farmOutId, tripNumber: farmOut.trip.tripNumber, affiliateName: farmOut.fromCompany.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/farm-outs/[farmOutId] error:", error)
    return NextResponse.json({ error: "Failed to cancel farm-out" }, { status: 500 })
  }
}
