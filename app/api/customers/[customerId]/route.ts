import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1).optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        trips: {
          orderBy: { pickupDate: "desc" },
          take: 10,
          include: {
            driver: { select: { id: true, name: true } },
            vehicle: { select: { id: true, name: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

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
  try {
    const { customerId } = await params
    const body = await request.json()
    const data = updateCustomerSchema.parse(body)

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...data,
        email: data.email || null,
      },
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
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    await prisma.customer.delete({ where: { id: customerId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/customers/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
