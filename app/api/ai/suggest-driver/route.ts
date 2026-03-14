import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { tripId } = await request.json()

    const [trip, drivers] = await Promise.all([
      prisma.trip.findFirst({
        where: { id: tripId, companyId },
        include: {
          customer: { select: { name: true, preferredDriverId: true } },
          vehicle: { select: { type: true, capacity: true } },
        },
      }),
      prisma.driver.findMany({
        where: { companyId, status: "ACTIVE" },
        include: {
          trips: {
            where: {
              pickupDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
              status: { notIn: ["COMPLETED", "CANCELLED", "NO_SHOW"] },
            },
            select: { pickupTime: true, status: true },
          },
        },
      }),
    ])

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 })

    const context = `
Trip: ${trip.pickupTime} pickup from ${trip.pickupAddress} to ${trip.dropoffAddress}
Trip type: ${trip.tripType}
Passengers: ${trip.passengerCount}
VIP: ${trip.vip}
Customer preferred driver ID: ${trip.customer.preferredDriverId || "none"}

Available drivers:
${drivers.map((d) => `- ${d.name} (ID: ${d.id}): ${d.trips.length} trips today, currently ${d.trips.find((t: { status: string }) => ["DISPATCHED", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(t.status)) ? "BUSY" : "AVAILABLE"}`).join("\n")}
`

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: context }],
      system: `You are a dispatch assistant. Given trip details and driver availability, suggest the best driver.
Return ONLY JSON: {"driverId": "id", "reason": "one sentence reason"}
Prioritize: customer preference > availability > fewest trips today.`,
    })

    const content = message.content[0]
    if (content.type !== "text") return NextResponse.json({ error: "Unexpected AI response" }, { status: 500 })

    const suggestion = JSON.parse(content.text.trim())
    return NextResponse.json(suggestion)
  } catch (error) {
    console.error("POST /api/ai/suggest-driver error:", error)
    return NextResponse.json({ error: "Failed to get driver suggestion" }, { status: 500 })
  }
}
