import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1).optional(),
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
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { customerId } = await params
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, companyId },
      include: {
        trips: {
          orderBy: { pickupDate: "desc" },
          take: 10,
          include: {
            driver: { select: { id: true, name: true } },
            vehicle: { select: { id: true, name: true } },
          },
        },
        invoices: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    })

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    return NextResponse.json(customer)
  } catch (error) {
    console.error("GET /api/customers/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { customerId } = await params
    const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId } })
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

    const body = await request.json()
    const data = updateCustomerSchema.parse(body)
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { ...data, email: data.email || null },
    })
    return NextResponse.json(customer)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    console.error("PUT /api/customers/[id] error:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { customerId } = await params
    const existing = await prisma.customer.findFirst({ where: { id: customerId, companyId } })
    if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    await prisma.customer.delete({ where: { id: customerId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
