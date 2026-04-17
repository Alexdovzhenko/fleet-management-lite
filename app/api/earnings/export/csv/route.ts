import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"
import {
  generateExpensesCSV,
  generateEarningsSummaryCSV,
  generateFleetPerformanceCSV,
} from "@/lib/exports/csv"

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId, role } = auth.ctx

  if (role !== "OWNER") {
    return NextResponse.json(
      { error: "Only owners can export data" },
      { status: 403 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")
    const type = searchParams.get("type") || "summary" // summary, expenses, fleet, all

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setDate(endDate.getDate() + 1)

    let csvContent = ""
    let filename = `earnings-export-${startDateStr}-to-${endDateStr}.csv`

    if (type === "summary" || type === "all") {
      // Fetch summary data
      const invoices = await prisma.invoice.findMany({
        where: {
          companyId,
          OR: [
            {
              trip: {
                pickupDate: { gte: startDate, lt: endDate },
              },
            },
            {
              tripId: null,
              createdAt: { gte: startDate, lt: endDate },
            },
          ],
        },
        select: { status: true, total: true },
      })

      const expenses = await prisma.expense.findMany({
        where: {
          companyId,
          date: { gte: startDate, lt: endDate },
        },
        select: { amount: true, category: true },
      })

      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + Number(inv.total),
        0
      )
      const collectedRevenue = invoices
        .filter((inv) => inv.status === "PAID" || inv.status === "SETTLED")
        .reduce((sum, inv) => sum + Number(inv.total), 0)
      const uncollectedRevenue = invoices
        .filter((inv) => inv.status === "OPEN")
        .reduce((sum, inv) => sum + Number(inv.total), 0)

      const totalExpenses = expenses.reduce(
        (sum, exp) => sum + Number(exp.amount),
        0
      )

      const summaryData = {
        period: { start: startDateStr, end: endDateStr },
        metrics: {
          totalRevenue,
          collectedRevenue,
          uncollectedRevenue,
          totalExpenses,
          fixedExpenses: expenses
            .filter((e) => e.category === "FIXED")
            .reduce((sum, e) => sum + Number(e.amount), 0),
          variableExpenses: expenses
            .filter((e) => e.category === "VARIABLE")
            .reduce((sum, e) => sum + Number(e.amount), 0),
        },
        deltas: {
          revenue: { pct: 0, amount: 0 },
          expenses: { pct: 0, amount: 0 },
        },
      }

      csvContent += generateEarningsSummaryCSV(summaryData)
    }

    if (type === "expenses" || type === "all") {
      if (csvContent) csvContent += "\n\n"

      const expenses = await prisma.expense.findMany({
        where: {
          companyId,
          date: { gte: startDate, lt: endDate },
        },
        include: {
          vehicle: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      })

      csvContent += "EXPENSES\n"
      csvContent += generateExpensesCSV(expenses)
    }

    if (type === "fleet" || type === "all") {
      if (csvContent) csvContent += "\n\n"

      const vehicles = await prisma.vehicle.findMany({
        where: { companyId },
        include: {
          trips: {
            where: { pickupDate: { gte: startDate, lt: endDate } },
            include: {
              invoice: { select: { total: true } },
            },
          },
          expenses: {
            where: { date: { gte: startDate, lt: endDate } },
          },
        },
      })

      const vehicleData = vehicles.map((v) => ({
        name: v.name,
        type: v.type,
        trips: v.trips.length,
        revenue: v.trips.reduce(
          (sum, t) => sum + Number(t.invoice?.total || 0),
          0
        ),
        expenses: v.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        profitability: v.trips.reduce((sum, t) => sum + Number(t.invoice?.total || 0), 0) - v.expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        status: "ok",
      }))

      csvContent += "FLEET PERFORMANCE\n"
      csvContent += generateFleetPerformanceCSV(vehicleData)
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[GET /api/earnings/export/csv]", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
