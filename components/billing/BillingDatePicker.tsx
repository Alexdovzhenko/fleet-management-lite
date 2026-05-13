"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, X, ChevronLeft, ChevronRight as ChevronRightIcon, ChevronRight as Arrow } from "lucide-react"
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isWithinInterval, isBefore,
} from "date-fns"

interface BillingDatePickerProps {
  startDate: string | null
  endDate: string | null
  onChange: (startDate: string | null, endDate: string | null) => void
}

export function BillingDatePicker({ startDate, endDate, onChange }: BillingDatePickerProps) {
  const [isOpen, setIsOpen]               = useState(false)
  const [currentMonth, setCurrentMonth]   = useState(new Date())
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate ? new Date(startDate) : null)
  const [selectedEnd, setSelectedEnd]     = useState<Date | null>(endDate   ? new Date(endDate)   : null)
  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start")
  const [dateMode, setDateMode]           = useState<"single" | "range">(
    endDate && startDate !== endDate ? "range" : "single"
  )
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleDayClick = (day: Date) => {
    if (dateMode === "single") {
      setSelectedStart(day); setSelectedEnd(day)
      onChange(format(day, "yyyy-MM-dd"), format(day, "yyyy-MM-dd"))
      setIsOpen(false)
      return
    }
    if (selectionMode === "start") {
      setSelectedStart(day); setSelectionMode("end")
      if (selectedEnd && day > selectedEnd) setSelectedEnd(null)
    } else {
      if (selectedStart && isBefore(day, selectedStart)) return
      setSelectedEnd(day)
      const startStr = format(selectedStart!, "yyyy-MM-dd")
      const endStr   = format(day, "yyyy-MM-dd")
      onChange(startStr, endStr)
      setIsOpen(false)
      setSelectionMode("start")
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedStart(null); setSelectedEnd(null); setSelectionMode("start")
    onChange(null, null)
  }

  const displayValue =
    selectedStart && selectedEnd && !isSameDay(selectedStart, selectedEnd)
      ? `${format(selectedStart, "MMM d")} – ${format(selectedEnd, "MMM d, yyyy")}`
      : selectedStart ? format(selectedStart, "MMM d, yyyy") : "Filter by date"

  const monthDays     = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const paddingDays   = Array(startOfMonth(currentMonth).getDay()).fill(null)
  const hasDate       = !!selectedStart
  const isActive      = hasDate

  const getDayStyle = (day: Date): React.CSSProperties => {
    const isStart      = selectedStart && isSameDay(day, selectedStart)
    const isEnd        = selectedEnd   && isSameDay(day, selectedEnd)
    const inRange      = selectedStart && selectedEnd && isWithinInterval(day, { start: selectedStart, end: selectedEnd })
    const beforeStart  = selectedStart && selectionMode === "end" && isBefore(day, selectedStart)

    if (beforeStart) return { color: "rgba(200,212,228,0.20)", cursor: "not-allowed" }
    if (isStart || isEnd) return { background: "#c9a87c", color: "#080c16", fontWeight: 600, cursor: "pointer", borderRadius: "8px" }
    if (inRange) return { background: "rgba(201,168,124,0.12)", color: "rgba(255,255,255,0.80)", cursor: "pointer", borderRadius: "8px" }
    return { color: "rgba(200,212,228,0.75)", cursor: "pointer", borderRadius: "8px" }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap"
        style={isActive
          ? { background: "rgba(201,168,124,0.15)", border: "1px solid rgba(201,168,124,0.30)", color: "#c9a87c" }
          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(200,212,228,0.70)" }
        }
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{displayValue}</span>
        {hasDate && (
          <span
            onClick={handleClear}
            className="cursor-pointer"
            style={{ color: isActive ? "rgba(201,168,124,0.60)" : "rgba(200,212,228,0.38)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.6"}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-1.5 left-0 z-50 rounded-2xl p-4 w-[300px]"
          style={{
            background: "#0d1526",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.70)",
          }}
        >
          {/* Mode toggle */}
          <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["single", "range"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setDateMode(mode); setSelectionMode("start"); if (mode === "single") setSelectedEnd(null) }}
                className="flex-1 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all duration-150 cursor-pointer capitalize"
                style={dateMode === mode
                  ? { background: "#c9a87c", color: "#080c16" }
                  : { color: "rgba(200,212,228,0.55)" }
                }
              >
                {mode === "single" ? "Single Date" : "Date Range"}
              </button>
            ))}
          </div>

          {/* Range progress */}
          {dateMode === "range" && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.40)", letterSpacing: "0.14em" }}>
                  Step {selectionMode === "start" ? "1" : "2"} / 2
                </span>
                <span className="text-[11px] font-medium" style={{ color: "rgba(200,212,228,0.55)" }}>
                  {selectionMode === "start" ? "Select start date" : "Select end date"}
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: selectionMode === "start" ? "50%" : "100%", background: "#c9a87c" }}
                />
              </div>
            </div>
          )}

          {/* Selected date display */}
          {selectedStart && (
            <div
              className="mb-4 px-3 py-2.5 rounded-xl flex items-center justify-between"
              style={{ background: "rgba(201,168,124,0.09)", border: "1px solid rgba(201,168,124,0.18)" }}
            >
              {dateMode === "single" ? (
                <span className="text-[13px] font-semibold" style={{ color: "#c9a87c" }}>
                  {format(selectedStart, "MMM d, yyyy")}
                </span>
              ) : (
                <>
                  <span className="text-[13px] font-semibold" style={{ color: "#c9a87c" }}>
                    {format(selectedStart, "MMM d")}
                  </span>
                  <Arrow className="w-4 h-4" style={{ color: "rgba(201,168,124,0.50)" }} />
                  <span className="text-[13px] font-semibold" style={{ color: selectedEnd ? "#c9a87c" : "rgba(200,212,228,0.55)" }}>
                    {selectedEnd ? format(selectedEnd, "MMM d, yyyy") : "End date"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Clear button */}
          {selectedStart && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedStart(null); setSelectedEnd(null); setSelectionMode("start"); onChange(null, null) }}
              className="w-full mb-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer"
              style={{ color: "rgba(200,212,228,0.55)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.55)"}
            >
              Clear selection
            </button>
          )}

          {/* Calendar nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-100 cursor-pointer"
              style={{ color: "rgba(200,212,228,0.55)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-100 cursor-pointer"
              style={{ color: "rgba(200,212,228,0.55)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[11px] font-semibold" style={{ color: "rgba(200,212,228,0.55)" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 mb-4">
            {paddingDays.map((_, i) => <div key={`pad-${i}`} className="h-8" />)}
            {monthDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className="h-8 flex items-center justify-center text-[12px] transition-all duration-100"
                style={getDayStyle(day)}
                onMouseEnter={e => {
                  const s = getDayStyle(day)
                  if (!s.background) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                }}
                onMouseLeave={e => {
                  const s = getDayStyle(day)
                  if (!s.background) (e.currentTarget as HTMLElement).style.background = "transparent"
                }}
              >
                {format(day, "d")}
              </button>
            ))}
          </div>

          {/* Quick ranges */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "12px" }} className="space-y-0.5">
            {[
              { label: "Today",       action: () => { const t = new Date(); setSelectedStart(t); setSelectedEnd(t); onChange(format(t,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
              { label: "Last 7 days", action: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate()-7); setSelectedStart(s); setSelectedEnd(t); onChange(format(s,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
              { label: "Last 30 days",action: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate()-30); setSelectedStart(s); setSelectedEnd(t); onChange(format(s,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
            ].map(({ label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors duration-100 cursor-pointer"
                style={{ color: "rgba(200,212,228,0.65)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                  ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent"
                  ;(e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.65)"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
