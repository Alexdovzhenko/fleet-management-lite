import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(1),
  company: z.string().optional(),
  notes: z.string().optional(),
  preferredVehicleType: z.string().optional(),
  specialRequests: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
  companyId: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId") || "demo-company"
    const search = searchParams.get("search") || ""

    const customers = await prisma.customer.findMany({
      where: {
        companyId,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            { company: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { trips: true } },
      },
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createCustomerSchema.parse(body)

    // Generate next customer number (starts at 1001)
    const last = await prisma.customer.findFirst({
      where: { companyId: data.companyId, customerNumber: { not: null } },
      orderBy: { customerNumber: "desc" },
    })
    const nextNum = last?.customerNumber ? parseInt(last.customerNumber) + 1 : 1001
    const customerNumber = String(nextNum)

    const customer = await prisma.customer.create({
      data: {
        customerNumber,
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        company: data.company || null,
        notes: data.notes || null,
        specialRequests: data.specialRequests || null,
        homeAddress: data.homeAddress || null,
        workAddress: data.workAddress || null,
        companyId: data.companyId,
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
