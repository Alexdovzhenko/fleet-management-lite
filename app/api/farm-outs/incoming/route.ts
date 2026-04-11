import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

// Sanitized trip fields exposed to the receiving affiliate
// Never include: customer name/contact, internalNotes
const SANITIZED_TRIP_SELECT = {
  id: true,
  tripNumber: true,
  pickupDate: true,
  pickupTime: true,
  pickupAddress: true,
  dropoffAddress: true,
  passengerCount: true,
  luggageCount: true,
  passengerName: true,   // first name only is ok — driver needs to greet
  passengerPhone: true,  // needed for driver coordination
  flightNumber: true,
  airportCode: true,
  notes: true,           // public notes — not internalNotes
  vip: true,
  meetAndGreet: true,
  childSeat: true,
  childSeatDetails: true,
  curbsidePickup: true,
  tripType: true,
  stops: { orderBy: { order: "asc" as const } },
  // NEVER: customer, internalNotes, customerId
}

// GET /api/farm-outs/incoming — pending farm-ins addressed to my company
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const farmOuts = await prisma.farmOut.findMany({
      where: { toCompanyId: companyId, status: "PENDING" },
      include: {
        trip: { select: SANITIZED_TRIP_SELECT },
        fromCompany: { select: { id: true, name: true, phone: true, email: true, logo: true, city: true, state: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(farmOuts)
  } catch (error) {
    console.error("GET /api/farm-outs/incoming error:", error)
    return NextResponse.json({ error: "Failed to fetch incoming farm-outs" }, { status: 500 })
  }
}
