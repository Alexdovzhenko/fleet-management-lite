"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2 } from "lucide-react"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import { useStatusActionsStore } from "@/lib/stores/status-actions-store"
import type { Trip, TripStatus } from "@/types"
import { cn } from "@/lib/utils"

const COLOR_BTN: Record<string, string> = {
  blue:    "bg-blue-500 hover:bg-blue-600 text-white",
  amber:   "bg-amber-500 hover:bg-amber-600 text-white",
  yellow:  "bg-yellow-400 hover:bg-yellow-500 text-gray-900",
  emerald: "bg-emerald-500 hover:bg-emerald-600 text-white",
  gray:    "bg-gray-500 hover:bg-gray-600 text-white",
  violet:  "bg-violet-500 hover:bg-violet-600 text-white",
  red:     "bg-red-500 hover:bg-red-600 text-white",
  teal:    "bg-teal-500 hover:bg-teal-600 text-white",
  pink:    "bg-pink-500 hover:bg-pink-600 text-white",
  indigo:  "bg-indigo-500 hover:bg-indigo-600 text-white",
}

const COLOR_RING: Record<string, string> = {
  blue:    "ring-2 ring-blue-300 ring-offset-1",
  amber:   "ring-2 ring-amber-300 ring-offset-1",
  yellow:  "ring-2 ring-yellow-300 ring-offset-1",
  emerald: "ring-2 ring-emerald-300 ring-offset-1",
  gray:    "ring-2 ring-gray-300 ring-offset-1",
  violet:  "ring-2 ring-violet-300 ring-offset-1",
  red:     "ring-2 ring-red-300 ring-offset-1",
  teal:    "ring-2 ring-teal-300 ring-offset-1",
  pink:    "ring-2 ring-pink-300 ring-offset-1",
  indigo:  "ring-2 ring-indigo-300 ring-offset-1",
}

interface QuickActionPopupProps {
  trip: Trip
  position: { x: number; y: number }
  onClose: () => void
}

export function QuickActionPopup({ trip, position, onClose }: QuickActionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const { actions } = useStatusActionsStore()
  const enabledActions = actions.filter((a) => a.isEnabled)
  const { data: drivers = [] } = useDrivers()
  const { data: vehicles = [] } = useVehicles()
  const updateTrip = useUpdateTrip()
  const [appliedActionId, setAppliedActionId] = useState<string | null>(null)
  const [driverId, setDriverId] = useState(trip.driverId ?? "")
  const [vehicleId, setVehicleId] = useState(trip.vehicleId ?? "")
  const [mounted, setMounted] = useState(false)
  const [coords, setCoords] = useState({ top: position.y, left: position.x })

  useEffect(() => { setMounted(true) }, [])

  // Adjust to stay within viewport after mount
  useLayoutEffect(() => {
    const el = popupRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    let top = position.y + 8
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

  function handleStatusClick(dbStatus: TripStatus, actionId: string) {
    setAppliedActionId(actionId)
    updateTrip.mutate(
      { id: trip.id, status: dbStatus },
      { onSuccess: () => setTimeout(onClose, 700) }
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

  if (!mounted) return null

  return createPortal(
    <div
      ref={popupRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
      className="w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-blue-600 font-bold tracking-wider">{trip.tripNumber}</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{passengerName}</p>
        </div>
        <button onClick={onClose} className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status Buttons */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Set Status</p>
        <div className="flex flex-wrap gap-1.5">
          {enabledActions.map((action) => {
            const isActive = trip.status === action.dbStatus
            const isLoading = updateTrip.isPending && appliedActionId === action.id
            const isDone = appliedActionId === action.id && !updateTrip.isPending
            const btnStyle = COLOR_BTN[action.color] ?? COLOR_BTN.gray
            const ringStyle = COLOR_RING[action.color] ?? ""
            return (
              <button
                key={action.id}
                onClick={() => handleStatusClick(action.dbStatus, action.id)}
                disabled={updateTrip.isPending}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60",
                  btnStyle,
                  isActive && ringStyle
                )}
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" />
                  : isDone ? <Check className="w-3 h-3" />
                  : null}
                {action.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Driver / Vehicle */}
      <div className="px-3 pb-3 pt-3 border-t border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 w-14 flex-shrink-0">Driver</span>
          <select
            value={driverId}
            onChange={(e) => handleDriverChange(e.target.value)}
            className="flex-1 h-8 text-xs border border-gray-200 rounded-lg px-2 bg-white text-gray-900 outline-none focus:border-blue-400 transition-colors"
          >
            <option value="">Unassigned</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 w-14 flex-shrink-0">Vehicle</span>
          <select
            value={vehicleId}
            onChange={(e) => handleVehicleChange(e.target.value)}
            className="flex-1 h-8 text-xs border border-gray-200 rounded-lg px-2 bg-white text-gray-900 outline-none focus:border-blue-400 transition-colors"
          >
            <option value="">None</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>,
    document.body
  )
}
