"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Car, ChevronDown, X } from "lucide-react"
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
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>Vehicle</p>
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : selected ? (
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}
          >
            <Car className="w-4 h-4" style={{ color: "#c9a87c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{selected.name}</div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--lc-text-label)" }}>
              <span>{VEHICLE_TYPE_LABEL[selected.type] ?? "Vehicle"}</span>
              <span style={{ color: "var(--lc-text-muted)" }}>·</span>
              <span>{selected.capacity} pax</span>
              {selected.color && (
                <>
                  <span style={{ color: "var(--lc-text-muted)" }}>·</span>
                  <span>{selected.color}</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="transition-colors flex-shrink-0"
            style={{ color: "var(--lc-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--lc-text-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--lc-text-muted)")}
            aria-label="Remove vehicle assignment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ border: "1px dashed var(--lc-border)", color: "var(--lc-text-label)", background: "transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.35)"
            ;(e.currentTarget as HTMLElement).style.color = "rgba(201,168,124,0.80)"
            ;(e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.04)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--lc-border)"
            ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)"
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
          >
            <Car className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
          </div>
          <span className="flex-1 text-left">Select vehicle…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && !selected && createPortal(
        <div
          ref={dropRef}
          style={{ ...dropStyle, background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.60)" }}
          className="rounded-xl overflow-hidden"
        >
          <div
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b"
            style={{ color: "var(--lc-text-label)", background: "var(--lc-bg-card)", borderColor: "var(--lc-bg-glass-mid)" }}
          >
            Available Vehicles
          </div>
          <div className="max-h-44 overflow-y-auto">
            {vehicles.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: "var(--lc-text-muted)" }}>No active vehicles</div>
            ) : (
              vehicles.map((v) => {
                const tooSmall = v.capacity < passengerCount
                return (
                  <button
                    key={v.id}
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { onChange(v.id); setOpen(false) }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors ${tooSmall ? "opacity-50" : ""}`}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--lc-bg-glass)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.15)" }}
                    >
                      <Car className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium" style={{ color: "var(--lc-text-primary)" }}>{v.name}</div>
                      <div className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>
                        {VEHICLE_TYPE_LABEL[v.type] ?? "Vehicle"} · {v.capacity} pax
                      </div>
                    </div>
                    {tooSmall && (
                      <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "rgba(251,191,36,0.80)" }}>Too small</span>
                    )}
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
