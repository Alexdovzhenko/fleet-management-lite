import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") as "OPEN" | "SETTLED" | null
    const search = searchParams.get("search")
    const dateStart = searchParams.get("dateStart")
    const dateEnd = searchParams.get("dateEnd")
    const accountId = searchParams.get("accountId")

    // Build where clause
    const whereClause: any = {
      companyId,
    }

    // Filter by status
    if (status) {
      whereClause.status = status
    }

    // Filter by customerId
    if (accountId) {
      whereClause.customerId = accountId
    }

    // Filter by search (invoiceNumber, customer name, or trip number)
    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { trip: { tripNumber: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Filter by date range (pickup date of trip, or createdAt for standalone invoices)
    if (dateStart || dateEnd) {
      const dateFilter: any = {}

      if (dateStart) {
        dateFilter.gte = new Date(dateStart)
      }

      if (dateEnd) {
        const endDate = new Date(dateEnd)
        endDate.setDate(endDate.getDate() + 1) // Include entire end date
        dateFilter.lt = endDate
      }

      // Use OR so standalone invoices (tripId=null) are included via createdAt,
      // and trip-linked invoices are matched by their trip's pickupDate
      if (!whereClause.AND) whereClause.AND = []
      whereClause.AND.push({
        OR: [
          { trip: { pickupDate: dateFilter } },
          { tripId: null, createdAt: dateFilter },
        ],
      })
    }

    // Fetch invoices with customer and trip data
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trip: {
          select: {
            id: true,
            tripNumber: true,
            pickupDate: true,
            pickupTime: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Transform to match Invoice interface
    const transformedInvoices = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      customerId: inv.customerId,
      customer: inv.customer,
      tripId: inv.tripId,
      trip: inv.trip,
      subtotal: inv.subtotal.toString(),
      gratuity: inv.gratuity?.toString(),
      tax: inv.tax?.toString(),
      total: inv.total.toString(),
      notes: inv.notes,
      dueDate: inv.dueDate?.toISOString(),
      paidAt: inv.paidAt?.toISOString(),
      paymentMethod: inv.paymentMethod,
      companyId: inv.companyId,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
      // Add summary field for compatibility with BillingModal
      summary: {
        total: parseFloat(inv.total.toString()),
      },
    }))

    return NextResponse.json(transformedInvoices)
  } catch (error) {
    console.error("[GET /api/billing/invoices]", error)
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 })
  }
}
