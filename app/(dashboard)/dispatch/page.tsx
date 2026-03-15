"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, X, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTrips, useCreateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { TripGrid } from "@/components/dispatch/trip-grid"
import { TripEditModal } from "@/components/dispatch/trip-edit-modal"
import { QuickActionPopup } from "@/components/dispatch/quick-action-popup"
import { TripForm } from "@/components/trips/trip-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import type { Trip } from "@/types"

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Quote", value: "QUOTE" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Dispatched", value: "DISPATCHED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
]

export default function DispatchPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [quickTrip, setQuickTrip] = useState<Trip | null>(null)
  const [quickPos, setQuickPos] = useState({ x: 0, y: 0 })
  const [statusFilter, setStatusFilter] = useState("all")
  const [driverFilter, setDriverFilter] = useState("all")
  const [showNewTrip, setShowNewTrip] = useState(false)
  const [search, setSearch] = useState("")
  const [committed, setCommitted] = useState("")
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [showSpecificDate, setShowSpecificDate] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const isSearching = committed.length > 0

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false)
        setShowSpecificDate(false)
      }
    }
    if (showCalendar) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showCalendar])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearch("")
        searchRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  const { data: trips, isLoading } = useTrips(
    isSearching ? { search: committed } : { date: selectedDate }
  )
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
          <div className="relative" ref={calendarRef}>
            <button
              onClick={() => { setShowCalendar((s) => !s); setCalendarMonth(selectedDate) }}
              className="text-sm font-medium px-3 py-1 hover:bg-gray-50 rounded min-w-[96px] text-center"
            >
              {format(selectedDate, "MM/dd/yyyy")}
            </button>
            {showCalendar && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white border rounded-xl shadow-lg overflow-hidden">
                {!showSpecificDate ? (
                  <div className="py-1 w-44">
                    {[
                      { label: "Today", action: () => { setSelectedDate(new Date()); setShowCalendar(false) } },
                      { label: "Tomorrow", action: () => { setSelectedDate(addDays(new Date(), 1)); setShowCalendar(false) } },
                      { label: "Yesterday", action: () => { setSelectedDate(subDays(new Date(), 1)); setShowCalendar(false) } },
                    ].map(({ label, action }) => (
                      <button key={label} onClick={action} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                        {label}
                      </button>
                    ))}
                    <div className="border-t my-1" />
                    <button
                      onClick={() => { setShowSpecificDate(true); setCalendarMonth(selectedDate) }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      Specific Date <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ) : (
                  <div className="p-3 w-72">
                    <div className="flex items-center gap-2 mb-3">
                      <button onClick={() => setShowSpecificDate(false)} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold">Specific Date</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <button onClick={() => setCalendarMonth((m) => subMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium">{format(calendarMonth, "MMMM yyyy")}</span>
                      <button onClick={() => setCalendarMonth((m) => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 mb-1">
                      {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                        <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
                        <div key={`e-${i}`} />
                      ))}
                      {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map((day) => (
                        <button
                          key={day.toISOString()}
                          onClick={() => { setSelectedDate(day); setShowCalendar(false); setShowSpecificDate(false) }}
                          className={cn(
                            "text-center text-sm py-1 rounded transition-colors hover:bg-blue-50",
                            isSameDay(day, selectedDate) && "bg-blue-600 text-white hover:bg-blue-600",
                            isToday(day) && !isSameDay(day, selectedDate) && "font-semibold text-blue-600"
                          )}
                        >
                          {format(day, "d")}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-gray-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setCommitted(search) }}
              placeholder=""
              className="h-9 pl-9 pr-3 w-64 text-sm rounded-lg border border-gray-200 bg-white outline-none hover:border-gray-300 text-gray-900"
            />
            {(search || committed) && (
              <button
                onClick={() => { setSearch(""); setCommitted(""); searchRef.current?.focus() }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCommitted(search)}
            className="h-9 px-4 text-sm font-medium"
          >
            Find
          </Button>
        </div>

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
          onClick={() => router.push("/trips/new")}
          className="text-white gap-2 h-9"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          New Trip
        </Button>
      </div>

      {/* Trip Grid */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : !filteredTrips.length ? (
        <EmptyState
          icon={Grid3X3}
          title={isSearching ? "No reservations found" : statusFilter === "all" && driverFilter === "all" ? "No trips scheduled" : "No trips match filters"}
          description={isSearching ? "Try a different name, address, or reservation number." : statusFilter === "all" && driverFilter === "all" ? "Schedule a trip to get started." : "Try adjusting your filters."}
          actionLabel={!isSearching && statusFilter === "all" && driverFilter === "all" ? "Schedule Trip" : undefined}
          onAction={() => router.push("/trips/new")}
        />
      ) : (
        <TripGrid
          trips={filteredTrips}
          selectedTripId={selectedTrip?.id}
          onSelect={(trip) => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
          onDoubleClick={(trip, pos) => { setQuickTrip(trip); setQuickPos(pos) }}
          showDate={isSearching}
        />
      )}

      {/* Quick Action Popup */}
      {quickTrip && (
        <QuickActionPopup
          trip={quickTrip}
          position={quickPos}
          onClose={() => setQuickTrip(null)}
        />
      )}

      {/* Trip Edit Modal */}
      <TripEditModal
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
