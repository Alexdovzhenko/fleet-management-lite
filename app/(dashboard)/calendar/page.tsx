"use client"

import { useState, useMemo, useEffect } from "react"
import {
  format, addMonths, subMonths, addWeeks, subWeeks,
  addDays, subDays, startOfWeek, endOfWeek, isSameMonth,
  startOfMonth, endOfMonth,
} from "date-fns"
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { STATUS_COLORS, getStatusColor, tripToCalendarEvent } from "@/lib/calendar-mock-data"
import type { CalendarEvent } from "@/lib/calendar-mock-data"
import { useCalendarTrips } from "@/lib/hooks/use-trips"
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView"
import { CalendarWeekView } from "@/components/calendar/CalendarWeekView"
import { CalendarDayView } from "@/components/calendar/CalendarDayView"
import { TripDetailModal } from "@/components/calendar/TripDetailModal"

type ViewMode = "month" | "week" | "day"

const VIEW_TABS: { value: ViewMode; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week",  label: "Week" },
  { value: "day",   label: "Day" },
]

const STATUS_FILTERS = [
  { value: "ALL",              label: "All" },
  { value: "CONFIRMED",        label: "Confirmed" },
  { value: "IN_PROGRESS",      label: "In Progress" },
  { value: "DISPATCHED",       label: "Dispatched" },
  { value: "DRIVER_EN_ROUTE",  label: "En Route" },
  { value: "COMPLETED",        label: "Completed" },
  { value: "CANCELLED",        label: "Cancelled" },
  { value: "UNASSIGNED",       label: "Unassigned" },
]

function periodLabel(view: ViewMode, date: Date): string {
  if (view === "month") return format(date, "MMMM yyyy")
  if (view === "week") {
    const ws = startOfWeek(date, { weekStartsOn: 0 })
    const we = endOfWeek(date, { weekStartsOn: 0 })
    return isSameMonth(ws, we)
      ? `${format(ws, "MMM d")} – ${format(we, "d, yyyy")}`
      : `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`
  }
  return format(date, "EEEE, MMMM d, yyyy")
}

function navigate(view: ViewMode, date: Date, dir: 1 | -1): Date {
  if (view === "month") return dir === 1 ? addMonths(date, 1) : subMonths(date, 1)
  if (view === "week")  return dir === 1 ? addWeeks(date, 1)  : subWeeks(date, 1)
  return dir === 1 ? addDays(date, 1) : subDays(date, 1)
}

export default function CalendarPage() {
  const [view, setView]             = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  // Computed client-side to avoid SSR UTC → local timezone mismatch
  const [today, setToday] = useState<Date | null>(null)
  useEffect(() => { setToday(new Date()) }, [])
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Fetch real trips for the visible month (+ 7 day padding for grid cells)
  const rangeStart = useMemo(() => addDays(startOfMonth(currentDate), -7), [currentDate])
  const rangeEnd   = useMemo(() => addDays(endOfMonth(currentDate),    7), [currentDate])
  const { data: rawTrips = [] } = useCalendarTrips({ dateFrom: rangeStart, dateTo: rangeEnd })

  const allEvents = useMemo(() => rawTrips.map(tripToCalendarEvent), [rawTrips])

  const events = useMemo(() => {
    if (statusFilter === "ALL") return allEvents
    return allEvents.filter(e => e.status === statusFilter)
  }, [allEvents, statusFilter])

  const hasActiveFilter = statusFilter !== "ALL"

  function handleSelectDay(day: Date) {
    setCurrentDate(day)
    setView("day")
  }

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 121px - env(safe-area-inset-bottom) - 64px)" }}
    >
      <style>{`
        .cal-view-enter { opacity: 0; transform: translateX(24px); }
        .cal-view-enter-active { opacity: 1; transform: translateX(0); transition: all 200ms ease-out; }
        .cal-view-exit { opacity: 1; transform: translateX(0); }
        .cal-view-exit-active { opacity: 0; transform: translateX(-24px); transition: all 200ms ease-out; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 rounded-2xl mb-3 overflow-hidden"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {/* Top row */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(d => navigate(view, d, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(d => navigate(view, d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Period label */}
          <button
            onClick={() => setCurrentDate(new Date())}
            className="flex-1 text-left"
          >
            <span className="text-base font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
              {periodLabel(view, currentDate)}
            </span>
          </button>

          {/* View toggle */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {VIEW_TABS.map(tab => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                style={view === tab.value
                  ? { background: "#c9a87c", color: "#0d1526" }
                  : { color: "rgba(255,255,255,0.60)", background: "transparent" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(f => !f)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[11px] font-semibold transition-colors"
            style={showFilters || hasActiveFilter
              ? { background: "rgba(201,168,124,0.15)", color: "#c9a87c", border: "1px solid rgba(201,168,124,0.25)" }
              : { background: "rgba(255,255,255,0.06)", color: "rgba(200,212,228,0.60)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilter && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#c9a87c" }}
              />
            )}
          </button>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className="px-4 py-3 flex items-center gap-2 overflow-x-auto"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                {STATUS_FILTERS.map(sf => {
                  const active = statusFilter === sf.value
                  const sc = sf.value !== "ALL" ? getStatusColor(sf.value) : null
                  return (
                    <button
                      key={sf.value}
                      onClick={() => setStatusFilter(sf.value)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                      style={active
                        ? { background: sc?.bg ?? "rgba(201,168,124,0.15)", color: sc?.text ?? "#c9a87c", border: `1px solid ${sc?.border ?? "rgba(201,168,124,0.30)"}` }
                        : { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.88)", border: "1px solid rgba(255,255,255,0.12)" }
                      }
                    >
                      {sc && <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? sc.dot : "rgba(255,255,255,0.35)" }} />}
                      {sf.label}
                    </button>
                  )
                })}
                {hasActiveFilter && (
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0"
                    style={{ color: "rgba(248,113,113,0.80)", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Calendar body ────────────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${view}-${format(currentDate, "yyyy-MM")}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-col flex-1 min-h-0 p-3"
          >
            {view === "month" && (
              <CalendarMonthView
                currentDate={currentDate}
                events={events}
                today={today}
                onSelectEvent={setSelectedEvent}
                onSelectDay={handleSelectDay}
              />
            )}
            {view === "week" && (
              <CalendarWeekView
                currentDate={currentDate}
                events={events}
                today={today}
                onSelectEvent={setSelectedEvent}
              />
            )}
            {view === "day" && (
              <CalendarDayView
                currentDate={currentDate}
                events={events}
                today={today}
                onSelectEvent={setSelectedEvent}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Trip Detail Modal */}
      <TripDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}
