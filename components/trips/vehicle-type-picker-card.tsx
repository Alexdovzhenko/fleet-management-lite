"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Layers, X } from "lucide-react"

const TYPE_DESCRIPTION: Record<string, string> = {
  SEDAN:        "Standard sedan",
  SUV:          "Sport utility vehicle",
  STRETCH_LIMO: "Stretch limousine",
  SPRINTER:     "Mercedes Sprinter van",
  PARTY_BUS:    "Party bus",
  COACH:        "Motor coach",
  OTHER:        "Custom vehicle type",
}

interface VehicleTypeOption {
  value: string
  label: string
}

export function VehicleTypePickerCard({
  vehicleTypes,
  value,
  onChange,
  isLoading,
}: {
  vehicleTypes: VehicleTypeOption[]
  value: string
  onChange: (value: string) => void
  isLoading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = vehicleTypes.find((t) => t.value === value) ?? null

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        dropRef.current && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 260
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
  }

  return (
    <div ref={ref} className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>Type</p>

      {/* Trigger */}
      {selected ? (
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{selected.label}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--lc-text-label)" }}>
              {TYPE_DESCRIPTION[selected.value] ?? "Vehicle type"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="transition-colors flex-shrink-0"
            style={{ color: "var(--lc-text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--lc-text-secondary)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--lc-text-muted)")}
            aria-label="Clear vehicle type"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          className="w-full flex items-center gap-2.5 px-3 rounded-xl text-sm transition-all"
          style={{ border: "1px dashed var(--lc-border)", color: "var(--lc-text-label)", background: "transparent", paddingTop: "10px", paddingBottom: "10px", height: "auto" }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "rgba(201,168,124,0.35)"
            el.style.color = "rgba(201,168,124,0.80)"
            el.style.background = "rgba(201,168,124,0.04)"
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = "var(--lc-border)"
            el.style.color = "var(--lc-text-label)"
            el.style.background = "transparent"
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
          >
            <Layers className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
          </div>
          <span className="flex-1 text-left">Select vehicle type…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform mr-0.5 ${open ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Portal dropdown */}
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
            Vehicle Types
          </div>
          <div className="max-h-52 overflow-y-auto">
            {vehicleTypes.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: "var(--lc-text-muted)" }}>No types available</div>
            ) : (
              vehicleTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(t.value); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--lc-bg-glass)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.15)" }}
                  >
                    <Layers className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>{t.label}</div>
                    <div className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>
                      {TYPE_DESCRIPTION[t.value] ?? "Vehicle type"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
