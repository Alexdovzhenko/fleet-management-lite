"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, ArrowRight, Car, UserCheck, Users, Calendar, Clock, FileText, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import type { CalendarEvent } from "@/lib/calendar-mock-data"
import { getStatusColor, eventStartDate, eventEndDate, parsePickupTime } from "@/lib/calendar-mock-data"
import Link from "next/link"

const VEHICLE_LABEL: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Vehicle",
}

interface TripDetailModalProps {
  event: CalendarEvent | null
  onClose: () => void
}

export function TripDetailModal({ event, onClose }: TripDetailModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!event) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [event, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (event) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [event])

  if (typeof window === "undefined") return null

  const sc = event ? getStatusColor(event.status) : null
  const startDate = event ? eventStartDate(event) : null
  const endDate = event ? eventEndDate(event) : null

  function formatTimeRange(e: CalendarEvent) {
    const { hours: sh, minutes: sm } = parsePickupTime(e.pickupTime)
    const endM = new Date()
    endM.setHours(sh, sm + e.durationMinutes, 0, 0)
    const fmt = (h: number, m: number) => {
      const ampm = h >= 12 ? "PM" : "AM"
      const hh = h % 12 || 12
      return `${hh}:${String(m).padStart(2, "0")} ${ampm}`
    }
    return `${e.pickupTime} — ${fmt(endM.getHours(), endM.getMinutes())}`
  }

  return createPortal(
    <AnimatePresence>
      {event && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={backdropRef}
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200]"
            style={{ background: "rgba(0,0,0,0.60)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38, mass: 0.85 }}
            className="fixed bottom-0 inset-x-0 z-[201] flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 -24px 80px rgba(0,0,0,0.60)",
              maxHeight: "88vh",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.20)" }} />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* Header */}
              <div className="px-5 pt-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide"
                        style={{ background: sc?.bg, color: sc?.text, border: `1px solid ${sc?.border}` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sc?.dot }} />
                        {sc?.label}
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: "rgba(200,212,228,0.40)" }}>
                        {event.tripNumber}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold leading-tight" style={{ color: "rgba(255,255,255,0.95)" }}>
                      {event.clientName}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 transition-colors"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.60)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">

                {/* Date + Time */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}>
                    <Calendar className="w-4 h-4" style={{ color: "#c9a87c" }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.90)" }}>
                      {startDate ? format(startDate, "EEEE, MMMM d, yyyy") : "—"}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3" style={{ color: "rgba(200,212,228,0.45)" }} />
                      <span className="text-[12px]" style={{ color: "rgba(200,212,228,0.65)" }}>
                        {formatTimeRange(event)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Route */}
                <div
                  className="rounded-2xl p-4 space-y-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center flex-shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }} />
                      <div className="w-px flex-1 my-1" style={{ background: "rgba(255,255,255,0.12)", height: "32px" }} />
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#f87171" }} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(52,211,153,0.70)" }}>Pickup</div>
                        <div className="text-sm font-medium leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{event.pickupAddress}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(248,113,113,0.70)" }}>Drop-off</div>
                        <div className="text-sm font-medium leading-snug" style={{ color: "rgba(255,255,255,0.88)" }}>{event.dropoffAddress}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver + Vehicle */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <UserCheck className="w-3.5 h-3.5" style={{ color: "rgba(165,180,252,0.80)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(165,180,252,0.65)" }}>Driver</span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {event.driverName ?? <span style={{ color: "rgba(245,158,11,0.80)" }}>Unassigned</span>}
                    </div>
                    {event.driverName && (
                      <div
                        className="mt-1.5 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "rgba(99,102,241,0.40)", color: "rgba(165,180,252,0.95)" }}
                      >
                        {event.driverInitials}
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Car className="w-3.5 h-3.5" style={{ color: "rgba(200,212,228,0.50)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.45)" }}>Vehicle</span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>
                      {VEHICLE_LABEL[event.vehicleType] ?? event.vehicleType}
                    </div>
                    {event.vehicleId && (
                      <div className="text-[11px] mt-0.5" style={{ color: "rgba(200,212,228,0.45)" }}>{event.vehicleId}</div>
                    )}
                  </div>
                </div>

                {/* Passengers */}
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Users className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(200,212,228,0.50)" }} />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.80)" }}>
                    <strong style={{ color: "rgba(255,255,255,0.95)" }}>{event.passengerCount}</strong>{" "}
                    {event.passengerCount === 1 ? "passenger" : "passengers"}
                  </span>
                </div>

                {/* Notes */}
                {event.notes && (
                  <div className="rounded-xl px-3.5 py-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <FileText className="w-3.5 h-3.5" style={{ color: "rgba(251,191,36,0.70)" }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(251,191,36,0.65)" }}>Notes</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{event.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div
              className="flex gap-3 px-5 py-4 flex-shrink-0"
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                background: "#080c16",
                paddingBottom: "max(16px, env(safe-area-inset-bottom))",
              }}
            >
              <button
                onClick={onClose}
                className="flex-1 h-11 text-sm font-semibold rounded-2xl transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.75)" }}
              >
                Close
              </button>
              <Link
                href={`/dispatch?open=${event.id}`}
                className="flex-1 h-11 text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#c9a87c", color: "#0d1526" }}
                onClick={onClose}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Edit Trip
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
