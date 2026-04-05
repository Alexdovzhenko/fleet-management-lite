"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { createPortal } from "react-dom"
import { Plane, ChevronDown } from "lucide-react"
import { FBO_DATA, type FBOEntry } from "@/lib/fbo-data"

// Scoring function for relevance-based search
function scoreFBO(fbo: FBOEntry, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const nameLC = fbo.name.toLowerCase()
  const airportLC = fbo.airport.toLowerCase()
  const cityLC = fbo.city.toLowerCase()
  const icaoLC = fbo.icao.toLowerCase()
  const iataLC = fbo.iata?.toLowerCase() ?? ""
  const stateLC = fbo.state.toLowerCase()
  const aliasesLC = (fbo.aliases ?? []).map(a => a.toLowerCase())

  let score = 0

  // Full-phrase scoring
  if (icaoLC === q || iataLC === q) score += 1000
  if (nameLC === q) score += 900
  else if (nameLC.startsWith(q)) score += 600
  else if (nameLC.includes(q)) score += 300

  if (airportLC === q) score += 700
  else if (airportLC.startsWith(q)) score += 500
  else if (airportLC.includes(q)) score += 200

  if (cityLC === q) score += 400
  else if (cityLC.startsWith(q)) score += 300
  else if (cityLC.includes(q)) score += 100

  if (stateLC === q) score += 150

  for (const alias of aliasesLC) {
    if (alias === q) {
      score += 800
      break
    }
    if (alias.startsWith(q)) {
      score += 500
      break
    }
    if (alias.includes(q)) {
      score += 250
      break
    }
  }

  // Multi-word: per-word scoring (additive), takes max vs full-phrase score
  const words = q.split(/\s+/).filter(w => w.length > 0)
  if (words.length > 1) {
    let wordScore = 0
    let matched = 0
    for (const word of words) {
      let best = 0
      if (icaoLC === word || iataLC === word) best = Math.max(best, 1000)
      if (nameLC === word) best = Math.max(best, 900)
      else if (nameLC.startsWith(word)) best = Math.max(best, 600)
      else if (nameLC.includes(word)) best = Math.max(best, 300)

      if (airportLC === word) best = Math.max(best, 700)
      else if (airportLC.startsWith(word)) best = Math.max(best, 500)
      else if (airportLC.includes(word)) best = Math.max(best, 200)

      if (cityLC === word) best = Math.max(best, 400)
      else if (cityLC.startsWith(word)) best = Math.max(best, 300)
      else if (cityLC.includes(word)) best = Math.max(best, 100)

      if (stateLC === word) best = Math.max(best, 150)

      for (const alias of aliasesLC) {
        if (alias === word) {
          best = Math.max(best, 800)
          break
        }
        if (alias.startsWith(word)) {
          best = Math.max(best, 500)
          break
        }
        if (alias.includes(word)) {
          best = Math.max(best, 250)
          break
        }
      }

      if (best > 0) {
        matched++
        wordScore += best
      }
    }
    if (matched === words.length) wordScore += 200 // all-words-matched bonus
    score = Math.max(score, wordScore)
  }

  return score
}

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
  const activeRef = useRef<HTMLButtonElement>(null)

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

  // Scoring-based search: relevance ranking
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 1) return []
    return FBO_DATA
      .map(fbo => ({ ...fbo, score: scoreFBO(fbo, q) }))
      .filter(r => r.score >= 100)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
  }, [query])

  function updateDropPosition() {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const left = Math.max(8, rect.left)
    const width = Math.min(rect.width, window.innerWidth - 16)
    setDropStyle(
      spaceBelow < 320
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left, width, zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left, width, zIndex: 9999 }
    )
  }

  // Update portal position when dropdown opens
  useEffect(() => {
    if (open) {
      updateDropPosition()
    }
  }, [open])

  // Scroll active item into view when keyboard navigating
  useEffect(() => {
    if (activeIdx >= 0) {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [activeIdx])

  function handleSelect(fbo: FBOEntry) {
    setQuery(fbo.name)
    onChange(fbo.name)
    if (onSelect) {
      onSelect(fbo)
    }
    setOpen(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(v.length > 0)
    setActiveIdx(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Enter" && query.trim()) setOpen(true)
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
        <Plane className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full h-9 text-sm border rounded-md pl-8 pr-6 focus:outline-none focus:ring-2 bg-white text-gray-800 transition-colors ${
            hasError
              ? "border-red-400 focus:ring-red-300/30 focus:border-red-400"
              : "border-gray-200 focus:ring-blue-500/30 focus:border-blue-400"
          }`}
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>

      {open && (results.length > 0 || query.length > 0) && createPortal(
        <div
          ref={dropRef}
          style={dropStyle}
          className="bg-white border border-gray-200/80 rounded-xl shadow-2xl shadow-gray-200/60 ring-1 ring-black/5 overflow-hidden"
        >
          {results.length > 0 && (
            <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50/80 border-b border-gray-100">
              {results.length} FBO{results.length !== 1 ? "s" : ""} found
            </div>
          )}
          <div className="max-h-[320px] overflow-y-auto scroll-smooth overscroll-contain">
            {results.length > 0 ? (
              results.map((fbo, idx) => {
                const score = (fbo as any).score || 0
                const nameColor = score >= 800 ? "text-gray-900" : score >= 400 ? "text-gray-700" : "text-gray-500"
                return (
                  <button
                    key={`${fbo.icao}-${fbo.name}`}
                    ref={idx === activeIdx ? activeRef : undefined}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(fbo)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 border-b border-gray-50 last:border-b-0 transition-all duration-75 ${
                      idx === activeIdx
                        ? "bg-blue-50"
                        : "hover:bg-blue-50/60 focus-visible:bg-blue-50/60"
                    }`}
                  >
                    <Plane className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${
                      idx === activeIdx ? "text-blue-400" : "text-gray-300"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${nameColor} transition-colors`}>
                        {fbo.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5 leading-snug">
                        {fbo.airport} · {fbo.city}, {fbo.state}
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap self-start mt-0.5 transition-colors ${
                      idx === activeIdx
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {fbo.icao}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <Plane className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <div className="text-sm text-gray-400 font-medium">No FBOs found</div>
                <div className="text-xs text-gray-300 mt-0.5">Try an ICAO code, city, or FBO name</div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
