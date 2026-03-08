"use client"

import { AlertTriangle, TrendingUp, Activity, DollarSign, List } from "lucide-react"
import { useTodayTrips } from "@/lib/hooks/use-trips"
import { TripStatusBadge } from "@/components/trips/trip-status-badge"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { formatTime, formatCurrency, truncateAddress } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"
import type { Trip } from "@/types"

function StatCard({ label, value, sub, color }: {
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-2xl font-bold" style={{ color: color || "#111827" }}>{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { data: trips, isLoading } = useTodayTrips()
  const today = format(new Date(), "EEEE, MMMM d")

  const tripsToday = trips?.length || 0
  const inProgress = trips?.filter((t) =>
    ["IN_PROGRESS", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED"].includes(t.status)
  ).length || 0
  const unassigned = trips?.filter((t) =>
    !t.driverId && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(t.status)
  ).length || 0
  const revenueToday = trips?.reduce((sum, t) => {
    return sum + (t.totalPrice ? parseFloat(t.totalPrice.toString()) : 0)
  }, 0) || 0

  const upcomingTrips = trips?.filter((t) =>
    !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(t.status)
  ).slice(0, 5) || []

  const alerts: { message: string; tripId?: string }[] = []
  if (unassigned > 0) {
    alerts.push({ message: `${unassigned} trip${unassigned > 1 ? "s" : ""} without a driver assigned` })
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Good morning</h2>
        <p className="text-sm text-gray-500">{today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Trips Today" value={tripsToday} />
        <StatCard label="In Progress" value={inProgress} color={inProgress > 0 ? "#10B981" : undefined} />
        <StatCard
          label="Needs Attention"
          value={unassigned}
          color={unassigned > 0 ? "#F59E0B" : undefined}
          sub={unassigned > 0 ? "Unassigned trips" : "All good!"}
        />
        <StatCard label="Revenue Today" value={formatCurrency(revenueToday)} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Needs Attention</h3>
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-amber-800">{alert.message}</span>
              <Link href="/dispatch" className="ml-auto text-xs text-amber-600 font-medium hover:underline">
                Go to Dispatch →
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Trips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Today&apos;s Trips</h3>
          <Link href="/dispatch" className="text-xs text-blue-600 hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : !upcomingTrips.length ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <List className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No trips scheduled for today</p>
            <Link href="/dispatch" className="text-xs text-blue-600 hover:underline mt-1 block">
              Schedule a trip →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <DashboardTripRow key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardTripRow({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="text-sm font-bold text-gray-900 w-16 flex-shrink-0">
        {formatTime(trip.pickupTime)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-700 truncate">
          {truncateAddress(trip.pickupAddress, 25)} → {truncateAddress(trip.dropoffAddress, 25)}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{trip.customer?.name}</div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {trip.driver ? (
          <span className="text-xs text-gray-500 hidden sm:block">{trip.driver.name}</span>
        ) : (
          <span className="text-xs text-amber-600 font-medium hidden sm:block">Unassigned</span>
        )}
        <TripStatusBadge status={trip.status} />
      </div>
    </Link>
  )
}
