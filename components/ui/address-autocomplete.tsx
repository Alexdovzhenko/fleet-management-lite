"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { MapPin, Clock, Building2 } from "lucide-react"
import { useAddressSearch, type CompanyAddress } from "@/lib/hooks/use-addresses"
import { cn } from "@/lib/utils"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: CompanyAddress) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  error?: boolean
  autoFocus?: boolean
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  className,
  inputClassName,
  placeholder,
  error,
  autoFocus,
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: results = [] } = useAddressSearch(value)
  const showDropdown = open && results.length > 0

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setActiveIdx(-1)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [])

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(-1)
  }, [results])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
    setOpen(true)
    setActiveIdx(-1)
  }

  function handleSelect(addr: CompanyAddress) {
    onSelect(addr)
    setOpen(false)
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault()
      handleSelect(results[activeIdx])
    } else if (e.key === "Escape") {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  // Scroll active item into view
  const scrollActive = useCallback((idx: number) => {
    const el = listRef.current?.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ block: "nearest" })
  }, [])

  useEffect(() => {
    if (activeIdx >= 0) scrollActive(activeIdx)
  }, [activeIdx, scrollActive])

  function formatSecondLine(addr: CompanyAddress) {
    return [addr.city, addr.state, addr.zip].filter(Boolean).join(", ")
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim() && setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-400",
          inputClassName
        )}
      />

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-[200] rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" }}
        >
          {/* Header hint */}
          <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
            <Clock className="w-3 h-3 text-gray-300" />
            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">Saved addresses</span>
          </div>

          <ul ref={listRef} className="py-1 max-h-56 overflow-y-auto">
            {results.map((addr, idx) => (
              <li key={addr.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(addr) }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={cn(
                    "w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors",
                    idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                    addr.name ? "bg-violet-50" : "bg-blue-50"
                  )}>
                    {addr.name
                      ? <Building2 className="w-3.5 h-3.5 text-violet-500" />
                      : <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    {addr.name && (
                      <div className="text-[11px] font-semibold text-gray-700 truncate">{addr.name}</div>
                    )}
                    <div className={cn(
                      "truncate",
                      addr.name ? "text-[11px] text-gray-500" : "text-[12.5px] font-medium text-gray-800"
                    )}>
                      {addr.address1}
                      {addr.address2 && <span className="text-gray-400">, {addr.address2}</span>}
                    </div>
                    {formatSecondLine(addr) && (
                      <div className="text-[11px] text-gray-400 truncate">{formatSecondLine(addr)}</div>
                    )}
                  </div>
                  {addr.useCount > 1 && (
                    <span className="text-[10px] text-gray-300 flex-shrink-0 mt-0.5">{addr.useCount}×</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
