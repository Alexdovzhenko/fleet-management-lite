"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, X, ChevronLeft, ChevronRight, Grid3X3, Settings2, CalendarDays } from "lucide-react"
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
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, addMonths, subMonths } from "date-fns"
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

  const visibleFilterOptions = ALL_STATUS_OPTIONS.filter(opt => visibleStatuses.includes(opt.value))
  const allFilterTabs = [{ label: "All", value: "all" }, ...visibleFilterOptions]

  return (
    <>
    <FarmInNotification />
    <div className="h-full flex flex-col gap-3">

      {/* ── Premium Header Card ── */}
      <div
        className="bg-white rounded-2xl shrink-0"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)" }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">

          {/* Left: icon + title + date */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(145deg, #1a3a6b 0%, #2563eb 55%, #3b82f6 100%)", boxShadow: "0 4px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15)" }}
            >
              <Grid3X3 className="w-[17px] h-[17px] text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-[#1d1d1f] leading-tight tracking-[-0.01em]">
                {isSearching ? "Search Results" : "Dispatch"}
              </h1>
              <p className="text-[12px] text-[#6e6e73] mt-0.5 leading-tight truncate font-medium">
                {isSearching
                  ? `${counts.all} reservation${counts.all !== 1 ? "s" : ""} found`
                  : isLoading ? "Loading…" : isToday(selectedDate) ? "Today · " + format(selectedDate, "MMMM d, yyyy") : format(selectedDate, "EEEE · MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {/* Right: stat pills + new trip */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Stat pills */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                { label: "Total",       value: counts.all,        color: "bg-blue-50 text-blue-700",    dot: "bg-blue-500" },
                { label: "Active",      value: counts.inProgress, color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
                { label: "Unassigned",  value: counts.unassigned, color: "bg-amber-50 text-amber-700",  dot: "bg-amber-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold", s.color)}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
                  <span className="tabular-nums">{s.value}</span>
                  <span className="font-medium opacity-70">{s.label}</span>
                </div>
              ))}
            </div>

            {/* New Trip CTA */}
            <button
              onClick={() => router.push("/trips/new")}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all duration-150 active:scale-95 select-none cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 2px 10px rgba(37,99,235,0.30), inset 0 1px 0 rgba(255,255,255,0.15)" }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">New Reservation</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#f2f2f7] mx-5" />

        {/* Bottom controls */}
        <div className="flex flex-col gap-2.5 px-5 py-3.5">

          {/* Row 1: Date nav + Search */}
          <div className="flex items-center gap-2">

            {/* Date navigator */}
            {!isSearching && (
              <div className="flex items-center gap-0 bg-[#f5f5f7] rounded-xl border border-[#e5e5ea] p-0.5 shrink-0">
                <button
                  onClick={() => setSelectedDate(d => subDays(d, 1))}
                  className="w-7 h-7 rounded-[9px] hover:bg-white hover:shadow-sm flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#6e6e73]" />
                </button>

                <div className="relative" ref={calendarRef}>
                  <button
                    onClick={() => { setShowCalendar(s => !s); setCalendarMonth(selectedDate) }}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1d1d1f] px-2.5 py-1 hover:bg-white hover:shadow-sm rounded-[9px] min-w-[90px] text-center justify-center transition-all duration-150 cursor-pointer"
                  >
                    <CalendarDays className="w-3 h-3 text-[#6e6e73]" />
                    {isToday(selectedDate) ? "Today" : format(selectedDate, "MM/dd/yyyy")}
                  </button>

                  {showCalendar && (
                    <div
                      className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl overflow-hidden"
                      style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)" }}
                    >
                      {!showSpecificDate ? (
                        <div className="py-1.5 w-48">
                          {[
                            { label: "Today",     action: () => { setSelectedDate(new Date()); setShowCalendar(false) } },
                            { label: "Tomorrow",  action: () => { setSelectedDate(addDays(new Date(), 1)); setShowCalendar(false) } },
                            { label: "Yesterday", action: () => { setSelectedDate(subDays(new Date(), 1)); setShowCalendar(false) } },
                          ].map(({ label, action }) => (
                            <button
                              key={label}
                              onClick={action}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer"
                            >
                              {label}
                            </button>
                          ))}
                          <div className="h-px bg-[#f2f2f7] mx-3 my-1" />
                          <button
                            onClick={() => { setShowSpecificDate(true); setCalendarMonth(selectedDate) }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors flex items-center justify-between cursor-pointer"
                          >
                            Pick a date <ChevronRight className="w-3.5 h-3.5 text-[#aeaeb2]" />
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 w-72">
                          <div className="flex items-center gap-2 mb-4">
                            <button
                              onClick={() => setShowSpecificDate(false)}
                              className="w-7 h-7 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-4 h-4 text-[#6e6e73]" />
                            </button>
                            <span className="text-[13px] font-semibold text-[#1d1d1f]">Pick a date</span>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => setCalendarMonth(m => subMonths(m, 1))}
                              className="w-7 h-7 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 text-[#6e6e73]" />
                            </button>
                            <span className="text-[13px] font-semibold text-[#1d1d1f]">{format(calendarMonth, "MMMM yyyy")}</span>
                            <button
                              onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                              className="w-7 h-7 rounded-full hover:bg-[#f5f5f7] flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5 text-[#6e6e73]" />
                            </button>
                          </div>
                          <div className="grid grid-cols-7 mb-1">
                            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                              <div key={d} className="text-center text-[11px] font-semibold text-[#aeaeb2] py-1 uppercase tracking-wide">{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-y-0.5">
                            {Array.from({ length: getDay(startOfMonth(calendarMonth)) }).map((_, i) => (
                              <div key={`e-${i}`} />
                            ))}
                            {eachDayOfInterval({ start: startOfMonth(calendarMonth), end: endOfMonth(calendarMonth) }).map(day => (
                              <button
                                key={day.toISOString()}
                                onClick={() => { setSelectedDate(day); setShowCalendar(false); setShowSpecificDate(false) }}
                                className={cn(
                                  "text-center text-[13px] py-1.5 rounded-full transition-all duration-150 font-medium cursor-pointer",
                                  isSameDay(day, selectedDate)
                                    ? "bg-blue-600 text-white"
                                    : isToday(day)
                                    ? "text-blue-600 font-bold hover:bg-blue-50"
                                    : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
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
                  onClick={() => setSelectedDate(d => addDays(d, 1))}
                  className="w-7 h-7 rounded-[9px] hover:bg-white hover:shadow-sm flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#6e6e73]" />
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-200",
                committed ? "text-blue-500" : "text-[#aeaeb2]"
              )} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") setCommitted(search) }}
                placeholder="Search reservations…"
                className={cn(
                  "h-9 pl-8.5 w-full text-[13px] rounded-xl border outline-none transition-all duration-200 text-[#1d1d1f] placeholder:text-[#aeaeb2] font-medium",
                  committed
                    ? "pr-14 bg-white border-blue-300 ring-2 ring-blue-500/12"
                    : "pr-8 bg-[#f5f5f7] border-[#e5e5ea] hover:border-[#d1d1d6] focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-500/12"
                )}
              />
              {committed ? (
                <button
                  onClick={() => { setSearch(""); setCommitted(""); searchRef.current?.focus() }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              ) : search ? (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="text-[10px] font-mono text-[#aeaeb2] bg-[#f5f5f7] border border-[#e5e5ea] rounded-[5px] px-1.5 py-0.5 leading-none">↵</kbd>
                </div>
              ) : null}
            </div>
          </div>

          {/* Row 2: iOS-style segmented filter + driver select */}
          <div className="flex items-center gap-2">

            {/* Segmented control */}
            <div className="flex items-center gap-0.5 bg-[#f2f2f7] rounded-[11px] p-1 border border-[#e5e5ea] flex-1 overflow-x-auto">
              {allFilterTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer flex-shrink-0",
                    statusFilter === tab.value
                      ? "bg-white text-[#1d1d1f] shadow-[0_1px_4px_rgba(0,0,0,0.10),0_0_0_0.5px_rgba(0,0,0,0.06)]"
                      : "text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/50"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Customize columns */}
            <div className="relative shrink-0" ref={filterConfigRef}>
              <button
                onClick={() => setShowFilterConfig(s => !s)}
                className={cn(
                  "w-9 h-9 rounded-[10px] border flex items-center justify-center transition-all duration-150 cursor-pointer",
                  showFilterConfig
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-[#f5f5f7] border-[#e5e5ea] text-[#6e6e73] hover:bg-white hover:border-[#d1d1d6] hover:shadow-sm"
                )}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>

              {showFilterConfig && (
                <div
                  className="absolute top-full right-0 mt-2 z-50 bg-white rounded-2xl w-52 overflow-hidden"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)" }}
                >
                  <div className="px-4 pt-3.5 pb-2">
                    <p className="text-[10px] font-bold text-[#aeaeb2] uppercase tracking-[0.08em]">Visible Filters</p>
                  </div>
                  <div className="px-2 pb-2">
                    {ALL_STATUS_OPTIONS.map(opt => {
                      const isEnabled = visibleStatuses.includes(opt.value)
                      const isLast = isEnabled && visibleStatuses.length === 1
                      return (
                        <button
                          key={opt.value}
                          onClick={() => !isLast && toggleStatus(opt.value)}
                          disabled={isLast}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer",
                            isLast ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f5f5f7]"
                          )}
                        >
                          <span className="text-[13px] font-medium text-[#1d1d1f]">{opt.label}</span>
                          <div className={cn(
                            "w-[34px] h-[20px] rounded-full transition-all duration-200 relative shrink-0",
                            isEnabled ? "bg-blue-600" : "bg-[#e5e5ea]"
                          )}>
                            <div className={cn(
                              "absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-200",
                              isEnabled ? "right-[2px] shadow-[0_1px_4px_rgba(0,0,0,0.25)]" : "left-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.15)]"
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
                onChange={e => setDriverFilter(e.target.value)}
                className={cn(
                  "appearance-none h-9 pl-3 pr-7 rounded-[10px] border text-[12px] font-semibold cursor-pointer transition-all outline-none",
                  driverFilter !== "all"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-[#f5f5f7] border-[#e5e5ea] text-[#1d1d1f] hover:bg-white hover:border-[#d1d1d6] hover:shadow-sm"
                )}
              >
                <option value="all">All Drivers</option>
                <option value="unassigned">Unassigned</option>
                {drivers?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <ChevronRight className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none rotate-90",
                driverFilter !== "all" ? "text-white/80" : "text-[#aeaeb2]"
              )} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Trip Grid ── */}
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
          onSelect={trip => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
          onDoubleClick={(trip, pos) => { setQuickTrip(trip); setQuickPos(pos) }}
          showDate={isSearching}
        />
      )}

      {quickTrip && (
        <QuickActionPopup
          trip={quickTrip}
          position={quickPos}
          onClose={() => setQuickTrip(null)}
        />
      )}

      <TripEditModal
        trip={selectedTrip}
        open={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
      />

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
