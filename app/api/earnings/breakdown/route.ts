import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  // Only admins can view earnings
  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can access earnings data" },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    const tab = searchParams.get("tab") || "overview"

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setDate(endDate.getDate() + 1)

    // Fetch data by tab
    if (tab === "overview") {
      return NextResponse.json(
        await getOverviewData(companyId, startDate, endDate)
      )
    } else if (tab === "expenses") {
      return NextResponse.json(
        await getExpensesData(companyId, startDate, endDate)
      )
    } else if (tab === "fleet") {
      return NextResponse.json(
        await getFleetData(companyId, startDate, endDate)
      )
    } else if (tab === "compare") {
      // Handle comparisons
      return NextResponse.json({ data: "Compare tab data" })
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 })
  } catch (error) {
    console.error("[GET /api/earnings/breakdown]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch earnings breakdown" },
      { status: 500 }
    )
  }
}

async function getOverviewData(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  // Fetch trips with invoices and expenses grouped by day
  const trips = await prisma.trip.findMany({
    where: {
      companyId,
      pickupDate: { gte: startDate, lt: endDate },
    },
    include: {
      vehicle: {
        select: { id: true, name: true, type: true },
      },
      invoice: {
        select: { id: true, total: true, status: true },
      },
    },
  })

  // Group trips by day for revenue trend
  const trendMap = new Map<string, { revenue: number; trips: number }>()

  for (const trip of trips) {
    const dateKey = trip.pickupDate.toISOString().split("T")[0]
    const revenue =
      trip.invoice && trip.invoice.status !== "DRAFT" ? Number(trip.invoice.total) : 0

    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { revenue: 0, trips: 0 })
    }

    const current = trendMap.get(dateKey)!
    current.revenue += revenue
    current.trips += 1
  }

  // Get expenses for trend
  const expenses = await prisma.expense.findMany({
    where: { companyId, date: { gte: startDate, lt: endDate } },
    select: { date: true, amount: true },
  })

  // Add expenses to trend
  for (const expense of expenses) {
    const dateKey = expense.date.toISOString().split("T")[0]
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { revenue: 0, trips: 0 })
    }
  }

  const revenueTrend = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Calculate collection metrics
  const invoicesWithTrips = await prisma.invoice.findMany({
    where: {
      companyId,
      status: { not: "DRAFT" },
      tripId: { not: null },
      trip: { pickupDate: { gte: startDate, lt: endDate } },
    },
    select: { total: true, status: true },
  })

  const standaloneInvoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: { not: "DRAFT" },
      tripId: null,
      createdAt: { gte: startDate, lt: endDate },
    },
    select: { total: true, status: true },
  })

  const invoices = [...invoicesWithTrips, ...standaloneInvoices]

  const collected = invoices
    .filter((inv) => inv.status === "PAID" || inv.status === "SETTLED")
    .reduce((sum, inv) => sum + Number(inv.total), 0)

  const uncollected = invoices
    .filter((inv) => inv.status !== "PAID" && inv.status !== "SETTLED" && inv.status !== "CANCELLED")
    .reduce((sum, inv) => sum + Number(inv.total), 0)

  // Expense breakdown
  const expenseBreakdown = await prisma.expense.findMany({
    where: { companyId, date: { gte: startDate, lt: endDate } },
    select: { category: true, amount: true },
  })

  const fixedTotal = expenseBreakdown
    .filter((e) => e.category === "FIXED")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  const variableTotal = expenseBreakdown
    .filter((e) => e.category === "VARIABLE")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  // Fleet ranking
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId },
    include: {
      trips: {
        where: { pickupDate: { gte: startDate, lt: endDate } },
        include: {
          invoice: { select: { total: true, status: true } },
        },
      },
    },
  })

  const fleetRanking = vehicles
    .map((v) => ({
      vehicleId: v.id,
      name: v.name,
      type: v.type,
      trips: v.trips.length,
      revenue: v.trips.reduce(
        (sum, t) =>
          t.invoice && t.invoice.status !== "DRAFT"
            ? sum + Number(t.invoice.total)
            : sum,
        0
      ),
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    revenueTrend,
    collectionPie: {
      collected: Number(collected.toFixed(2)),
      uncollected: Number(uncollected.toFixed(2)),
    },
    expenseBreakdown: {
      fixed: Number(fixedTotal.toFixed(2)),
      variable: Number(variableTotal.toFixed(2)),
    },
    fleetRanking,
  }
}

async function getExpensesData(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const expenses = await prisma.expense.findMany({
    where: { companyId, date: { gte: startDate, lt: endDate } },
    include: {
      vehicle: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
  })

  // Group by subcategory
  const fixedMap = new Map<string, number>()
  const variableMap = new Map<string, number>()

  for (const exp of expenses) {
    const map = exp.category === "FIXED" ? fixedMap : variableMap
    const current = map.get(exp.subcategory) || 0
    map.set(exp.subcategory, current + Number(exp.amount))
  }

  const fixedExpenses = Array.from(fixedMap.entries()).map(([subcategory, amount]) => ({
    subcategory,
    amount: Number(amount.toFixed(2)),
  }))

  const variableExpenses = Array.from(variableMap.entries()).map(([subcategory, amount]) => ({
    subcategory,
    amount: Number(amount.toFixed(2)),
  }))

  return {
    fixedExpenses,
    variableExpenses,
    expenseDetails: expenses.map((e) => ({
      id: e.id,
      category: e.category,
      subcategory: e.subcategory,
      amount: Number(e.amount),
      date: e.date.toISOString().split("T")[0],
      vehicle: e.vehicle?.name || "Company-wide",
      notes: e.notes,
    })),
  }
}

async function getFleetData(
  companyId: string,
  startDate: Date,
  endDate: Date
) {
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId },
    include: {
      trips: {
        where: { pickupDate: { gte: startDate, lt: endDate } },
        include: {
          invoice: { select: { total: true, status: true } },
        },
      },
      expenses: {
        where: { date: { gte: startDate, lt: endDate } },
        select: { amount: true },
      },
    },
  })

  const fleetPerformance = vehicles
    .map((v) => {
      const revenue = v.trips.reduce(
        (sum, t) =>
          t.invoice && t.invoice.status !== "DRAFT"
            ? sum + Number(t.invoice.total)
            : sum,
        0
      )
      const expenses = v.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
      const profitability = revenue - expenses

      return {
        vehicleId: v.id,
        name: v.name,
        type: v.type,
        revenue: Number(revenue.toFixed(2)),
        expenses: Number(expenses.toFixed(2)),
        profitability: Number(profitability.toFixed(2)),
        trips: v.trips.length,
        status: profitability < 0 ? "alert" : profitability < revenue * 0.1 ? "warning" : "ok",
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return { fleetPerformance }
}
