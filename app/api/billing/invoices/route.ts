import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import { z } from "zod"

const getInvoicesSchema = z.object({
  status: z.enum(["OPEN", "SETTLED"]).optional(),
  search: z.string().optional(),
  date: z.string().optional(), // ISO date string
  accountId: z.string().optional(),
  accountType: z.enum(["CUSTOMER", "AFFILIATE"]).optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const url = new URL(request.url)
    const params = {
      status: url.searchParams.get("status"),
      search: url.searchParams.get("search"),
      date: url.searchParams.get("date"),
      accountId: url.searchParams.get("accountId"),
      accountType: url.searchParams.get("accountType"),
    }

    const validated = getInvoicesSchema.parse(params)

    // Build where clause
    const where: any = {
      companyId,
      ...(validated.status && {
        status: validated.status,
      }),
      ...(validated.accountId && {
        customerId: validated.accountId,
      }),
      ...(validated.date && {
        trip: {
          pickupDate: {
            gte: new Date(`${validated.date}T00:00:00Z`),
            lt: new Date(`${validated.date}T23:59:59Z`),
          },
        },
      }),
      ...(validated.search && {
        OR: [
          { customer: { name: { contains: validated.search, mode: "insensitive" } } },
          { customer: { company: { contains: validated.search, mode: "insensitive" } } },
          { invoiceNumber: { contains: validated.search, mode: "insensitive" } },
          { trip: { tripNumber: { contains: validated.search, mode: "insensitive" } } },
        ],
      }),
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        trip: {
          select: {
            id: true,
            tripNumber: true,
            pickupDate: true,
            createdById: true,
            createdBy: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Billing invoices error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    )
  }
}
