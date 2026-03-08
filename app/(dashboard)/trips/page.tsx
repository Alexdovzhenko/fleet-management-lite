"use client"

import { useState } from "react"
import { Plus, Search, Plane, Star, Baby, Accessibility, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTrips, useCreateTrip } from "@/lib/hooks/use-trips"
import { TripStatusBadge, TripStatusDot } from "@/components/trips/trip-status-badge"
import { TripForm } from "@/components/trips/trip-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { formatDate, formatTime, truncateAddress, formatCurrency } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"
import type { Trip } from "@/types"
import Link from "next/link"

export default function TripsPage() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data: trips, isLoading } = useTrips({ search: debouncedSearch })
  const createTrip = useCreateTrip()

  function handleCreate(data: object) {
    const formData = data as { price?: number; gratuityPercent?: number } & Record<string, unknown>
    const { gratuityPercent, price, ...rest } = formData
    const gratuity = price && gratuityPercent ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : undefined
    const totalPrice = price && gratuity ? price + gratuity : price

    createTrip.mutate({ ...rest, price, gratuity, totalPrice } as never, {
      onSuccess: () => setShowForm(false),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search trips..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="text-white gap-2"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          New Trip
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !trips?.length ? (
        <EmptyState
          icon={Users}
          title="No trips found"
          description="Create your first trip to get started."
          actionLabel="New Trip"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <TripRow key={trip.id} trip={trip} />
          ))}
        </div>
      )}

      {/* New Trip Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Trip</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <TripForm
              onSubmit={handleCreate}
              onCancel={() => setShowForm(false)}
              isLoading={createTrip.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TripRow({ trip }: { trip: Trip }) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <TripStatusDot status={trip.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-bold text-gray-900">{formatTime(trip.pickupTime)}</span>
          <span className="text-xs text-gray-400">{formatDate(trip.pickupDate)}</span>
          <span className="text-xs font-mono text-gray-400">{trip.tripNumber}</span>
        </div>
        <div className="text-sm text-gray-600 truncate">
          {truncateAddress(trip.pickupAddress)} → {truncateAddress(trip.dropoffAddress)}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {trip.customer?.name}
          </span>
          {trip.driver && (
            <span className="text-xs text-gray-400">· {trip.driver.name}</span>
          )}
          {trip.vehicle && (
            <span className="text-xs text-gray-400">· {trip.vehicle.name}</span>
          )}
        </div>
      </div>

      {/* Flags */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {trip.flightNumber && <Plane className="w-3.5 h-3.5 text-blue-400" aria-label="Flight tracking" />}
        {trip.vip && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" aria-label="VIP" />}
        {trip.childSeat && <Baby className="w-3.5 h-3.5 text-pink-400" aria-label="Child seat" />}
        {trip.wheelchairAccess && <Accessibility className="w-3.5 h-3.5 text-blue-400" aria-label="Wheelchair accessible" />}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {trip.totalPrice && (
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(trip.totalPrice)}</span>
        )}
        <TripStatusBadge status={trip.status} />
      </div>
    </Link>
  )
}
