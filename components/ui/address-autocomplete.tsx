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
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"
          if (value.trim()) setOpen(true)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "rgba(248,113,113,0.60)" : "rgba(255,255,255,0.12)"
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className={cn("flex w-full rounded-xl px-3 py-1 text-sm outline-none transition-colors aa-input", inputClassName)}
        style={{
          height: inputClassName?.includes("h-10") ? "40px" : "36px",
          background: "rgba(255,255,255,0.05)",
          border: error ? "1px solid rgba(248,113,113,0.60)" : "1px solid rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.88)",
        }}
      />
      <style>{`.aa-input::placeholder { color: rgba(200,212,228,0.38); }`}</style>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-[200] rounded-2xl overflow-hidden"
          style={{
            background: "#0d1526",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,124,0.08)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-1.5 px-3.5 pt-2.5 pb-1.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "#c9a87c" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "#c9a87c" }}
            >
              Saved Addresses
            </span>
          </div>

          <ul ref={listRef} className="py-1.5 max-h-56 overflow-y-auto">
            {results.map((addr, idx) => {
              const isActive = idx === activeIdx
              return (
                <li key={addr.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(addr) }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors"
                    style={{ background: isActive ? "rgba(201,168,124,0.08)" : "transparent" }}
                  >
                    {/* Icon chip */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={addr.name
                        ? { background: "rgba(139,92,246,0.14)", border: "1px solid rgba(139,92,246,0.22)" }
                        : { background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }
                      }
                    >
                      {addr.name
                        ? <Building2 className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.85)" }} />
                        : <MapPin className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
                      }
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      {addr.name && (
                        <div
                          className="text-[11px] font-semibold truncate mb-0.5"
                          style={{ color: "rgba(255,255,255,0.90)" }}
                        >
                          {addr.name}
                        </div>
                      )}
                      <div
                        className="truncate"
                        style={addr.name
                          ? { fontSize: "11px", color: "rgba(200,212,228,0.60)" }
                          : { fontSize: "12.5px", fontWeight: 500, color: "rgba(255,255,255,0.82)" }
                        }
                      >
                        {addr.address1}
                        {addr.address2 && (
                          <span style={{ color: "rgba(200,212,228,0.45)" }}>, {addr.address2}</span>
                        )}
                      </div>
                      {formatSecondLine(addr) && (
                        <div className="text-[11px] truncate" style={{ color: "rgba(200,212,228,0.45)" }}>
                          {formatSecondLine(addr)}
                        </div>
                      )}
                    </div>

                    {/* Use count badge */}
                    {addr.useCount > 1 && (
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 tabular-nums"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(200,212,228,0.50)",
                        }}
                      >
                        {addr.useCount}×
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
