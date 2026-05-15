"use client"

import { useMemo, useState } from "react"
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, isSameMonth, format, addDays,
} from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-mock-data"
import { getStatusColor } from "@/lib/calendar-mock-data"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MAX_PILLS = 3

interface CalendarMonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  today: Date | null
  onSelectEvent: (e: CalendarEvent) => void
  onSelectDay: (d: Date) => void
}

function tripsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>()
  for (const ev of events) {
    const key = ev.pickupDate.split("T")[0]
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(ev)
  }
  return map
}

function TripPill({ event, onClick }: { event: CalendarEvent; onClick: (e: CalendarEvent) => void }) {
  const sc = getStatusColor(event.status)
  return (
    <button
      type="button"
      onClick={(ev) => { ev.stopPropagation(); onClick(event) }}
      className="w-full flex items-center gap-1 px-1.5 py-0.5 rounded-md text-left overflow-hidden transition-opacity hover:opacity-80"
      style={{ background: sc.bg, borderLeft: `2px solid ${sc.dot}` }}
    >
      <span className="text-[9px] font-semibold tabular-nums flex-shrink-0" style={{ color: sc.text }}>
        {event.pickupTime.replace(":00", "").replace(" ", "")}
      </span>
      <span className="text-[9px] font-medium truncate" style={{ color: sc.text }}>
        {event.clientName}
      </span>
      {event.vehicleName && (
        <span className="text-[9px] font-medium flex-shrink-0" style={{ color: sc.text, opacity: 0.55 }}>
          · {event.vehicleName}
        </span>
      )}
    </button>
  )
}

export function CalendarMonthView({ currentDate, events, today, onSelectEvent, onSelectDay }: CalendarMonthViewProps) {
  const eventMap = useMemo(() => tripsByDate(events), [events])

  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const cells: Date[] = []
    // Pad start with previous month days
    const startDow = getDay(start)
    for (let i = startDow - 1; i >= 0; i--) cells.push(addDays(start, -i - 1))
    // Current month
    eachDayOfInterval({ start, end }).forEach(d => cells.push(d))
    // Pad end to complete last row (always 6 rows = 42 cells)
    while (cells.length < 42) cells.push(addDays(cells[cells.length - 1], 1))
    return cells
  }, [currentDate])

  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.40)" }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
        {days.map((day, idx) => {
          const key = format(day, "yyyy-MM-dd")
          const dayEvents = eventMap.get(key) ?? []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isThisToday = today ? isSameDay(day, today) : false
          const isExpanded = expandedDay === key
          const overflow = dayEvents.length > MAX_PILLS
          const displayEvents = isExpanded ? dayEvents : dayEvents.slice(0, MAX_PILLS)
          const colStart = idx % 7

          return (
            <div
              key={key}
              onClick={() => onSelectDay(day)}
              className="relative flex flex-col cursor-pointer transition-colors group"
              style={{
                minHeight: "100px",
                background: isThisToday ? "rgba(201,168,124,0.06)" : "transparent",
                borderRight: colStart < 6 ? "1px solid rgba(255,255,255,0.06)" : "none",
                borderBottom: idx < 35 ? "1px solid rgba(255,255,255,0.06)" : "none",
                opacity: isCurrentMonth ? 1 : 0.4,
              }}
            >
              {/* Hover state */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-sm"
                style={{ background: "rgba(255,255,255,0.03)" }}
              />

              {/* Day number */}
              <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
                <span
                  className="w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold"
                  style={isThisToday
                    ? { background: "#c9a87c", color: "#0d1526" }
                    : { color: isCurrentMonth ? "rgba(255,255,255,0.80)" : "rgba(200,212,228,0.30)" }
                  }
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Trip pills */}
              <div className="flex flex-col gap-0.5 px-1 pb-1.5 flex-1">
                {displayEvents.map(ev => (
                  <TripPill key={ev.id} event={ev} onClick={onSelectEvent} />
                ))}
                {overflow && !isExpanded && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpandedDay(key) }}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-left transition-colors"
                    style={{ color: "rgba(201,168,124,0.80)", background: "rgba(201,168,124,0.08)" }}
                  >
                    +{dayEvents.length - MAX_PILLS} more
                  </button>
                )}
                {isExpanded && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setExpandedDay(null) }}
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md text-left transition-colors"
                    style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.04)" }}
                  >
                    Show less
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
