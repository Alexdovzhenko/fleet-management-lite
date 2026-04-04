"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Car, ChevronDown, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import type { Vehicle } from "@/types"

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter",
  PARTY_BUS: "Party Bus",
  COACH: "Coach",
  OTHER: "Vehicle",
}

export function VehiclePickerCard({
  vehicles,
  value,
  passengerCount,
  onChange,
  isLoading,
}: {
  vehicles: Vehicle[]
  value: string
  passengerCount: number
  onChange: (id: string) => void
  isLoading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = vehicles.find((v) => v.id === value) ?? null

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties =
        spaceBelow < 240
          ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
          : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
  }

  return (
    <div ref={ref} className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-900">Vehicle</Label>
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : selected ? (
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{selected.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span>{VEHICLE_TYPE_LABEL[selected.type] ?? "Vehicle"}</span>
              <span className="text-gray-300">·</span>
              <span>{selected.capacity} pax</span>
              {selected.color && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{selected.color}</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
            aria-label="Remove vehicle assignment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50/50 transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Car className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <span className="flex-1 text-left">Select vehicle…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
            Available Vehicles
          </div>
          <div className="max-h-44 overflow-y-auto">
            {vehicles.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No active vehicles</div>
            ) : (
              vehicles.map((v) => {
                const tooSmall = v.capacity < passengerCount
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      onChange(v.id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors ${tooSmall ? "opacity-60" : ""}`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Car className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-gray-800">{v.name}</div>
                      <div className="text-[11px] text-gray-400">{VEHICLE_TYPE_LABEL[v.type] ?? "Vehicle"} · {v.capacity} pax</div>
                    </div>
                    {tooSmall && <span className="text-[10px] font-semibold text-amber-500 flex-shrink-0">Too small</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
