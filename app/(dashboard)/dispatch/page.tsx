"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, X, ChevronLeft, ChevronRight, Grid3X3, Settings2, CalendarDays } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
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
  const { isDark } = useTheme()
  const openTripId = searchParams.get("open")
  const billingFromUrl = searchParams.get("billing") === "1"
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

  // When URL has ?open=tripId, scroll the board to that trip's date.
  // Do NOT call router.replace here — the URL is already correct, and calling
  // router.replace inside an effect causes a soft-nav that resets React state
  // before the setSelectedTrip update can commit.
  useEffect(() => {
    if (!openTrip) return
    setSelectedDate(new Date(openTrip.pickupDate))
  }, [openTrip])

  // The trip to show in the modal: URL-loaded trip takes priority over manual selection
  const modalTrip = openTrip ?? selectedTrip ?? null
  // The modal is open when the user manually selected a trip, OR the URL has ?open=
  // and the trip data has loaded (prevents a flash of open-with-null-data)
  const modalOpen = !!selectedTrip || (!!openTripId && !!openTrip)

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

    {/* Covers the dock nav padding-bottom area so bg-gray-50 layout doesn't bleed through */}
    <div
      className="fixed bottom-0 inset-x-0 pointer-events-none"
      style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "var(--lc-bg-page)", zIndex: 0 }}
    />

    {/* Full-bleed dark page wrapper — cancels main padding and extends background edge-to-edge */}
    <div
      className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
      style={{ background: "var(--lc-bg-page)", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
    >
      <div className="px-4 pt-4 md:px-6 md:pt-6 flex flex-col gap-3">

        {/* ── Control Card ── */}
        <div
          className="rounded-2xl shrink-0"
          style={{
            background: "var(--lc-bg-surface)",
            border: "1px solid var(--lc-bg-glass-mid)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">

            {/* Left: icon + label + date */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(201,168,124,0.10)",
                  border: "1px solid rgba(201,168,124,0.20)",
                }}
              >
                <Grid3X3 className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p style={{
                  fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                  textTransform: "uppercase", color: "#c9a87c",
                  fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                }}>
                  Dispatch
                </p>
                <p
                  className="leading-tight truncate"
                  style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}
                >
                  {isSearching
                    ? `${counts.all} reservation${counts.all !== 1 ? "s" : ""} found`
                    : isLoading ? "Loading…"
                    : isToday(selectedDate) ? "Today · " + format(selectedDate, "MMMM d, yyyy")
                    : format(selectedDate, "EEEE · MMMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Right: stat pills + CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-1.5">
                {(isDark ? [
                  { label: "Total",      value: counts.all,        bg: "rgba(201,168,124,0.10)", border: "rgba(201,168,124,0.22)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c" },
                  { label: "Active",     value: counts.inProgress, bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399" },
                  { label: "Unassigned", value: counts.unassigned, bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)",  color: "rgba(251,191,36,0.90)",  dot: "#fbbf24" },
                ] : [
                  { label: "Total",      value: counts.all,        bg: "rgba(201,168,124,0.14)", border: "rgba(180,140,90,0.40)",  color: "#96672a", dot: "#b87c3a" },
                  { label: "Active",     value: counts.inProgress, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.35)",  color: "#047857", dot: "#10b981" },
                  { label: "Unassigned", value: counts.unassigned, bg: "rgba(217,119,6,0.12)",   border: "rgba(217,119,6,0.35)",   color: "#b45309", dot: "#d97706" },
                ]).map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums">{s.value}</span>
                    <span className="font-medium" style={{ opacity: isDark ? 0.7 : 0.8 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* New Reservation CTA — gold */}
              <button
                onClick={() => router.push("/trips/new")}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 select-none cursor-pointer"
                style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">New Reservation</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

          {/* Bottom controls */}
          <div className="flex flex-col gap-2.5 px-5 py-3.5">

            {/* Row 1: Date nav + Search */}
            <div className="flex items-center gap-2">

              {/* Date navigator */}
              {!isSearching && (
                <div
                  className="flex items-center gap-0 rounded-xl p-0.5 shrink-0"
                  style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
                >
                  <button
                    onClick={() => setSelectedDate(d => subDays(d, 1))}
                    className="w-7 h-7 rounded-[9px] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                    style={{ color: "var(--lc-text-dim)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-hover)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative" ref={calendarRef}>
                    <button
                      onClick={() => { setShowCalendar(s => !s); setCalendarMonth(selectedDate) }}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-[9px] min-w-[90px] text-center justify-center transition-all duration-150 cursor-pointer"
                      style={{ color: "var(--lc-text-primary)" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-hover)" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                    >
                      <CalendarDays className="w-3 h-3" style={{ color: "var(--lc-text-label)" }} />
                      {isToday(selectedDate) ? "Today" : format(selectedDate, "MM/dd/yyyy")}
                    </button>

                    {showCalendar && (
                      <div
                        className="absolute top-full left-0 mt-2 z-50 rounded-2xl overflow-hidden"
                        style={{
                          background: "var(--lc-bg-surface)",
                          border: "1px solid var(--lc-bg-glass-hover)",
                          boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
                        }}
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
                                className="w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer"
                                style={{ color: "var(--lc-text-primary)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                {label}
                              </button>
                            ))}
                            <div className="h-px mx-3 my-1" style={{ background: "var(--lc-bg-glass-mid)" }} />
                            <button
                              onClick={() => { setShowSpecificDate(true); setCalendarMonth(selectedDate) }}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors flex items-center justify-between cursor-pointer"
                              style={{ color: "var(--lc-text-primary)" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)" }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                            >
                              Pick a date <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--lc-text-muted)" }} />
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 w-72">
                            <div className="flex items-center gap-2 mb-4">
                              <button
                                onClick={() => setShowSpecificDate(false)}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                style={{ color: "var(--lc-text-dim)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[13px] font-semibold" style={{ color: "var(--lc-text-primary)" }}>Pick a date</span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => setCalendarMonth(m => subMonths(m, 1))}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                style={{ color: "var(--lc-text-dim)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[13px] font-semibold" style={{ color: "var(--lc-text-primary)" }}>{format(calendarMonth, "MMMM yyyy")}</span>
                              <button
                                onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                                style={{ color: "var(--lc-text-dim)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)" }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 mb-1">
                              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
                                <div key={d} className="text-center text-[11px] font-semibold py-1 uppercase tracking-wide" style={{ color: "var(--lc-text-muted)" }}>{d}</div>
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
                                  className="text-center text-[13px] py-1.5 rounded-full transition-all duration-150 font-medium cursor-pointer"
                                  style={
                                    isSameDay(day, selectedDate)
                                      ? { background: "#c9a87c", color: "var(--lc-bg-page)" }
                                      : isToday(day)
                                      ? { color: "#c9a87c", fontWeight: 700 }
                                      : { color: "var(--lc-text-secondary)" }
                                  }
                                  onMouseEnter={e => {
                                    if (!isSameDay(day, selectedDate))
                                      (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-hover)"
                                  }}
                                  onMouseLeave={e => {
                                    if (!isSameDay(day, selectedDate))
                                      (e.currentTarget as HTMLButtonElement).style.background = "transparent"
                                  }}
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
                    className="w-7 h-7 rounded-[9px] flex items-center justify-center transition-all duration-150 active:scale-90 cursor-pointer"
                    style={{ color: "var(--lc-text-dim)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-hover)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-200"
                  style={{ color: committed ? "#c9a87c" : "var(--lc-text-muted)" }}
                />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") setCommitted(search) }}
                  placeholder="Search reservations…"
                  className="h-9 pl-8.5 w-full text-[13px] rounded-xl outline-none transition-all duration-200 font-medium"
                  style={{
                    background: "var(--lc-bg-glass)",
                    border: committed ? "1px solid rgba(201,168,124,0.45)" : "1px solid var(--lc-bg-glass-hover)",
                    color: "var(--lc-text-primary)",
                    paddingRight: committed || search ? "56px" : "12px",
                    boxShadow: committed ? "0 0 0 2px rgba(201,168,124,0.10)" : "none",
                  }}
                  onFocus={e => {
                    if (!committed) {
                      (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                      ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                    }
                  }}
                  onBlur={e => {
                    if (!committed) {
                      (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                      ;(e.target as HTMLInputElement).style.boxShadow = "none"
                    }
                  }}
                />
                {committed ? (
                  <button
                    onClick={() => { setSearch(""); setCommitted(""); searchRef.current?.focus() }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                    style={{ color: "#c9a87c" }}
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                ) : search ? (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <kbd
                      className="text-[10px] font-mono rounded-[5px] px-1.5 py-0.5 leading-none"
                      style={{ color: "var(--lc-text-muted)", background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
                    >↵</kbd>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Row 2: Segmented filter + gear + driver select */}
            <div className="flex items-center gap-2">

              {/* Segmented control */}
              <div
                className="flex items-center gap-0.5 rounded-[11px] p-1 flex-1 overflow-x-auto"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
              >
                {allFilterTabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer flex-shrink-0"
                    style={statusFilter === tab.value
                      ? { background: "var(--lc-border)", color: "var(--lc-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                      : { color: "var(--lc-text-dim)" }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Filter config gear */}
              <div className="relative shrink-0" ref={filterConfigRef}>
                <button
                  onClick={() => setShowFilterConfig(s => !s)}
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all duration-150 cursor-pointer"
                  style={showFilterConfig
                    ? { background: "#c9a87c", border: "1px solid #c9a87c", color: "var(--lc-bg-page)" }
                    : { background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-dim)" }
                  }
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>

                {showFilterConfig && (
                  <div
                    className="absolute top-full right-0 mt-2 z-50 rounded-2xl w-52 overflow-hidden"
                    style={{
                      background: "var(--lc-bg-surface)",
                      border: "1px solid var(--lc-bg-glass-hover)",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
                    }}
                  >
                    <div className="px-4 pt-3.5 pb-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--lc-text-muted)" }}>Visible Filters</p>
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
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer"
                            style={{ opacity: isLast ? 0.4 : 1 }}
                            onMouseEnter={e => { if (!isLast) (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass)" }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
                          >
                            <span className="text-[13px] font-medium" style={{ color: "var(--lc-text-primary)" }}>{opt.label}</span>
                            <div
                              className="w-[34px] h-[20px] rounded-full transition-all duration-200 relative shrink-0"
                              style={{ background: isEnabled ? "#c9a87c" : "var(--lc-border)" }}
                            >
                              <div
                                className={cn(
                                  "absolute top-[2px] w-4 h-4 rounded-full bg-white transition-all duration-200",
                                  isEnabled ? "right-[2px]" : "left-[2px]"
                                )}
                                style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.30)" }}
                              />
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
                  className="appearance-none h-9 pl-3 pr-7 rounded-[10px] text-[12px] font-semibold cursor-pointer transition-all outline-none"
                  style={driverFilter !== "all"
                    ? { background: "#c9a87c", border: "1px solid #c9a87c", color: "var(--lc-bg-page)" }
                    : { background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-secondary)" }
                  }
                >
                  <option value="all">All Drivers</option>
                  <option value="unassigned">Unassigned</option>
                  {drivers?.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronRight
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none rotate-90"
                  style={{ color: driverFilter !== "all" ? "rgba(8,12,22,0.7)" : "var(--lc-text-muted)" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Trip Grid ── */}
        {isLoading ? (
          <TableSkeleton rows={8} dark />
        ) : !filteredTrips.length ? (
          <EmptyState
            icon={Grid3X3}
            title={isSearching ? "No reservations found" : statusFilter === "all" && driverFilter === "all" ? "No trips scheduled" : "No trips match filters"}
            description={isSearching ? "Try a different name, address, or reservation number." : statusFilter === "all" && driverFilter === "all" ? "Schedule a trip to get started." : "Try adjusting your filters."}
            actionLabel={!isSearching && statusFilter === "all" && driverFilter === "all" ? "+ New Reservation" : undefined}
            onAction={() => router.push("/trips/new")}
          />
        ) : (
          <TripGrid
            trips={filteredTrips}
            selectedTripId={selectedTrip?.id ?? openTripId ?? undefined}
            onSelect={trip => {
              const isAlreadyOpen = selectedTrip?.id === trip.id || openTripId === trip.id
              if (isAlreadyOpen) {
                setSelectedTrip(null)
                router.replace("/dispatch")
              } else {
                setSelectedTrip(trip)
                router.replace(`/dispatch?open=${trip.id}`)
              }
            }}
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
          trip={modalTrip}
          open={modalOpen}
          defaultBillingOpen={billingFromUrl}
          onBillingChange={(isOpen) => {
            if (!selectedTrip) return
            const params = isOpen ? `?open=${selectedTrip.id}&billing=1` : `?open=${selectedTrip.id}`
            router.replace(`/dispatch${params}`)
          }}
          onClose={() => {
            setSelectedTrip(null)
            router.replace("/dispatch")
          }}
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
