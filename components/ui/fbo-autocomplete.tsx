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

  // Update portal position when dropdown opens or on scroll/resize
  useEffect(() => {
    if (!open) return

    updateDropPosition()

    const handleScroll = () => updateDropPosition()
    const handleResize = () => updateDropPosition()

    document.addEventListener("scroll", handleScroll, true)
    window.addEventListener("resize", handleResize)

    return () => {
      document.removeEventListener("scroll", handleScroll, true)
      window.removeEventListener("resize", handleResize)
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
        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            if (query.length > 0 && results.length > 0) setOpen(true)
            e.currentTarget.style.borderColor = hasError ? "rgba(248,113,113,0.60)" : "rgba(201,168,124,0.50)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = hasError ? "rgba(248,113,113,0.50)" : "var(--lc-border)"
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-10 text-sm rounded-xl pl-9 pr-8 outline-none transition-colors"
          style={{
            background: "var(--lc-bg-glass)",
            border: `1px solid ${hasError ? "rgba(248,113,113,0.50)" : "var(--lc-border)"}`,
            color: "var(--lc-text-primary)",
          }}
        />
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
      </div>

      {open && (results.length > 0 || query.length > 0) && createPortal(
        <div
          ref={dropRef}
          style={{ ...dropStyle, background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)", borderRadius: "14px", boxShadow: "0 24px 60px rgba(0,0,0,0.65)", overflow: "hidden" }}
        >
          {results.length > 0 && (
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)", background: "var(--lc-bg-card)", borderBottom: "1px solid var(--lc-bg-glass-mid)" }}>
              {results.length} FBO{results.length !== 1 ? "s" : ""} found
            </div>
          )}
          <div className="max-h-[320px] overflow-y-auto scroll-smooth overscroll-contain">
            {results.length > 0 ? (
              results.map((fbo, idx) => {
                const isActive = idx === activeIdx
                return (
                  <button
                    key={`${fbo.icao}-${fbo.name}`}
                    ref={isActive ? activeRef : undefined}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(fbo)}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full text-left px-3 py-2.5 flex items-start gap-2.5 transition-colors"
                    style={{
                      background: isActive ? "var(--lc-bg-glass-mid)" : "transparent",
                      borderBottom: "1px solid var(--lc-bg-card)",
                    }}
                  >
                    <Plane className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isActive ? "#c9a87c" : "var(--lc-text-muted)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: isActive ? "var(--lc-text-primary)" : "var(--lc-text-secondary)" }}>
                        {fbo.name}
                      </div>
                      <div className="text-xs truncate mt-0.5 leading-snug" style={{ color: "var(--lc-text-label)" }}>
                        {fbo.airport} · {fbo.city}, {fbo.state}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap self-start mt-0.5"
                      style={isActive
                        ? { background: "rgba(201,168,124,0.15)", color: "#c9a87c" }
                        : { background: "var(--lc-bg-glass)", color: "var(--lc-text-dim)" }
                      }>
                      {fbo.icao}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-6 text-center">
                <Plane className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(200,212,228,0.15)" }} />
                <div className="text-sm font-medium" style={{ color: "var(--lc-text-label)" }}>No FBOs found</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--lc-text-muted)" }}>Try an ICAO code, city, or FBO name</div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
