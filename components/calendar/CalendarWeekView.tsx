"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { format, isSameDay, startOfWeek, addDays } from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-mock-data"
import { getStatusColor, getVehicleColor, eventStartDate, eventEndDate, parsePickupTime } from "@/lib/calendar-mock-data"

const HOUR_START = 5      // 5 AM
const HOUR_END   = 23     // 11 PM
const TOTAL_HOURS = HOUR_END - HOUR_START
const HOUR_H = 64         // px per hour
const TOTAL_H = TOTAL_HOURS * HOUR_H  // 1152px
const LABEL_W = 52        // px for time label column

const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => HOUR_START + i)

function minutesToY(minutes: number): number {
  return ((minutes - HOUR_START * 60) / 60) * HOUR_H
}

interface LayoutEvent extends CalendarEvent {
  startMin: number; endMin: number; col: number; totalCols: number
}

function layoutDay(evs: CalendarEvent[]): LayoutEvent[] {
  const parsed: LayoutEvent[] = evs.map(e => {
    const { hours: sh, minutes: sm } = parsePickupTime(e.pickupTime)
    const startMin = sh * 60 + sm
    const endMin = startMin + e.durationMinutes
    return { ...e, startMin, endMin, col: 0, totalCols: 1 }
  }).sort((a, b) => a.startMin - b.startMin)

  const colEnds: number[] = []
  for (const ev of parsed) {
    let c = colEnds.findIndex(end => end <= ev.startMin)
    if (c === -1) c = colEnds.length
    colEnds[c] = ev.endMin
    ev.col = c
  }
  const total = colEnds.length || 1
  parsed.forEach(ev => { ev.totalCols = total })
  return parsed
}

function useNow(): Date { const [now, setNow] = useState(new Date()); useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id) }, []); return now }

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  today: Date | null
  onSelectEvent: (e: CalendarEvent) => void
}

export function CalendarWeekView({ currentDate, events, today, onSelectEvent }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useNow()

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const y = minutesToY(nowMin)
    scrollRef.current.scrollTop = Math.max(0, y - 120)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const ev of events) {
      const key = ev.pickupDate.split("T")[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return map
  }, [events])

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowY = minutesToY(nowMin)
  const showNowLine = nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Day headers — sticky */}
      <div
        className="flex flex-shrink-0 sticky top-0 z-10"
        style={{
          background: "#080c16",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingLeft: `${LABEL_W}px`,
        }}
      >
        {days.map((day) => {
          const tod = today ? isSameDay(day, today) : false
          return (
            <div key={day.toISOString()} className="flex-1 text-center py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(200,212,228,0.40)" }}>
                {format(day, "EEE")}
              </div>
              <div
                className="w-8 h-8 flex items-center justify-center rounded-full mx-auto text-sm font-bold"
                style={tod
                  ? { background: "#c9a87c", color: "#0d1526" }
                  : { color: "rgba(255,255,255,0.85)" }
                }
              >
                {format(day, "d")}
              </div>
            </div>
          )
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="relative flex" style={{ height: `${TOTAL_H}px` }}>

          {/* Time labels */}
          <div className="flex-shrink-0 relative" style={{ width: `${LABEL_W}px` }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-0 pr-2 flex items-center justify-end"
                style={{ top: `${(h - HOUR_START) * HOUR_H - 9}px`, height: "18px" }}
              >
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(200,212,228,0.30)" }}>
                  {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1 relative">
            {/* Hour grid lines */}
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0"
                style={{ top: `${(h - HOUR_START) * HOUR_H}px`, height: "1px", background: "rgba(255,255,255,0.05)" }}
              />
            ))}

            {/* Current time line */}
            {showNowLine && (
              <div className="absolute inset-x-0 z-20 pointer-events-none flex items-center" style={{ top: `${nowY}px` }}>
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#ef4444", marginLeft: "-4px" }} />
                <div className="flex-1" style={{ height: "1.5px", background: "#ef4444", opacity: 0.8 }} />
              </div>
            )}

            {/* Day columns */}
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd")
              const dayEvs = layoutDay(eventsByDay.get(key) ?? [])
              const isT = today ? isSameDay(day, today) : false

              return (
                <div
                  key={key}
                  className="flex-1 relative"
                  style={{
                    borderLeft: "1px solid rgba(255,255,255,0.05)",
                    background: isT ? "rgba(201,168,124,0.025)" : "transparent",
                  }}
                >
                  {dayEvs.map((ev) => {
                    const sc = getStatusColor(ev.status)
                    const vc = getVehicleColor(ev.vehicleId, ev.vehicleName)
                    const c = vc ?? sc
                    const y = Math.max(0, minutesToY(ev.startMin))
                    const h = Math.max(28, (ev.durationMinutes / 60) * HOUR_H)
                    const colW = 1 / ev.totalCols
                    const left = `calc(${ev.col * colW * 100}% + 2px)`
                    const width = `calc(${colW * 100}% - 4px)`

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent(ev)}
                        className="absolute rounded-lg overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60"
                        style={{
                          top: `${y}px`,
                          height: `${h}px`,
                          left,
                          width,
                          background: c.bg,
                          borderLeft: `3px solid ${c.dot}`,
                          border: `1px solid ${c.border}`,
                          borderLeftWidth: "3px",
                          zIndex: 5,
                          padding: "3px 5px",
                        }}
                      >
                        <div className="text-[9px] font-bold truncate" style={{ color: c.dot }}>
                          {ev.pickupTime.replace(":00", "").replace(" ", "")}
                        </div>
                        {h >= 40 && (
                          <div className="text-[10px] font-semibold truncate leading-tight" style={{ color: c.text }}>
                            {ev.clientName}
                          </div>
                        )}
                        {h >= 56 && (
                          <div className="text-[9px] truncate leading-tight" style={{ color: c.dot, opacity: 0.75 }}>
                            {ev.vehicleName ?? ev.vehicleType}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
