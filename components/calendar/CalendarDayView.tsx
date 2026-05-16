"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { format, isSameDay } from "date-fns"
import { Users, Car, UserCheck } from "lucide-react"
import type { CalendarEvent } from "@/lib/calendar-mock-data"
import { getStatusColor, getVehicleColor, parsePickupTime } from "@/lib/calendar-mock-data"

const HOUR_START = 5
const HOUR_END   = 23
const HOUR_H     = 80      // taller than week for more detail
const TOTAL_H    = (HOUR_END - HOUR_START) * HOUR_H
const LABEL_W    = 52
const hours      = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

function minutesToY(m: number): number {
  return ((m - HOUR_START * 60) / 60) * HOUR_H
}

function useNow(): Date {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id) }, [])
  return now
}

const VEHICLE_LABEL: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Vehicle",
}

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  today: Date | null
  onSelectEvent: (e: CalendarEvent) => void
}

export function CalendarDayView({ currentDate, events, today, onSelectEvent }: DayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const now = useNow()
  const isT = today ? isSameDay(currentDate, today) : false

  const dayEvents = useMemo(() => {
    const key = format(currentDate, "yyyy-MM-dd")
    return events
      .filter(e => e.pickupDate.split("T")[0] === key)
      .map(e => {
        const { hours: sh, minutes: sm } = parsePickupTime(e.pickupTime)
        return { ...e, startMin: sh * 60 + sm }
      })
      .sort((a, b) => a.startMin - b.startMin)
  }, [currentDate, events])

  useEffect(() => {
    if (!scrollRef.current) return
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const y = minutesToY(nowMin)
    scrollRef.current.scrollTop = Math.max(0, y - 120)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nowMin = now.getHours() * 60 + now.getMinutes()
  const nowY = minutesToY(nowMin)
  const showNow = isT && nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Summary bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--lc-bg-glass-mid)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>
          {dayEvents.length === 0 ? "No trips" : `${dayEvents.length} trip${dayEvents.length !== 1 ? "s" : ""}`}
        </span>
        <div className="flex items-center gap-1.5">
          {dayEvents.slice(0, 6).map(ev => {
            const sc = getStatusColor(ev.status)
            return (
              <span key={ev.id} className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
            )
          })}
          {dayEvents.length > 6 && (
            <span className="text-[10px]" style={{ color: "var(--lc-text-muted)" }}>+{dayEvents.length - 6}</span>
          )}
        </div>
        {dayEvents.length === 0 && (
          <span className="text-xs" style={{ color: "var(--lc-text-muted)" }}>
            — nothing scheduled for {format(currentDate, "MMMM d")}
          </span>
        )}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative">
        <div className="relative flex" style={{ height: `${TOTAL_H}px` }}>

          {/* Time labels */}
          <div className="flex-shrink-0 relative" style={{ width: `${LABEL_W}px` }}>
            {hours.map(h => (
              <div
                key={h}
                className="absolute right-0 pr-2 flex items-center"
                style={{ top: `${(h - HOUR_START) * HOUR_H - 9}px`, height: "18px" }}
              >
                <span className="text-[10px] tabular-nums" style={{ color: "var(--lc-text-muted)" }}>
                  {h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}
                </span>
              </div>
            ))}
          </div>

          {/* Content column */}
          <div className="flex-1 relative" style={{ borderLeft: "1px solid var(--lc-bg-glass)" }}>
            {/* Hour lines */}
            {hours.map(h => (
              <div
                key={h}
                className="absolute inset-x-0"
                style={{ top: `${(h - HOUR_START) * HOUR_H}px`, height: "1px", background: "var(--lc-bg-glass)" }}
              />
            ))}

            {/* Current time */}
            {showNow && (
              <div className="absolute inset-x-0 z-20 pointer-events-none flex items-center" style={{ top: `${nowY}px` }}>
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "#ef4444", marginLeft: "-5px" }} />
                <div className="flex-1" style={{ height: "1.5px", background: "#ef4444", opacity: 0.85 }} />
              </div>
            )}

            {/* Empty state */}
            {dayEvents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}>
                    <span className="text-2xl">📅</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: "var(--lc-text-label)" }}>No trips scheduled</p>
                </div>
              </div>
            )}

            {/* Trip cards */}
            {dayEvents.map((ev) => {
              const sc = getStatusColor(ev.status)
              const vc = getVehicleColor(ev.vehicleId, ev.vehicleName)
              const c = vc ?? sc
              const y = Math.max(0, minutesToY(ev.startMin))
              const h = Math.max(52, (ev.durationMinutes / 60) * HOUR_H)

              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="absolute rounded-xl text-left overflow-hidden transition-all hover:opacity-90 hover:scale-[1.005]"
                  style={{
                    top: `${y + 2}px`,
                    height: `${h - 4}px`,
                    left: "6px",
                    right: "6px",
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderLeft: `4px solid ${c.dot}`,
                    zIndex: 5,
                    padding: "8px 10px",
                  }}
                >
                  {/* Top row: time + status badge (status always uses sc for semantic meaning) */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: c.dot }}>
                      {ev.pickupTime}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                      style={{ background: `${sc.dot}22`, color: sc.dot }}
                    >
                      {sc.label}
                    </span>
                  </div>

                  {/* Client name + vehicle inline */}
                  <div className="flex items-center gap-2 leading-tight">
                    <span className="text-sm font-bold truncate" style={{ color: "var(--lc-text-primary)" }}>
                      {ev.clientName}
                    </span>
                    {ev.vehicleName && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Car className="w-3 h-3" style={{ color: c.dot, opacity: 0.75 }} />
                        <span className="text-[11px] font-semibold" style={{ color: c.dot, opacity: 0.85 }}>
                          {ev.vehicleName}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Route (if tall enough) */}
                  {h >= 80 && (
                    <div className="mt-1.5 text-[11px] leading-snug" style={{ color: c.text, opacity: 0.80 }}>
                      <span className="truncate block">{ev.pickupAddress}</span>
                      {h >= 100 && (
                        <span className="truncate block mt-0.5">{ev.dropoffAddress}</span>
                      )}
                    </div>
                  )}

                  {/* Metadata row (if tall enough) */}
                  {h >= 120 && (
                    <div className="flex items-center gap-3 mt-2">
                      {ev.driverName && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: c.text, opacity: 0.65 }}>
                          <UserCheck className="w-3 h-3" /> {ev.driverName.split(" ")[0]}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: c.dot, opacity: 0.85 }}>
                        <Car className="w-3 h-3" /> {ev.vehicleName ?? VEHICLE_LABEL[ev.vehicleType] ?? ev.vehicleType}
                      </span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: c.text, opacity: 0.65 }}>
                        <Users className="w-3 h-3" /> {ev.passengerCount}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
