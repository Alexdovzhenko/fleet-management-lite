"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2, ChevronDown, Clock } from "lucide-react"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import type { Trip, TripStatus } from "@/types"
import { cn, formatTime, getTripStatusLabel } from "@/lib/utils"

// ─── Color maps (fully resolved classes so Tailwind includes them) ────────────

const DOT: Record<string, string> = {
  blue:    "bg-blue-500",
  amber:   "bg-amber-500",
  yellow:  "bg-yellow-400",
  emerald: "bg-emerald-500",
  gray:    "bg-gray-400",
  violet:  "bg-violet-500",
  red:     "bg-red-500",
  teal:    "bg-teal-500",
  pink:    "bg-pink-500",
  indigo:  "bg-indigo-500",
}

const ACTIVE_BG: Record<string, string> = {
  blue:    "bg-blue-50",
  amber:   "bg-amber-50",
  yellow:  "bg-yellow-50",
  emerald: "bg-emerald-50",
  gray:    "bg-gray-100",
  violet:  "bg-violet-50",
  red:     "bg-red-50",
  teal:    "bg-teal-50",
  pink:    "bg-pink-50",
  indigo:  "bg-indigo-50",
}

const ACTIVE_TEXT: Record<string, string> = {
  blue:    "text-blue-700",
  amber:   "text-amber-700",
  yellow:  "text-yellow-700",
  emerald: "text-emerald-700",
  gray:    "text-gray-600",
  violet:  "text-violet-700",
  red:     "text-red-700",
  teal:    "text-teal-700",
  pink:    "text-pink-700",
  indigo:  "text-indigo-700",
}

const ACTIVE_CHECK: Record<string, string> = {
  blue:    "text-blue-500",
  amber:   "text-amber-500",
  yellow:  "text-yellow-500",
  emerald: "text-emerald-500",
  gray:    "text-gray-400",
  violet:  "text-violet-500",
  red:     "text-red-500",
  teal:    "text-teal-500",
  pink:    "text-pink-500",
  indigo:  "text-indigo-500",
}

const LEFT_BAR: Record<string, string> = {
  blue:    "bg-blue-400",
  amber:   "bg-amber-400",
  yellow:  "bg-yellow-400",
  emerald: "bg-emerald-400",
  gray:    "bg-gray-400",
  violet:  "bg-violet-400",
  red:     "bg-red-400",
  teal:    "bg-teal-400",
  pink:    "bg-pink-400",
  indigo:  "bg-indigo-400",
}

// ─── All statuses in display order ────────────────────────────────────────────

const ALL_TRIP_STATUSES: TripStatus[] = [
  "QUOTE", "CONFIRMED", "DISPATCHED", "DRIVER_EN_ROUTE",
  "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW",
]

const STATUS_COLOR: Record<TripStatus, string> = {
  UNASSIGNED:      "gray",
  QUOTE:           "gray",
  CONFIRMED:       "blue",
  DISPATCHED:      "violet",
  DRIVER_EN_ROUTE: "amber",
  DRIVER_ARRIVED:  "yellow",
  IN_PROGRESS:     "emerald",
  COMPLETED:       "gray",
  CANCELLED:       "red",
  NO_SHOW:         "red",
}

// ─── Current trip status badge ────────────────────────────────────────────────

const CURRENT_BADGE: Record<TripStatus, { label: string; bg: string; text: string; dot: string }> = {
  UNASSIGNED:      { label: "Unassigned",   bg: "bg-gray-500/15",    text: "text-gray-300",   dot: "bg-gray-400" },
  QUOTE:           { label: "Quote",        bg: "bg-slate-500/10",   text: "text-slate-300",  dot: "bg-slate-400" },
  CONFIRMED:       { label: "Assigned",     bg: "bg-blue-500/15",    text: "text-blue-300",   dot: "bg-blue-400" },
  DISPATCHED:      { label: "Dispatched",   bg: "bg-violet-500/15",  text: "text-violet-300", dot: "bg-violet-400" },
  DRIVER_EN_ROUTE: { label: "On the Way",   bg: "bg-amber-500/15",   text: "text-amber-300",  dot: "bg-amber-400" },
  DRIVER_ARRIVED:  { label: "On Location",  bg: "bg-yellow-500/15",  text: "text-yellow-300", dot: "bg-yellow-400" },
  IN_PROGRESS:     { label: "POB",          bg: "bg-emerald-500/15", text: "text-emerald-300",dot: "bg-emerald-400" },
  COMPLETED:       { label: "Completed",    bg: "bg-gray-500/15",    text: "text-gray-300",   dot: "bg-gray-400" },
  CANCELLED:       { label: "Cancelled",    bg: "bg-red-500/15",     text: "text-red-300",    dot: "bg-red-400" },
  NO_SHOW:         { label: "No Show",      bg: "bg-red-500/15",     text: "text-red-300",    dot: "bg-red-400" },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QuickActionPopupProps {
  trip: Trip
  position: { x: number; y: number }
  onClose: () => void
}

export function QuickActionPopup({ trip, position, onClose }: QuickActionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const { data: drivers = [] } = useDrivers()
  const { data: vehicles = [] } = useVehicles()
  const updateTrip = useUpdateTrip()
  const [appliedStatus, setAppliedStatus] = useState<TripStatus | null>(null)
  const [driverId, setDriverId] = useState(trip.driverId ?? "")
  const [vehicleId, setVehicleId] = useState(trip.vehicleId ?? "")
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: position.y + 12, left: position.x - 150 })

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  // Position within viewport
  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = position.y + 12
    let left = position.x - rect.width / 2
    if (left + rect.width + 12 > vw) left = vw - rect.width - 12
    if (top + rect.height + 12 > vh) top = position.y - rect.height - 8
    if (top < 8) top = 8
    if (left < 8) left = 8
    setCoords({ top, left })
  }, [position, mounted])

  // Outside click & Escape
  useEffect(() => {
    function handleMouse(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleMouse)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleMouse)
      document.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  function handleStatusClick(status: TripStatus) {
    if (status === trip.status) return
    setAppliedStatus(status)
    updateTrip.mutate(
      { id: trip.id, status },
      { onSuccess: () => setTimeout(onClose, 650) }
    )
  }

  function handleDriverChange(newId: string) {
    setDriverId(newId)
    updateTrip.mutate({ id: trip.id, driverId: newId || undefined })
  }

  function handleVehicleChange(newId: string) {
    setVehicleId(newId)
    updateTrip.mutate({ id: trip.id, vehicleId: newId || undefined })
  }

  const passengerName = trip.passengerName || trip.customer?.name || "—"
  const badge = CURRENT_BADGE[trip.status]

  if (!mounted) return null

  return createPortal(
    <div
      ref={popupRef}
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1) translateY(0)" : "scale(0.96) translateY(-6px)",
        transition: "opacity 0.16s cubic-bezier(0.16,1,0.3,1), transform 0.16s cubic-bezier(0.16,1,0.3,1)",
        transformOrigin: "top center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)",
      }}
      className="w-72 rounded-2xl overflow-hidden"
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div
        className="relative px-4 pt-4 pb-3.5"
        style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(255,255,255,0.08)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          <X className="w-3 h-3 text-white/60" />
        </button>

        {/* Conf # */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Conf#</span>
          <span className="text-[9px] font-mono font-bold text-blue-400 tracking-widest">{trip.tripNumber}</span>
        </div>

        {/* Passenger */}
        <p className="text-[15px] font-semibold text-white leading-tight pr-6">{passengerName}</p>

        {/* Time + current status badge */}
        <div className="flex items-center gap-2 mt-2">
          {trip.pickupTime && (
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              {formatTime(trip.pickupTime)}
            </span>
          )}
          <span className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
            badge.bg, badge.text
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", badge.dot)} />
            {badge.label}
          </span>
        </div>
      </div>

      {/* ── Status List ───────────────────────────────────────── */}
      <div className="py-1 bg-white">
        {ALL_TRIP_STATUSES.map((s) => {
          const isActive = trip.status === s
          const isLoading = updateTrip.isPending && appliedStatus === s
          const isDone = appliedStatus === s && !updateTrip.isPending
          const color = STATUS_COLOR[s]
          const dotCls = DOT[color] ?? "bg-gray-400"
          const activeBg = ACTIVE_BG[color] ?? "bg-gray-100"
          const activeTxt = ACTIVE_TEXT[color] ?? "text-gray-700"
          const activeChk = ACTIVE_CHECK[color] ?? "text-gray-500"
          const leftBar = LEFT_BAR[color] ?? "bg-gray-400"

          return (
            <button
              key={s}
              onClick={() => handleStatusClick(s)}
              disabled={updateTrip.isPending}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors relative",
                isActive ? cn(activeBg, "cursor-default") : "hover:bg-gray-50 cursor-pointer active:bg-gray-100",
                "disabled:opacity-60"
              )}
            >
              {isActive && (
                <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", leftBar)} />
              )}
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? dotCls : "bg-gray-200")} />
              <span className={cn(
                "text-[13px] flex-1",
                isActive ? cn("font-semibold", activeTxt) : "font-medium text-gray-700"
              )}>
                {getTripStatusLabel(s)}
              </span>
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : isActive ? (
                  <Check className={cn("w-3.5 h-3.5", activeChk)} />
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Driver / Vehicle ──────────────────────────────────── */}
      <div className="bg-gray-50 border-t border-gray-100 px-3.5 py-3 space-y-2">
        {/* Driver */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14 flex-shrink-0">Driver</span>
          <div className="relative flex-1">
            <select
              value={driverId}
              onChange={(e) => handleDriverChange(e.target.value)}
              className="w-full h-8 pl-3 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none font-medium"
            >
              <option value="">Unassigned</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider w-14 flex-shrink-0">Vehicle</span>
          <div className="relative flex-1">
            <select
              value={vehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="w-full h-8 pl-3 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none font-medium"
            >
              <option value="">None</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
