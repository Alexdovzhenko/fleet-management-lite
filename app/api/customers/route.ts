import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  isBillingContact: z.boolean().optional(),
  isPassenger: z.boolean().optional(),
  isBookingContact: z.boolean().optional(),
  homeAddress: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  driverNotes: z.string().optional(),
  preferredVehicleType: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const search = new URL(request.url).searchParams.get("search") || ""

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { company: { contains: search, mode: "insensitive" } },
            { customerNumber: { contains: search.replace(/^#/, "") } },
          ],
        }),
      },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { trips: true } } },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const body = await request.json()
    const data = createCustomerSchema.parse(body)

    const last = await prisma.customer.findFirst({
      where: { companyId, customerNumber: { not: null } },
      orderBy: { customerNumber: "desc" },
    })
    const nextNum = last?.customerNumber ? parseInt(last.customerNumber) + 1 : 1001
    const customerNumber = String(nextNum)

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        isBillingContact: data.isBillingContact ?? false,
        isPassenger: data.isPassenger ?? false,
        isBookingContact: data.isBookingContact ?? false,
        homeAddress: data.homeAddress || null,
        addressLine2: data.addressLine2 || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        country: data.country || null,
        notes: data.notes || null,
        specialRequests: data.specialRequests || null,
        driverNotes: data.driverNotes || null,
        companyId,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
