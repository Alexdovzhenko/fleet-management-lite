"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, UserCheck, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPhone } from "@/lib/utils"
import type { Driver } from "@/types"

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function DriverPickerCard({
  drivers,
  value,
  onChange,
  label = "Driver",
  isLoading,
}: {
  drivers: Driver[]
  value: string
  onChange: (id: string) => void
  label?: string | null
  isLoading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = drivers.find((d) => d.id === value) ?? null

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
      const style: React.CSSProperties = spaceBelow < 240
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
  }

  return (
    <div ref={ref} className={label ? "space-y-1.5" : ""}>
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>{label}</p>
      )}
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : selected ? (
        <div
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}
          >
            {selected.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.avatarUrl} alt={selected.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(selected.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{selected.name}</div>
            {selected.phone && (
              <div className="text-[11px] truncate" style={{ color: "rgba(200,212,228,0.50)" }}>{formatPhone(selected.phone)}</div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5"
              style={{ background: "rgba(52,211,153,0.12)", color: "rgba(52,211,153,0.85)", border: "1px solid rgba(52,211,153,0.20)" }}
            >
              <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />
              Active
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="transition-colors"
              style={{ color: "rgba(200,212,228,0.35)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(200,212,228,0.70)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(200,212,228,0.35)")}
              aria-label="Remove driver assignment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ border: "1px dashed rgba(255,255,255,0.12)", color: "rgba(200,212,228,0.50)", background: "transparent" }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.35)"
            ;(e.currentTarget as HTMLElement).style.color = "rgba(201,168,124,0.80)"
            ;(e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.04)"
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"
            ;(e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.50)"
            ;(e.currentTarget as HTMLElement).style.background = "transparent"
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
          >
            <UserCheck className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
          </div>
          <span className="flex-1 text-left">Assign driver…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && !selected && createPortal(
        <div
          ref={dropRef}
          style={{ ...dropStyle, background: "#0d1526", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 8px 32px rgba(0,0,0,0.60)" }}
          className="rounded-xl overflow-hidden"
        >
          <div
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest border-b"
            style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            Active Drivers
          </div>
          <div className="max-h-44 overflow-y-auto">
            {drivers.length === 0 ? (
              <div className="px-3 py-3 text-xs text-center" style={{ color: "rgba(200,212,228,0.40)" }}>No active drivers</div>
            ) : (
              drivers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { onChange(d.id); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
                  >
                    {d.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(d.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{d.name}</div>
                    {d.phone && <div className="text-[11px]" style={{ color: "rgba(200,212,228,0.45)" }}>{formatPhone(d.phone)}</div>}
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
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
