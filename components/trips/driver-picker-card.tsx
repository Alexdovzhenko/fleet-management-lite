"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, UserCheck, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
      {label && <Label className="text-xs font-medium text-gray-900">{label}</Label>}
      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-xl" />
      ) : selected ? (
        <div className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0 overflow-hidden">
            {selected.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.avatarUrl} alt={selected.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(selected.name)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{selected.name}</div>
            {selected.phone && <div className="text-[11px] text-gray-500 truncate">{selected.phone}</div>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5">
              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
              Active
            </span>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-gray-300 hover:text-gray-500 transition-colors"
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
          className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50 transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <span className="flex-1 text-left">Assign driver…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
            Active Drivers
          </div>
          <div className="max-h-44 overflow-y-auto">
            {drivers.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">No active drivers</div>
            ) : (
              drivers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onChange(d.id)
                    setOpen(false)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-600 flex-shrink-0 overflow-hidden">
                    {d.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(d.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-800">{d.name}</div>
                    {d.phone && <div className="text-[11px] text-gray-400">{d.phone}</div>}
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
