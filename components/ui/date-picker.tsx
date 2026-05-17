"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  format, parse, isValid, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval,
} from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function MiniCalendar({ selected, onSelect }: { selected: Date | undefined; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date())

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth)),
    end:   endOfWeek(endOfMonth(viewMonth)),
  })

  return (
    <div className="p-3 select-none" style={{ width: 268 }}>
      {/* Month/year navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(subMonths(viewMonth, 1)) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
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
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <span className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>
          {format(viewMonth, "MMMM yyyy")}
        </span>

        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(addMonths(viewMonth, 1)) }}
          className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
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
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="h-7 flex items-center justify-center text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--lc-text-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const inMonth    = isSameMonth(day, viewMonth)
          const isSelected = selected ? isSameDay(day, selected) : false
          const isToday_   = isToday(day)

          let bgStyle: React.CSSProperties = { background: "transparent", borderRadius: "8px" }
          let colorStyle: React.CSSProperties = {}

          if (isSelected) {
            bgStyle = { background: "#c9a87c", borderRadius: "8px" }
            colorStyle = { color: "var(--lc-bg-surface)", fontWeight: 700 }
          } else if (isToday_) {
            colorStyle = { color: "#c9a87c", fontWeight: 600 }
          } else if (!inMonth) {
            colorStyle = { color: "var(--lc-text-muted)" }
          } else {
            colorStyle = { color: "var(--lc-text-secondary)" }
          }

          return (
            <button
              key={day.toISOString()}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect(day) }}
              className="h-8 w-full flex items-center justify-center text-sm transition-all relative"
              style={{ ...bgStyle, ...colorStyle }}
              onMouseEnter={e => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)"
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLElement).style.background = "transparent"
                }
              }}
            >
              {format(day, "d")}
              {/* Today dot indicator */}
              {isToday_ && !isSelected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: "#c9a87c" }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DatePickerInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function DatePickerInput({ value, onChange, placeholder = "MM/DD/YYYY", className, hasError }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = (() => {
    if (!value) return undefined
    const d = parse(value, "MM/dd/yyyy", new Date())
    return isValid(d) ? d : undefined
  })()

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  // Close on scroll so the popup stays anchored to its field
  useEffect(() => {
    if (!open) return
    function handleScroll() { setOpen(false) }
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true })
    return () => window.removeEventListener("scroll", handleScroll, { capture: true })
  }, [open])

  function openCalendar() {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const calendarHeight = 310
    const calendarWidth  = 268
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceRight = window.innerWidth - rect.left

    const top  = spaceBelow >= calendarHeight
      ? rect.bottom + 6
      : rect.top - calendarHeight - 6

    // Clamp horizontally so it doesn't overflow viewport
    const left = spaceRight >= calendarWidth
      ? rect.left
      : Math.max(8, rect.right - calendarWidth)

    setPopupStyle({ position: "fixed", top, left, zIndex: 9999 })
    setOpen(true)
  }

  function handleSelect(date: Date) {
    onChange(format(date, "MM/dd/yyyy"))
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Text input */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
          let formatted = digits
          if (digits.length > 4) formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`
          else if (digits.length > 2) formatted = `${digits.slice(0,2)}/${digits.slice(2)}`
          onChange(formatted)
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"
          openCalendar()
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = hasError ? "rgba(248,113,113,0.60)" : "var(--lc-border)"
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("w-full h-9 text-sm pl-3 pr-9 rounded-xl outline-none transition-colors dp-input", className)}
        style={{
          background: "var(--lc-bg-glass)",
          border: hasError ? "1px solid rgba(248,113,113,0.60)" : "1px solid var(--lc-border)",
          color: "var(--lc-text-primary)",
        }}
      />

      {/* Placeholder color */}
      <style>{`.dp-input::placeholder { color: var(--lc-text-muted); }`}</style>

      {/* Calendar icon button */}
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); open ? setOpen(false) : openCalendar() }}
        className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center rounded-r-xl transition-colors"
        style={{ color: "var(--lc-text-muted)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "#c9a87c")}
        onMouseLeave={e => (e.currentTarget.style.color = "var(--lc-text-muted)")}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {/* Portal calendar popup */}
      {open && createPortal(
        <div
          style={{
            ...popupStyle,
            background: "var(--lc-bg-surface)",
            border: "1px solid var(--lc-border)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.70)",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <MiniCalendar selected={selectedDate} onSelect={handleSelect} />
        </div>,
        document.body
      )}
    </div>
  )
}
