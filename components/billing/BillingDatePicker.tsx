"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [popupStyle, setPopupStyle]       = useState<React.CSSProperties>({})
  const [currentMonth, setCurrentMonth]   = useState(new Date())
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate ? new Date(startDate) : null)
  const [selectedEnd, setSelectedEnd]     = useState<Date | null>(endDate   ? new Date(endDate)   : null)
  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start")
  const [dateMode, setDateMode]           = useState<"single" | "range">(
    endDate && startDate !== endDate ? "range" : "single"
  )
  const btnRef = useRef<HTMLButtonElement>(null)

  function openCalendar() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const popupWidth  = 300
    const spaceRight  = window.innerWidth - rect.left
    const left = spaceRight >= popupWidth ? rect.left : Math.max(8, rect.right - popupWidth)
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left,
      width: popupWidth,
      zIndex: 9999,
    })
    setIsOpen(true)
  }

  // Close on outside mousedown
  useEffect(() => {
    if (!isOpen) return
    function handle(e: MouseEvent) {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isOpen])

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return
    function handle() { setIsOpen(false) }
    window.addEventListener("scroll", handle, { passive: true, capture: true })
    return () => window.removeEventListener("scroll", handle, { capture: true })
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

  const monthDays   = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const paddingDays = Array(startOfMonth(currentMonth).getDay()).fill(null)
  const isActive    = !!selectedStart

  const getDayStyle = (day: Date): React.CSSProperties => {
    const isStart     = selectedStart && isSameDay(day, selectedStart)
    const isEnd       = selectedEnd   && isSameDay(day, selectedEnd)
    const inRange     = selectedStart && selectedEnd && isWithinInterval(day, { start: selectedStart, end: selectedEnd })
    const beforeStart = selectedStart && selectionMode === "end" && isBefore(day, selectedStart)

    if (beforeStart) return { color: "var(--lc-text-muted)", cursor: "not-allowed", opacity: 0.35 }
    if (isStart || isEnd) return { background: "#c9a87c", color: "var(--lc-bg-page)", fontWeight: 600, cursor: "pointer", borderRadius: "8px" }
    if (inRange) return { background: "rgba(201,168,124,0.12)", color: "var(--lc-text-secondary)", cursor: "pointer", borderRadius: "8px" }
    return { color: "var(--lc-text-secondary)", cursor: "pointer", borderRadius: "8px" }
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => isOpen ? setIsOpen(false) : openCalendar()}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap"
        style={isActive
          ? { background: "rgba(201,168,124,0.15)", border: "1px solid rgba(201,168,124,0.30)", color: "#c9a87c" }
          : { background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-secondary)" }
        }
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{displayValue}</span>
        {isActive && (
          <span
            onClick={handleClear}
            className="cursor-pointer"
            style={{ color: "rgba(201,168,124,0.60)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0.6"}
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          style={{
            ...popupStyle,
            background: "var(--lc-bg-surface)",
            border: "1px solid var(--lc-border)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            padding: "16px",
          }}
        >
          {/* Mode toggle */}
          <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "var(--lc-bg-glass)" }}>
            {(["single", "range"] as const).map((mode) => (
              <button
                key={mode}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setDateMode(mode); setSelectionMode("start"); if (mode === "single") setSelectedEnd(null) }}
                className="flex-1 py-1.5 rounded-[9px] text-[12px] font-semibold transition-all duration-150 cursor-pointer capitalize"
                style={dateMode === mode
                  ? { background: "#c9a87c", color: "var(--lc-bg-page)" }
                  : { color: "var(--lc-text-dim)" }
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
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.14em" }}>
                  Step {selectionMode === "start" ? "1" : "2"} / 2
                </span>
                <span className="text-[11px] font-medium" style={{ color: "var(--lc-text-dim)" }}>
                  {selectionMode === "start" ? "Select start date" : "Select end date"}
                </span>
              </div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "var(--lc-bg-glass-mid)" }}>
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
                  <span className="text-[13px] font-semibold" style={{ color: selectedEnd ? "#c9a87c" : "var(--lc-text-dim)" }}>
                    {selectedEnd ? format(selectedEnd, "MMM d, yyyy") : "End date"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Clear button */}
          {selectedStart && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setSelectedStart(null); setSelectedEnd(null); setSelectionMode("start"); onChange(null, null) }}
              className="w-full mb-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer"
              style={{ color: "var(--lc-text-dim)", background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f87171"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--lc-text-dim)"}
            >
              Clear selection
            </button>
          )}

          {/* Calendar nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-100 cursor-pointer"
              style={{ color: "var(--lc-text-dim)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-semibold" style={{ color: "var(--lc-text-primary)" }}>
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-100 cursor-pointer"
              style={{ color: "var(--lc-text-dim)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[11px] font-semibold" style={{ color: "var(--lc-text-muted)" }}>
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleDayClick(day)}
                className="h-8 flex items-center justify-center text-[12px] transition-all duration-100"
                style={getDayStyle(day)}
                onMouseEnter={e => {
                  const s = getDayStyle(day)
                  if (!s.background) (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)"
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
          <div style={{ borderTop: "1px solid var(--lc-border)", paddingTop: "12px" }} className="space-y-0.5">
            {[
              { label: "Today",        action: () => { const t = new Date(); setSelectedStart(t); setSelectedEnd(t); onChange(format(t,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
              { label: "Last 7 days",  action: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate()-7);  setSelectedStart(s); setSelectedEnd(t); onChange(format(s,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
              { label: "Last 30 days", action: () => { const t = new Date(); const s = new Date(t); s.setDate(t.getDate()-30); setSelectedStart(s); setSelectedEnd(t); onChange(format(s,"yyyy-MM-dd"), format(t,"yyyy-MM-dd")); setIsOpen(false) } },
            ].map(({ label, action }) => (
              <button
                key={label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={action}
                className="w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium transition-colors duration-100 cursor-pointer"
                style={{ color: "var(--lc-text-dim)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-primary)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent"
                  ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-dim)"
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
