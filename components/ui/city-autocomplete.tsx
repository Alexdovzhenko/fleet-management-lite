"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { MapPin, ChevronDown } from "lucide-react"
import { US_CITIES } from "@/lib/us-cities"

interface CityAutocompleteProps {
  value: string
  onChange: (city: string) => void
  onStateChange?: (state: string) => void
  className?: string
  placeholder?: string
}

// State/province name lookup
const STATE_NAMES: Record<string, string> = {
  // US States
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "Dist. of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii",
  ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  // Canadian Provinces
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba",
  NB: "New Brunswick", NL: "Newfoundland and Labrador", NS: "Nova Scotia",
  NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario",
  PE: "Prince Edward Island", QC: "Quebec", SK: "Saskatchewan",
  YT: "Yukon",
}

export function CityAutocomplete({
  value,
  onChange,
  onStateChange,
  className,
  placeholder = "City",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const [activeIdx, setActiveIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Debug: verify component mounted and data loaded
  useEffect(() => {
    console.log(`[CityAutocomplete] Mounted. US_CITIES length: ${US_CITIES.length}`)
  }, [])

  // Sync query from parent value prop
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Outside-click handler
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

  // Smart search: prefix matches first, then includes matches
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []

    const prefixMatches = US_CITIES.filter(c => c.city.toLowerCase().startsWith(q))
    const prefixCities = new Set(prefixMatches.map(c => `${c.city}-${c.state}`))

    const includesMatches = US_CITIES.filter(c =>
      c.city.toLowerCase().includes(q) && !prefixCities.has(`${c.city}-${c.state}`)
    )

    const final = [...prefixMatches, ...includesMatches].slice(0, 10)
    console.log(`[CityAutocomplete] query="${query}" q="${q}" results=${final.length}`, final.slice(0, 3))
    return final
  }, [query])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties =
        spaceBelow < 260
          ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
          : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
    setActiveIdx(-1)
  }

  function handleSelect(entry: typeof US_CITIES[0]) {
    onChange(entry.city)
    setQuery(entry.city)
    if (onStateChange) {
      onStateChange(entry.state)
    }
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    console.log(`[CityAutocomplete] handleInputChange: "${v}"`)
    setQuery(v)
    onChange(v)
    if (v.length > 0) {
      // Use setTimeout to ensure query state is updated before opening dropdown
      setTimeout(() => openDropdown(), 0)
    } else {
      setOpen(false)
    }
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && query.trim()) openDropdown()
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIdx(idx => (idx < results.length - 1 ? idx + 1 : idx))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIdx(idx => (idx > 0 ? idx - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIdx >= 0) {
          handleSelect(results[activeIdx])
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  console.log(`[CityAutocomplete] Render: open=${open} results.length=${results.length}`)

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { console.log(`[CityAutocomplete] onFocus: query="${query}" results.length=${results.length}`); query.length > 0 && results.length > 0 && openDropdown() }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 text-sm rounded-md pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-[#c9a87c]" style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)", color: "var(--lc-text-primary)" }}
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {open && results.length > 0 && (() => { console.log(`[CityAutocomplete] Rendering portal with ${results.length} results`); return true; })() && createPortal(
        <div
          ref={dropRef}
          style={{ ...dropStyle, background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
          className="rounded-xl overflow-hidden"
        >
          <div className="max-h-[220px] overflow-y-auto">
            {results.map((entry, idx) => (
              <button
                key={`${entry.city}-${entry.state}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(entry)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-center gap-2.5 ${
                  idx === activeIdx ? "bg-white/8" : "hover:bg-white/5"
                }`}
              >
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "rgba(201,168,124,0.60)" }} />
                <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--lc-text-primary)" }}>{entry.city}</span>
                <span className="text-xs flex-shrink-0 whitespace-nowrap" style={{ color: "var(--lc-text-label)" }}>
                  {STATE_NAMES[entry.state] ?? entry.state}
                </span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
