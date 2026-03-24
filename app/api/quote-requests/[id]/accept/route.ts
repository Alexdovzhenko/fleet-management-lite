import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { generateConfirmationNumber } from "@/lib/utils"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx
  const { id } = await params

  try {
    const quote = await prisma.quoteRequest.findFirst({ where: { id, companyId } })
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (quote.status === "ACCEPTED") {
      return NextResponse.json({ error: "Already accepted" }, { status: 400 })
    }

    // Convert MM/DD/YYYY → YYYY-MM-DD if needed for Trip.pickupDate
    const pickupDate = quote.pickupDate

    const trip = await prisma.trip.create({
      data: {
        tripNumber:     generateConfirmationNumber(),
        companyId,
        status:         "CONFIRMED",
        tripType:       "ONE_WAY",
        pickupDate,
        pickupTime:     quote.pickupTime ?? "",
        pickupAddress:  quote.pickupAddress,
        dropoffAddress: quote.dropoffAddress,
        passengerName:  quote.clientName,
        passengerPhone: quote.clientPhone,
        passengerEmail: quote.clientEmail ?? null,
        passengerCount: quote.passengerCount,
        customerId:     undefined,
        notes:          quote.notes ?? null,
        price:          quote.price ?? null,
        totalPrice:     quote.price ?? null,
      },
    })

    const updated = await prisma.quoteRequest.update({
      where: { id },
      data: { status: "ACCEPTED", tripId: trip.id },
    })

    return NextResponse.json({ quote: updated, trip })
  } catch (err) {
    console.error("POST /api/quote-requests/[id]/accept error:", err)
    return NextResponse.json({ error: "Failed to accept quote request" }, { status: 500 })
  }
}
