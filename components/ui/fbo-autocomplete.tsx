"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Plane, ChevronDown } from "lucide-react"
import { FBO_DATA, type FBOEntry } from "@/lib/fbo-data"

interface FBOAutocompleteProps {
  value: string
  onChange: (name: string) => void
  onSelect?: (fbo: FBOEntry) => void
  onClear?: () => void
  className?: string
  placeholder?: string
  hasError?: boolean
}

export function FBOAutocomplete({
  value,
  onChange,
  onSelect,
  onClear,
  className,
  placeholder = "Signature Aviation, Atlantic, Million Air…",
  hasError = false,
}: FBOAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const [activeIdx, setActiveIdx] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  // Debug: verify component mounted and data loaded
  useEffect(() => {
    console.log(`[FBOAutocomplete] Mounted. FBO_DATA length: ${FBO_DATA.length}`)
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

  // 4-tier priority search: ICAO exact → FBO name prefix → Airport name prefix → City prefix → contains
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []

    // Tier 1: ICAO/IATA exact match
    const icaoMatches = FBO_DATA.filter(fbo =>
      fbo.icao.toLowerCase() === q || (fbo.iata && fbo.iata.toLowerCase() === q)
    )

    const seenKeys = new Set(icaoMatches.map(f => `${f.icao}-${f.name}`))

    // Tier 2: FBO name prefix
    const nameMatches = FBO_DATA.filter(fbo =>
      fbo.name.toLowerCase().startsWith(q) && !seenKeys.has(`${fbo.icao}-${fbo.name}`)
    )
    icaoMatches.forEach(f => seenKeys.add(`${f.icao}-${f.name}`))

    // Tier 3: Airport name prefix
    const airportMatches = FBO_DATA.filter(fbo =>
      fbo.airport.toLowerCase().startsWith(q) && !seenKeys.has(`${fbo.icao}-${fbo.name}`)
    )
    nameMatches.forEach(f => seenKeys.add(`${f.icao}-${f.name}`))

    // Tier 4: City prefix
    const cityMatches = FBO_DATA.filter(fbo =>
      fbo.city.toLowerCase().startsWith(q) && !seenKeys.has(`${fbo.icao}-${fbo.name}`)
    )
    airportMatches.forEach(f => seenKeys.add(`${f.icao}-${f.name}`))

    // Tier 5: Any contains match
    const includesMatches = FBO_DATA.filter(fbo =>
      (fbo.name.toLowerCase().includes(q) ||
        fbo.airport.toLowerCase().includes(q) ||
        fbo.city.toLowerCase().includes(q) ||
        fbo.icao.toLowerCase().includes(q) ||
        (fbo.iata && fbo.iata.toLowerCase().includes(q))) &&
      !seenKeys.has(`${fbo.icao}-${fbo.name}`)
    )
    cityMatches.forEach(f => seenKeys.add(`${f.icao}-${f.name}`))

    const final = [...icaoMatches, ...nameMatches, ...airportMatches, ...cityMatches, ...includesMatches].slice(0, 12)
    console.log(`[FBOAutocomplete] query="${query}" q="${q}" results=${final.length}`)
    return final
  }, [query])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties =
        spaceBelow < 300
          ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
          : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
    setActiveIdx(-1)
  }

  function handleSelect(fbo: FBOEntry) {
    console.log(`[FBOAutocomplete] Selected: ${fbo.name} at ${fbo.icao}`)
    setQuery(fbo.name)
    onChange(fbo.name)
    if (onSelect) {
      onSelect(fbo)
    }
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    console.log(`[FBOAutocomplete] handleInputChange: "${v}"`)
    setQuery(v)
    onChange(v)
    if (v.length > 0) {
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

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && results.length > 0 && openDropdown()}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-9 text-sm border rounded-md pl-2.5 pr-6 focus:outline-none focus:ring-1 bg-white text-gray-800 ${
            hasError
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-200 focus:ring-blue-400"
          }`}
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {open && results.length > 0 && createPortal(
        <div
          ref={dropRef}
          style={dropStyle}
          className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="max-h-[280px] overflow-y-auto">
            {results.map((fbo, idx) => (
              <button
                key={`${fbo.icao}-${fbo.name}`}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(fbo)}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`w-full text-left px-3 py-2.5 transition-colors flex items-start gap-2.5 border-b border-gray-50 last:border-b-0 ${
                  idx === activeIdx ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <Plane className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${idx === activeIdx ? "text-blue-700" : "text-gray-900"}`}>
                    {fbo.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {fbo.airport} · {fbo.city}, {fbo.state}
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {fbo.icao}
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
