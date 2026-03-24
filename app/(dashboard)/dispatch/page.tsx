"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, X, ChevronLeft, ChevronRight, Grid3X3, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useTrips, useTrip, useCreateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { TripGrid } from "@/components/dispatch/trip-grid"
import { TripEditModal } from "@/components/dispatch/trip-edit-modal"
import { QuickActionPopup } from "@/components/dispatch/quick-action-popup"
import { FarmInNotification } from "@/components/dispatch/farm-in-notification"
import { TripForm } from "@/components/trips/trip-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { cn } from "@/lib/utils"
import type { Trip } from "@/types"

function timeToMinutes(t: string): number {
  const m = t?.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return 0
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const pm = m[3].toUpperCase() === "PM"
  if (pm && h < 12) h += 12
  if (!pm && h === 12) h = 0
  return h * 60 + min
}

const ALL_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Assigned",    value: "CONFIRMED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed",   value: "COMPLETED" },
  { label: "Cancelled",   value: "CANCELLED" },
  { label: "Farmed Out",  value: "FARMED_OUT" },
]

const VALID_STATUS_VALUES = new Set(ALL_STATUS_OPTIONS.map(o => o.value))
const DEFAULT_VISIBLE_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "FARMED_OUT"]

function DispatchPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const openTripId = searchParams.get("open")
  const { data: openTrip } = useTrip(openTripId ?? "")
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
  const filterConfigRef = useRef<HTMLDivElement>(null)
  const isSearching = committed.length > 0

  const [showFilterConfig, setShowFilterConfig] = useState(false)
  const [visibleStatuses, setVisibleStatuses] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_VISIBLE_STATUSES
    try {
      const saved = localStorage.getItem("dispatch-status-filters")
      if (saved) {
        const parsed: string[] = JSON.parse(saved)
        const valid = parsed.filter(v => VALID_STATUS_VALUES.has(v))
        return valid.length > 0 ? valid : DEFAULT_VISIBLE_STATUSES
      }
    } catch { /* ignore */ }
    return DEFAULT_VISIBLE_STATUSES
  })

  useEffect(() => {
    localStorage.setItem("dispatch-status-filters", JSON.stringify(visibleStatuses))
  }, [visibleStatuses])

  function toggleStatus(value: string) {
    setVisibleStatuses(prev => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev
        if (statusFilter === value) setStatusFilter("all")
        return prev.filter(s => s !== value)
      }
      const order = ALL_STATUS_OPTIONS.map(o => o.value)
      return order.filter(v => v === value || prev.includes(v))
    })
  }

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
    function handleClick(e: MouseEvent) {
      if (filterConfigRef.current && !filterConfigRef.current.contains(e.target as Node)) {
        setShowFilterConfig(false)
      }
    }
    if (showFilterConfig) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showFilterConfig])

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

  // When navigated from a notification (?open=tripId), open that trip's modal
  useEffect(() => {
    if (!openTrip) return
    const tripDate = new Date(openTrip.pickupDate)
    setSelectedDate(tripDate)
    setSelectedTrip(openTrip)
    router.replace("/dispatch")
  }, [openTrip]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: trips, isLoading } = useTrips(
    isSearching ? { search: committed } : { date: selectedDate }
  )
  const { data: drivers } = useDrivers()
  const createTrip = useCreateTrip()

  const filteredTrips = (trips || [])
    .filter((trip) => {
      if (statusFilter === "FARMED_OUT") {
        if (!(trip.farmOuts && trip.farmOuts.length > 0)) return false
      } else if (statusFilter !== "all" && trip.status !== statusFilter) {
        return false
      }
      if (driverFilter !== "all") {
        if (driverFilter === "unassigned") return !trip.driverId
        return trip.driverId === driverFilter
      }
      return true
    })
    .sort((a, b) => timeToMinutes(a.pickupTime) - timeToMinutes(b.pickupTime))

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
    <>
    <FarmInNotification />
    <div className="h-full flex flex-col space-y-4">

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] shrink-0">

        {/* Top row: icon + title + stat boxes */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", boxShadow: "0 4px 12px rgba(37,99,235,0.20)" }}
            >
              <Grid3X3 className="w-[17px] h-[17px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 leading-tight">
                {isSearching ? "Search Results" : "Dispatch"}
              </h1>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-tight">
                {isSearching
                  ? `${counts.all} reservation${counts.all !== 1 ? "s" : ""} found`
                  : isLoading ? "Loading…" : format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "Total",      value: counts.all,        dot: "bg-blue-500" },
              { label: "Active",     value: counts.inProgress, dot: "bg-emerald-500" },
              { label: "Unassigned", value: counts.unassigned, dot: "bg-amber-400" },
            ]).map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center px-5 py-3 min-w-[80px]">
                <span className="text-[22px] font-bold leading-none tracking-tight text-gray-800">{stat.value}</span>
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stat.dot)} />
                  <span className="text-[11px] text-gray-400 font-medium leading-none whitespace-nowrap">{stat.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        {/* Bottom row: date nav + filters + search + CTA */}
        <div className="flex items-center gap-2.5 px-6 py-4">

          {/* Date navigator */}
          {!isSearching && (
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-xl px-1 py-1 shrink-0">
              <button
                onClick={() => setSelectedDate((d) => subDays(d, 1))}
                className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
              </button>
              <div className="relative" ref={calendarRef}>
                <button
                  onClick={() => { setShowCalendar((s) => !s); setCalendarMonth(selectedDate) }}
                  className="text-[12px] font-semibold text-gray-700 px-2.5 py-1 hover:bg-white hover:shadow-sm rounded-lg min-w-[88px] text-center transition-all"
                >
                  {isToday(selectedDate) ? "Today" : format(selectedDate, "MM/dd/yyyy")}
                </button>
                {showCalendar && (
                  <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                    {!showSpecificDate ? (
                      <div className="py-1 w-44">
                        {[
                          { label: "Today",     action: () => { setSelectedDate(new Date()); setShowCalendar(false) } },
                          { label: "Tomorrow",  action: () => { setSelectedDate(addDays(new Date(), 1)); setShowCalendar(false) } },
                          { label: "Yesterday", action: () => { setSelectedDate(subDays(new Date(), 1)); setShowCalendar(false) } },
                        ].map(({ label, action }) => (
                          <button key={label} onClick={action} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                            {label}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 my-1" />
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
              <button
                onClick={() => setSelectedDate((d) => addDays(d, 1))}
                className="w-7 h-7 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {/* Vertical divider */}
          {!isSearching && <div className="w-px h-5 bg-gray-200 shrink-0" />}

          {/* Status filter tabs + customize */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {/* "All" tab — always visible */}
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                statusFilter === "all"
                  ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              All
            </button>

            {/* User-selected status tabs */}
            {ALL_STATUS_OPTIONS.filter(opt => visibleStatuses.includes(opt.value)).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                  statusFilter === f.value
                    ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Customize filter button */}
          <div className="relative shrink-0" ref={filterConfigRef}>
            <button
              onClick={() => setShowFilterConfig(s => !s)}
              className={cn(
                "w-9 h-9 rounded-xl border flex items-center justify-center transition-all",
                showFilterConfig
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-gray-50 border-gray-100 text-gray-400 hover:text-gray-600 hover:border-gray-200"
              )}
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {showFilterConfig && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-100 rounded-xl shadow-lg w-52 overflow-hidden">
                <div className="px-4 pt-3.5 pb-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Visible Filters</p>
                </div>
                <div className="px-2 pb-2">
                  {ALL_STATUS_OPTIONS.map((opt) => {
                    const isEnabled = visibleStatuses.includes(opt.value)
                    const isLast = isEnabled && visibleStatuses.length === 1
                    return (
                      <button
                        key={opt.value}
                        onClick={() => !isLast && toggleStatus(opt.value)}
                        disabled={isLast}
                        className={cn(
                          "w-full flex items-center justify-between gap-3 px-2.5 py-2.5 rounded-lg transition-colors text-left",
                          isLast ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                        )}
                      >
                        <span className="text-[13px] font-medium text-gray-700">{opt.label}</span>
                        <div className={cn(
                          "w-8 h-[18px] rounded-full transition-colors relative shrink-0",
                          isEnabled ? "bg-blue-600" : "bg-gray-200"
                        )}>
                          <div className={cn(
                            "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-all duration-200",
                            isEnabled ? "right-[2px]" : "left-[2px]"
                          )} />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Driver filter */}
          <div className="relative shrink-0">
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className={cn(
                "appearance-none h-9 pl-3 pr-7 rounded-xl border text-[12px] font-semibold cursor-pointer transition-all outline-none",
                driverFilter !== "all"
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
              )}
            >
              <option value="all">All Drivers</option>
              <option value="unassigned">Unassigned</option>
              {drivers?.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronRight className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none rotate-90",
              driverFilter !== "all" ? "text-white/80" : "text-gray-400"
            )} />
          </div>

          {/* Search */}
          <div className="relative shrink-0">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-150",
              committed ? "text-blue-500" : "text-gray-400"
            )} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setCommitted(search) }}
              placeholder="Search by name, address, conf #…"
              className={cn(
                "h-9 pl-8 text-[12px] rounded-xl border outline-none transition-all duration-200 text-gray-700 placeholder:text-gray-400",
                committed
                  ? "w-64 pr-14 bg-white border-blue-300 ring-2 ring-blue-500/15"
                  : "w-56 pr-8 bg-gray-50 border-gray-100 hover:border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-500/15 focus:w-64"
              )}
            />
            {committed ? (
              <button
                onClick={() => { setSearch(""); setCommitted(""); searchRef.current?.focus() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-700 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            ) : search ? (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <kbd className="text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-100 rounded px-1.5 py-0.5 leading-none">↵</kbd>
              </div>
            ) : null}
          </div>

          <div className="flex-1" />

          <Button
            onClick={() => router.push("/trips/new")}
            className="h-9 text-sm font-semibold text-white gap-1.5 px-4 shrink-0"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Button>
        </div>
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
    </>
  )
}

export default function DispatchPage() {
  return (
    <Suspense>
      <DispatchPageInner />
    </Suspense>
  )
}
