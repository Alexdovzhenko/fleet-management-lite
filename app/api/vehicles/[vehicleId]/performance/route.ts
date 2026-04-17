import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-context"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { companyId } = auth.ctx

  try {
    const { vehicleId } = await params
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
    endDate.setDate(endDate.getDate() + 1)

    // Get vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        trips: {
          where: {
            pickupDate: { gte: startDate, lt: endDate },
            companyId,
          },
          include: {
            invoice: {
              select: { total: true },
            },
          },
        },
        expenses: {
          where: {
            date: { gte: startDate, lt: endDate },
          },
        },
      },
    })

    if (!vehicle || vehicle.companyId !== companyId) {
      return NextResponse.json(
        { error: "Vehicle not found" },
        { status: 404 }
      )
    }

    const totalRevenue = vehicle.trips.reduce(
      (sum, t) => sum + Number(t.invoice?.total || 0),
      0
    )
    const totalExpenses = vehicle.expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0
    )
    const netProfit = totalRevenue - totalExpenses
    const trips = vehicle.trips.length
    const avgTripValue = trips > 0 ? totalRevenue / trips : 0
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // Get best and worst trips
    const sortedTrips = [...vehicle.trips].sort(
      (a, b) => Number(b.invoice?.total || 0) - Number(a.invoice?.total || 0)
    )

    const topTrip = sortedTrips[0]
      ? {
          tripNumber: sortedTrips[0].tripNumber,
          revenue: Number(sortedTrips[0].invoice?.total || 0),
          date: sortedTrips[0].pickupDate.toISOString(),
        }
      : null

    const lowestTrip = sortedTrips[sortedTrips.length - 1]
      ? {
          tripNumber: sortedTrips[sortedTrips.length - 1].tripNumber,
          revenue: Number(sortedTrips[sortedTrips.length - 1].invoice?.total || 0),
          date: sortedTrips[sortedTrips.length - 1].pickupDate.toISOString(),
        }
      : null

    return NextResponse.json({
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleType: vehicle.type,
      trips,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      avgTripValue: Number(avgTripValue.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(1)),
      topTrip,
      lowestTrip,
    })
  } catch (error) {
    console.error("[GET /api/vehicles/[vehicleId]/performance]", error)
    return NextResponse.json(
      { error: "Failed to fetch vehicle performance" },
      { status: 500 }
    )
  }
}
