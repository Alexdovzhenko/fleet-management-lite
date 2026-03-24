import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createNotification } from "@/lib/create-notification"
import { z } from "zod"

const schema = z.object({
  companyId:     z.string().min(1),
  clientName:    z.string().min(1),
  clientPhone:   z.string().min(1),
  clientEmail:   z.string().email().optional().or(z.literal("")),
  pickupDate:    z.string().min(1),
  pickupTime:    z.string().optional(),
  pickupAddress: z.string().min(1),
  dropoffAddress:z.string().min(1),
  vehicleType:   z.enum(["SEDAN","SUV","STRETCH_LIMO","SPRINTER","PARTY_BUS","COACH","OTHER"]).optional(),
  passengerCount:z.number().int().min(1).default(1),
  notes:         z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = schema.parse(body)

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: data.companyId },
      select: { id: true, name: true },
    })
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const quote = await prisma.quoteRequest.create({
      data: {
        companyId:     data.companyId,
        clientName:    data.clientName,
        clientPhone:   data.clientPhone,
        clientEmail:   data.clientEmail || null,
        pickupDate:    data.pickupDate,
        pickupTime:    data.pickupTime || null,
        pickupAddress: data.pickupAddress,
        dropoffAddress:data.dropoffAddress,
        vehicleType:   data.vehicleType ?? null,
        passengerCount:data.passengerCount,
        notes:         data.notes || null,
      },
    })

    await createNotification({
      companyId: data.companyId,
      type: "QUOTE_REQUEST_RECEIVED",
      title: `New quote request from ${data.clientName}`,
      body: `${data.pickupAddress} → ${data.dropoffAddress} on ${data.pickupDate}`,
      entityId: quote.id,
      entityType: "quote_request",
      metadata: { clientName: data.clientName, clientPhone: data.clientPhone },
    })

    return NextResponse.json({ success: true, id: quote.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    console.error("POST /api/public/quote-request error:", err)
    return NextResponse.json({ error: "Failed to submit quote request" }, { status: 500 })
  }
}
