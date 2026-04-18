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

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)
    endDate.setDate(endDate.getDate() + 1) // Include entire end date

    // Current period metrics
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId,
          OR: [
            {
              trip: {
                pickupDate: {
                  gte: startDate,
                  lt: endDate,
                },
              },
            },
            {
              tripId: null,
              createdAt: {
                gte: startDate,
                lt: endDate,
              },
            },
          ],
        },
        select: {
          status: true,
          total: true,
          paidAt: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          companyId,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          amount: true,
          category: true,
        },
      }),
    ])

    // Calculate current period
    const totalRevenue = invoices.reduce(
      (sum, inv) => sum + (inv.total ? Number(inv.total) : 0),
      0
    )

    const collectedRevenue = invoices
      .filter((inv) => inv.status === "PAID" || inv.status === "SETTLED")
      .reduce((sum, inv) => sum + (inv.total ? Number(inv.total) : 0), 0)

    // Uncollected = all non-collected, non-cancelled invoices (includes OPEN, SENT, VIEWED, OVERDUE, DRAFT)
    const uncollectedRevenue = invoices
      .filter((inv) => inv.status !== "PAID" && inv.status !== "SETTLED" && inv.status !== "CANCELLED")
      .reduce((sum, inv) => sum + (inv.total ? Number(inv.total) : 0), 0)

    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    )

    const fixedExpenses = expenses
      .filter((exp) => exp.category === "FIXED")
      .reduce((sum, exp) => sum + Number(exp.amount), 0)

    const variableExpenses = expenses
      .filter((exp) => exp.category === "VARIABLE")
      .reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Previous period (same duration, shifted back)
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const previousStart = new Date(startDate)
    previousStart.setDate(previousStart.getDate() - periodDays)
    const previousEnd = new Date(startDate)

    const [prevInvoices, prevExpenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          companyId,
          OR: [
            {
              trip: {
                pickupDate: {
                  gte: previousStart,
                  lt: previousEnd,
                },
              },
            },
            {
              tripId: null,
              createdAt: {
                gte: previousStart,
                lt: previousEnd,
              },
            },
          ],
        },
        select: {
          status: true,
          total: true,
        },
      }),
      prisma.expense.findMany({
        where: {
          companyId,
          date: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
        select: {
          amount: true,
        },
      }),
    ])

    const prevTotalRevenue = prevInvoices.reduce(
      (sum, inv) => sum + (inv.total ? Number(inv.total) : 0),
      0
    )

    const prevTotalExpenses = prevExpenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0
    )

    // Calculate deltas
    const revenueDelta = prevTotalRevenue
      ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      : totalRevenue > 0
        ? 100
        : 0

    const expensesDelta = prevTotalExpenses
      ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
      : totalExpenses > 0
        ? 100
        : 0

    return NextResponse.json({
      period: {
        start: startDateStr,
        end: endDateStr,
      },
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        collectedRevenue: Number(collectedRevenue.toFixed(2)),
        uncollectedRevenue: Number(uncollectedRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        fixedExpenses: Number(fixedExpenses.toFixed(2)),
        variableExpenses: Number(variableExpenses.toFixed(2)),
        profit: Number((totalRevenue - totalExpenses).toFixed(2)),
      },
      deltas: {
        revenue: {
          pct: Number(revenueDelta.toFixed(1)),
          amount: Number((totalRevenue - prevTotalRevenue).toFixed(2)),
        },
        expenses: {
          pct: Number(expensesDelta.toFixed(1)),
          amount: Number((totalExpenses - prevTotalExpenses).toFixed(2)),
        },
      },
    })
  } catch (error) {
    console.error("[GET /api/earnings/summary]", error)
    return NextResponse.json(
      { error: "Failed to fetch earnings summary" },
      { status: 500 }
    )
  }
}
