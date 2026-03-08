"use client"

import { useState } from "react"
import { Plus, Filter, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTodayTrips, useCreateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { TripCard } from "@/components/dispatch/trip-card"
import { TripDrawer } from "@/components/dispatch/trip-drawer"
import { TripForm } from "@/components/trips/trip-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TripCardSkeleton } from "@/components/shared/loading-skeleton"
import { format, addDays, subDays } from "date-fns"
import { formatDate } from "@/lib/utils"
import type { Trip, TripStatus } from "@/types"

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Quote", value: "QUOTE" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
]

export default function DispatchPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [driverFilter, setDriverFilter] = useState("all")
  const [showNewTrip, setShowNewTrip] = useState(false)

  const { data: trips, isLoading } = useTodayTrips()
  const { data: drivers } = useDrivers()
  const createTrip = useCreateTrip()

  const filteredTrips = (trips || []).filter((trip) => {
    if (statusFilter !== "all" && trip.status !== statusFilter) return false
    if (driverFilter !== "all") {
      if (driverFilter === "unassigned") return !trip.driverId
      return trip.driverId === driverFilter
    }
    return true
  })

  // Group by status for quick counts
  const counts = {
    all: trips?.length || 0,
    inProgress: trips?.filter((t) => ["IN_PROGRESS", "DRIVER_EN_ROUTE", "DRIVER_ARRIVED"].includes(t.status)).length || 0,
    unassigned: trips?.filter((t) => !t.driverId && !["COMPLETED", "CANCELLED"].includes(t.status)).length || 0,
  }

  function handleCreate(data: object) {
    const formData = data as { price?: number; gratuityPercent?: number } & Record<string, unknown>
    const { gratuityPercent, price, ...rest } = formData
    const gratuity = price && gratuityPercent ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : undefined
    const totalPrice = price && gratuity ? price + gratuity : price
    createTrip.mutate({ ...rest, price, gratuity, totalPrice } as never, {
      onSuccess: () => setShowNewTrip(false),
    })
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date navigator */}
        <div className="flex items-center gap-1 bg-white border rounded-lg px-1 py-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate((d) => subDays(d, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="text-sm font-medium px-3 py-1 hover:bg-gray-50 rounded"
          >
            {formatDate(selectedDate)}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(typeof v === "string" ? v : "all")}>
          <SelectTrigger className="w-36 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Driver filter */}
        <Select value={driverFilter} onValueChange={(v) => setDriverFilter(typeof v === "string" ? v : "all")}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="All drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {drivers?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{counts.all} trips</span>
          {counts.inProgress > 0 && (
            <span className="text-green-600 font-medium">{counts.inProgress} active</span>
          )}
          {counts.unassigned > 0 && (
            <span className="text-amber-600 font-medium">{counts.unassigned} unassigned</span>
          )}
        </div>

        <Button
          onClick={() => setShowNewTrip(true)}
          className="text-white gap-2 h-9"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          New Trip
        </Button>
      </div>

      {/* Trip Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TripCardSkeleton key={i} />
          ))}
        </div>
      ) : !filteredTrips.length ? (
        <EmptyState
          icon={Grid3X3}
          title={statusFilter === "all" && driverFilter === "all" ? "No trips today" : "No trips match filters"}
          description={statusFilter === "all" && driverFilter === "all" ? "Schedule a trip to get started." : "Try adjusting your filters."}
          actionLabel={statusFilter === "all" && driverFilter === "all" ? "Schedule Trip" : undefined}
          onAction={() => setShowNewTrip(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              isSelected={selectedTrip?.id === trip.id}
              onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
            />
          ))}
        </div>
      )}

      {/* Trip Detail Drawer */}
      <TripDrawer
        trip={selectedTrip}
        open={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />

      {/* New Trip Sheet */}
      <Sheet open={showNewTrip} onOpenChange={setShowNewTrip}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Schedule New Trip</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TripForm
              onSubmit={handleCreate}
              onCancel={() => setShowNewTrip(false)}
              isLoading={createTrip.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
