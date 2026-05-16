"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2, ChevronDown, Clock } from "lucide-react"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useVehicleTypes } from "@/lib/hooks/use-vehicle-types"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import { useStatusConfig } from "@/lib/hooks/use-status-config"
import type { Trip, TripStatus } from "@/types"
import { cn, formatTime } from "@/lib/utils"

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
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const updateTrip = useUpdateTrip()
  const { getEnabledStatuses, getStatusDarkBadge, getStatusActiveStyle, getStatusDotClass, getStatusLabel } = useStatusConfig()
  const [appliedStatus, setAppliedStatus] = useState<TripStatus | null>(null)
  const [driverId, setDriverId] = useState(trip.driverId ?? "")
  const [vehicleTypeValue, setVehicleTypeValue] = useState(trip.vehicleType ?? "")
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

  function handleVehicleTypeChange(newType: string) {
    setVehicleTypeValue(newType)
    updateTrip.mutate({ id: trip.id, vehicleType: (newType || undefined) as never })
  }

  function handleVehicleChange(newId: string) {
    setVehicleId(newId)
    updateTrip.mutate({ id: trip.id, vehicleId: newId || undefined })
  }

  const passengerName = trip.passengerName || trip.customer?.name || "—"

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
        maxWidth: "calc(100vw - 24px)",
        width: "min(288px, calc(100vw - 24px))",
      }}
      className="rounded-2xl overflow-hidden"
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
          style={{ background: "var(--lc-bg-glass-hover)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--lc-border-medium)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--lc-bg-glass-hover)")}
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
          {(() => {
            const darkBadge = getStatusDarkBadge(trip.status)
            return (
              <span className={cn(
                "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                darkBadge.bg, darkBadge.text
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", darkBadge.dot)} />
                {getStatusLabel(trip.status)}
              </span>
            )
          })()}
        </div>
      </div>

      {/* ── Status List ───────────────────────────────────────── */}
      <div className="py-1 bg-white">
        {getEnabledStatuses().map((s) => {
          const isActive = trip.status === s
          const isLoading = updateTrip.isPending && appliedStatus === s
          const isDone = appliedStatus === s && !updateTrip.isPending
          const activeStyle = getStatusActiveStyle(s)

          return (
            <button
              key={s}
              onClick={() => handleStatusClick(s)}
              disabled={updateTrip.isPending}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors relative",
                isActive ? cn(activeStyle.bg, "cursor-default") : "hover:bg-gray-50 cursor-pointer active:bg-gray-100",
                "disabled:opacity-60"
              )}
            >
              {isActive && (
                <div className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", activeStyle.leftBar)} />
              )}
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", isActive ? getStatusDotClass(s) : "bg-gray-200")} />
              <span className={cn(
                "text-[13px] flex-1",
                isActive ? cn("font-semibold", activeStyle.text) : "font-medium text-gray-700"
              )}>
                {getStatusLabel(s)}
              </span>
              <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                ) : isDone ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : isActive ? (
                  <Check className={cn("w-3.5 h-3.5", activeStyle.check)} />
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Driver / Type / Vehicle ──────────────────── */}
      <div className="bg-gray-50 border-t border-gray-100 px-3.5 py-3 space-y-2.5">
        {/* Driver */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right w-16 flex-shrink-0">Driver</span>
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

        {/* Type */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right w-16 flex-shrink-0">Type</span>
          <div className="relative flex-1">
            <select
              value={vehicleTypeValue}
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
              className="w-full h-8 pl-3 pr-7 text-xs border border-gray-200 rounded-lg bg-white text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all appearance-none font-medium"
            >
              <option value="">Select type...</option>
              {vehicleTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Vehicle */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right w-16 flex-shrink-0">Vehicle</span>
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
