"use client"

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Network, UserPlus, CheckCircle2, Clock,
  MapPin, X, Check, Handshake, Star, Car, Copy, Users, ChevronDown,
} from "lucide-react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useTheme } from "@/lib/theme-context"
import {
  useAffiliates,
  useAffiliateConnections,
  useSendConnectionRequest,
  useRespondToConnection,
  useRemoveConnection,
  useAffiliateFavorites,
  useToggleAffiliateFavorite,
} from "@/lib/hooks/use-affiliates"
import type { AffiliateProfile, AffiliateConnection, ConnectionView } from "@/types"
import { cn } from "@/lib/utils"

// ─── Location suggestions ─────────────────────────────────────────────────────

const LOCATIONS = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
  "Abilene, TX", "Akron, OH", "Albuquerque, NM", "Alexandria, VA", "Anaheim, CA",
  "Anchorage, AK", "Ann Arbor, MI", "Antioch, CA", "Arlington, TX", "Arlington, VA",
  "Arvada, CO", "Atlanta, GA", "Aurora, CO", "Aurora, IL", "Austin, TX",
  "Bakersfield, CA", "Baltimore, MD", "Baton Rouge, LA", "Beaumont, TX",
  "Bellevue, WA", "Berkeley, CA", "Beverly Hills, CA", "Birmingham, AL",
  "Boca Raton, FL", "Boise, ID", "Boston, MA", "Bridgeport, CT", "Bronx, NY",
  "Brooklyn, NY", "Buffalo, NY", "Burbank, CA", "Cape Coral, FL",
  "Carrollton, TX", "Cary, NC", "Chandler, AZ", "Charlotte, NC", "Chesapeake, VA",
  "Chicago, IL", "Chula Vista, CA", "Cincinnati, OH", "Clarksville, TN",
  "Clearwater, FL", "Cleveland, OH", "Colorado Springs, CO", "Columbia, SC",
  "Columbus, GA", "Columbus, OH", "Coral Springs, FL", "Corona, CA",
  "Corpus Christi, TX", "Costa Mesa, CA", "Culver City, CA",
  "Dallas, TX", "Daly City, CA", "Dayton, OH", "Denver, CO", "Des Moines, IA",
  "Detroit, MI", "Dover, DE", "Durham, NC",
  "El Monte, CA", "El Paso, TX", "Elk Grove, CA", "Escondido, CA", "Eugene, OR",
  "Evansville, IN",
  "Fargo, ND", "Fontana, CA", "Fort Collins, CO", "Fort Lauderdale, FL",
  "Fort Wayne, IN", "Fort Worth, TX", "Fremont, CA", "Fresno, CA", "Fullerton, CA",
  "Garden Grove, CA", "Garland, TX", "Gilbert, AZ", "Glendale, AZ", "Glendale, CA",
  "Grand Prairie, TX", "Grand Rapids, MI", "Greensboro, NC",
  "Hampton, VA", "Hartford, CT", "Henderson, NV", "Hialeah, FL",
  "Hollywood, FL", "Honolulu, HI", "Houston, TX", "Huntington Beach, CA",
  "Huntsville, AL",
  "Independence, MO", "Indianapolis, IN", "Inglewood, CA", "Irvine, CA", "Irving, TX",
  "Jackson, MS", "Jacksonville, FL", "Jersey City, NJ", "Joliet, IL",
  "Kansas City, KS", "Kansas City, MO", "Knoxville, TN",
  "Lakewood, CO", "Lancaster, CA", "Laredo, TX", "Las Vegas, NV",
  "Lexington, KY", "Lincoln, NE", "Little Rock, AR", "Long Beach, CA",
  "Los Angeles, CA", "Louisville, KY", "Lubbock, TX",
  "Madison, WI", "Manhattan, NY", "Marina Del Rey, CA", "McKinney, TX",
  "Memphis, TN", "Mesa, AZ", "Mesquite, TX", "Miami, FL", "Miami Beach, FL",
  "Milwaukee, WI", "Minneapolis, MN", "Miramar, FL", "Modesto, CA",
  "Montgomery, AL", "Moreno Valley, CA",
  "Naples, FL", "Nashville, TN", "New Haven, CT", "New Orleans, LA",
  "New York City, NY", "Newark, NJ", "Newport Beach, CA", "Norfolk, VA",
  "North Las Vegas, NV", "Norwalk, CA",
  "Oakland, CA", "Oceanside, CA", "Oklahoma City, OK", "Omaha, NE",
  "Ontario, CA", "Orange, CA", "Orlando, FL", "Overland Park, KS", "Oxnard, CA",
  "Palm Bay, FL", "Palm Beach, FL", "Palmdale, CA", "Pasadena, CA", "Pasadena, TX",
  "Pembroke Pines, FL", "Peoria, AZ", "Peoria, IL", "Philadelphia, PA",
  "Phoenix, AZ", "Pittsburgh, PA", "Plano, TX", "Pomona, CA", "Port St. Lucie, FL",
  "Portland, OR", "Providence, RI",
  "Queens, NY", "Quonset, RI",
  "Raleigh, NC", "Rancho Cucamonga, CA", "Reno, NV", "Richmond, VA",
  "Riverside, CA", "Rochester, MN", "Rochester, NY", "Rockford, IL",
  "Sacramento, CA", "Salt Lake City, UT", "San Antonio, TX", "San Bernardino, CA",
  "San Diego, CA", "San Francisco, CA", "San Jose, CA", "Santa Ana, CA",
  "Santa Barbara, CA", "Santa Clarita, CA", "Santa Monica, CA", "Savannah, GA",
  "Scottsdale, AZ", "Seattle, WA", "Shreveport, LA", "Sioux Falls, SD",
  "Spokane, WA", "Springfield, MA", "Springfield, MO", "St. Louis, MO",
  "St. Paul, MN", "St. Petersburg, FL", "Stamford, CT", "Sterling Heights, MI",
  "Stockton, CA", "Sunnyvale, CA", "Syracuse, NY",
  "Tacoma, WA", "Tallahassee, FL", "Tampa, FL", "Tempe, AZ", "Thousand Oaks, CA",
  "Toledo, OH", "Torrance, CA", "Tucson, AZ", "Tulsa, OK",
  "Vancouver, WA", "Venice, CA", "Virginia Beach, VA",
  "Warren, MI", "Washington, DC", "West Hollywood, CA", "West Palm Beach, FL",
  "Wichita, KS", "Winston-Salem, NC", "Worcester, MA",
  "Yonkers, NY",
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
  "Abbotsford, BC", "Barrie, ON", "Brampton, ON", "Burnaby, BC", "Calgary, AB",
  "Charlottetown, PE", "Coquitlam, BC", "Edmonton, AB", "Fredericton, NB",
  "Gatineau, QC", "Halifax, NS", "Hamilton, ON", "Kelowna, BC", "Kitchener, ON",
  "Laval, QC", "Lethbridge, AB", "London, ON", "Longueuil, QC", "Markham, ON",
  "Medicine Hat, AB", "Mississauga, ON", "Moncton, NB", "Montreal, QC",
  "Nanaimo, BC", "Ottawa, ON", "Quebec City, QC", "Red Deer, AB", "Regina, SK",
  "Richmond Hill, ON", "Saskatoon, SK", "Sherbrooke, QC", "St. Catharines, ON",
  "Surrey, BC", "Toronto, ON", "Vancouver, BC", "Vaughan, ON", "Victoria, BC",
  "Windsor, ON", "Winnipeg, MB",
].sort()

const FEATURED_LOCATIONS = [
  "New York City, NY", "Los Angeles, CA", "Miami, FL",   "Chicago, IL",
  "Las Vegas, NV",     "Houston, TX",     "Atlanta, GA", "Dallas, TX",
  "San Francisco, CA", "Boston, MA",      "Washington, DC", "Orlando, FL",
]

// ─── Dark filter trigger style helpers ───────────────────────────────────────

const filterTriggerActive = {
  background: "rgba(201,168,124,0.15)",
  border: "1px solid rgba(201,168,124,0.30)",
  color: "#c9a87c",
} as const

const filterTriggerInactive = {
  background: "var(--lc-bg-glass)",
  border: "1px solid var(--lc-bg-glass-hover)",
  color: "var(--lc-text-secondary)",
} as const

const darkPanel = {
  background: "var(--lc-bg-surface)",
  border: "1px solid var(--lc-border)",
  boxShadow: "0 16px 48px rgba(0,0,0,0.60)",
} as const

// ─── Location multi-select ────────────────────────────────────────────────────

function LocationMultiSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen]       = useState(false)
  const [inputVal, setInputVal] = useState("")
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    } else {
      setInputVal("")
    }
  }, [open])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const suggestions = useMemo(() => {
    const q = inputVal.toLowerCase().trim()
    if (!q) return FEATURED_LOCATIONS.filter((l) => !value.includes(l))
    return LOCATIONS
      .filter((l) => !value.includes(l) && l.toLowerCase().includes(q))
      .sort((a, b) => {
        const aS = a.toLowerCase().startsWith(q)
        const bS = b.toLowerCase().startsWith(q)
        if (aS && !bS) return -1
        if (!aS && bS) return  1
        return a.localeCompare(b)
      })
      .slice(0, 8)
  }, [inputVal, value])

  function addLocation(loc: string) {
    if (!value.includes(loc)) onChange([...value, loc])
    setInputVal("")
    inputRef.current?.focus()
  }

  function removeLocation(loc: string) {
    onChange(value.filter((v) => v !== loc))
  }

  const triggerLabel =
    value.length === 0 ? "Location"
    : value.length === 1 ? value[0]
    : `${value.length} cities`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer"
        style={value.length > 0 ? filterTriggerActive : filterTriggerInactive}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-[140px] truncate">{triggerLabel}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-1.5 w-72 rounded-2xl z-50 overflow-hidden"
            style={darkPanel}
          >
            {/* Search zone */}
            <div className="p-2.5 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Search cities & states…"
                  className="w-full pl-8.5 pr-8 h-9 text-sm rounded-xl outline-none transition-all"
                  style={{
                    background: "var(--lc-bg-glass)",
                    border: "1px solid var(--lc-bg-glass-hover)",
                    color: "var(--lc-text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {inputVal && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setInputVal(""); inputRef.current?.focus() }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "var(--lc-border)" }}
                  >
                    <X className="w-2.5 h-2.5" style={{ color: "var(--lc-text-secondary)" }} />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions list */}
            <div className="overflow-y-auto" style={{ maxHeight: "204px" }}>
              <p className="px-3.5 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--lc-text-muted)" }}>
                {inputVal.trim() ? "Results" : "Popular markets"}
              </p>

              {suggestions.length === 0 && inputVal.trim() ? (
                <div className="py-5 px-4 text-center">
                  <p className="text-[13px]" style={{ color: "var(--lc-text-label)" }}>
                    No results for <span className="font-medium" style={{ color: "var(--lc-text-secondary)" }}>"{inputVal}"</span>
                  </p>
                </div>
              ) : (
                <div className="pb-1.5">
                  {suggestions.map((s) => {
                    const [city, state] = s.includes(",")
                      ? s.split(",").map((p) => p.trim())
                      : [s, null]
                    return (
                      <button
                        key={s}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addLocation(s)}
                        className="w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-colors cursor-pointer group/row"
                        style={{ color: "var(--lc-text-secondary)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-card)" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                      >
                        <div className="w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0 transition-colors" style={{ background: "var(--lc-bg-glass-mid)" }}>
                          <MapPin className="w-3 h-3" style={{ color: "var(--lc-text-label)" }} />
                        </div>
                        <span className="flex-1 truncate text-sm">
                          <span className="font-medium" style={{ color: "var(--lc-text-primary)" }}>{city}</span>
                          {state
                            ? <span style={{ color: "var(--lc-text-label)" }}>, {state}</span>
                            : <span className="text-[12px]" style={{ color: "var(--lc-text-muted)" }}> — State</span>
                          }
                        </span>
                        <span className="text-[10px] font-semibold opacity-0 group-hover/row:opacity-100 transition-opacity tracking-wide" style={{ color: "#c9a87c" }}>
                          ADD
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <AnimatePresence>
              {value.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mx-3 h-px" style={{ background: "var(--lc-bg-glass-mid)" }} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--lc-text-muted)" }}>
                        Selected
                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold" style={{ background: "#c9a87c", color: "var(--lc-bg-page)" }}>
                          {value.length}
                        </span>
                      </p>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { onChange([]); setInputVal(""); inputRef.current?.focus() }}
                        className="text-[11px] font-medium transition-colors cursor-pointer"
                        style={{ color: "var(--lc-text-label)" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence mode="popLayout">
                        {value.map((loc) => (
                          <motion.span
                            key={loc}
                            layout
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="inline-flex items-center gap-1 text-[11px] font-medium pl-2.5 pr-1 py-[3px] rounded-full"
                            style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.22)", color: "#c9a87c" }}
                          >
                            <span className="max-w-[130px] truncate leading-none">{loc}</span>
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => removeLocation(loc)}
                              className="w-[14px] h-[14px] rounded-full flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                              style={{ background: "rgba(201,168,124,0.20)" }}
                            >
                              <X className="w-[9px] h-[9px]" style={{ color: "#c9a87c" }} />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Filter config ────────────────────────────────────────────────────────────

const VEHICLE_FILTERS = [
  { label: "Sedan",         value: "SEDAN" },
  { label: "SUV",           value: "SUV" },
  { label: "Premium Sedan", value: "STRETCH_LIMO" },
  { label: "Sprinter",      value: "SPRINTER" },
  { label: "Mini Coach",    value: "PARTY_BUS" },
  { label: "Motor Coach",   value: "COACH" },
]

const PASSENGER_QUICK_PICKS = [4, 7, 14, 25, 55]

// ─── Passenger capacity filter ────────────────────────────────────────────────

function PassengerFilter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  function apply(v: number) { onChange(v); setOpen(false) }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer"
        style={value > 0 ? filterTriggerActive : filterTriggerInactive}
      >
        <Users className="w-4 h-4" />
        <span>{value > 0 ? `${value}+ pax` : "Passengers"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl z-50 p-4"
            style={darkPanel}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--lc-text-muted)" }}>
              Min. passenger capacity
            </p>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDraft((d) => Math.max(0, d - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium transition-all cursor-pointer"
                style={{ border: "1px solid var(--lc-border)", color: "var(--lc-text-secondary)", background: "var(--lc-bg-glass)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
              >−</button>
              <div className="flex-1 text-center">
                {draft === 0
                  ? <span className="text-sm font-medium" style={{ color: "var(--lc-text-label)" }}>Any</span>
                  : <span className="text-xl font-bold" style={{ color: "var(--lc-text-primary)" }}>
                      {draft}<span className="text-sm font-normal ml-0.5" style={{ color: "var(--lc-text-label)" }}>+</span>
                    </span>
                }
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => d + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium transition-all cursor-pointer"
                style={{ border: "1px solid var(--lc-border)", color: "var(--lc-text-secondary)", background: "var(--lc-bg-glass)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
              >+</button>
            </div>
            <p className="text-[11px] mb-2" style={{ color: "var(--lc-text-muted)" }}>Quick select</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setDraft(0)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={draft === 0
                  ? { background: "#c9a87c", color: "var(--lc-bg-page)" }
                  : { background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)" }
                }
              >Any</button>
              {PASSENGER_QUICK_PICKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft(n)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  style={draft === n
                    ? { background: "#c9a87c", color: "var(--lc-bg-page)" }
                    : { background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)" }
                  }
                >{n}+</button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => apply(draft)}
              className="w-full h-9 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              style={{ background: "#c9a87c", color: "var(--lc-bg-page)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b98c" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
            >Apply</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Vehicle type filter ──────────────────────────────────────────────────────

function VehicleTypeFilter({ selected, onToggle, onClear }: { selected: string[]; onToggle: (v: string) => void; onClear: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const label = selected.length === 0
    ? "Type"
    : selected.length === 1
      ? VEHICLE_FILTERS.find((f) => f.value === selected[0])?.label ?? "1 selected"
      : `${selected.length} types`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 h-10 px-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer"
        style={selected.length > 0 ? filterTriggerActive : filterTriggerInactive}
      >
        <Car className="w-4 h-4" />
        <span>{label}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1.5 w-52 rounded-2xl z-50 overflow-hidden"
            style={darkPanel}
          >
            <div className="p-2">
              {VEHICLE_FILTERS.map((vf) => {
                const checked = selected.includes(vf.value)
                return (
                  <button
                    key={vf.value}
                    onClick={() => onToggle(vf.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                    style={checked
                      ? { background: "rgba(201,168,124,0.12)", color: "#c9a87c" }
                      : { color: "var(--lc-text-secondary)" }
                    }
                    onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-card)" }}
                    onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                      style={checked
                        ? { background: "#c9a87c", border: "1px solid #c9a87c" }
                        : { background: "transparent", border: "1px solid var(--lc-border-medium)" }
                      }
                    >
                      {checked && <Check className="w-2.5 h-2.5" style={{ color: "var(--lc-bg-page)" }} />}
                    </div>
                    <span className="font-medium">{vf.label}</span>
                  </button>
                )
              })}
            </div>
            {selected.length > 0 && (
              <>
                <div className="mx-2 h-px" style={{ background: "var(--lc-bg-glass-mid)" }} />
                <div className="p-2">
                  <button
                    onClick={() => { onClear(); setOpen(false) }}
                    className="w-full text-center py-2 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: "var(--lc-text-label)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
                  >
                    Clear selection
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function AvatarOrInitials({ logo, name, size = "md" }: { logo?: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const dim  = size === "sm" ? "w-9 h-9"  : size === "lg" ? "w-14 h-14" : "w-11 h-11"
  const text = size === "sm" ? "text-[11px]" : size === "lg" ? "text-xl" : "text-sm"

  if (logo) {
    return (
      <div className={`${dim} rounded-xl overflow-hidden flex-shrink-0`}
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)" }}>
        <img src={logo} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${text} text-white`}
      style={{ background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)" }}
    >
      {getInitials(name)}
    </div>
  )
}

// ─── Connection action button ─────────────────────────────────────────────────

function ConnectionButton({ affiliate, size = "default" }: { affiliate: AffiliateProfile; size?: "default" | "sm" }) {
  const send    = useSendConnectionRequest()
  const respond = useRespondToConnection()
  const remove  = useRemoveConnection()

  const status: ConnectionView = affiliate.connectionStatus
  const connectionId = affiliate.connectionId

  if (status === "CONNECTED") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: "rgba(52,211,153,0.10)", color: "rgba(52,211,153,0.90)", border: "1px solid rgba(52,211,153,0.15)" }}
      >
        <CheckCircle2 className="w-3 h-3" />
        Connected
      </span>
    )
  }

  if (status === "SENT") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)", border: "1px solid var(--lc-bg-glass-hover)" }}
      >
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  if (status === "RECEIVED") {
    return (
      <div className="flex items-center gap-1.5">
        <button
          className="h-7 px-3 text-xs rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          style={{ background: "#c9a87c", color: "var(--lc-bg-page)" }}
          onClick={() => connectionId && respond.mutate({ connectionId, action: "accept" })}
          disabled={respond.isPending}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b98c" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
        >
          <Check className="w-3 h-3" />
          Accept
        </button>
        <button
          className="h-7 px-2.5 text-xs rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-all"
          style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)", border: "1px solid var(--lc-bg-glass-hover)" }}
          onClick={() => connectionId && respond.mutate({ connectionId, action: "decline" })}
          disabled={respond.isPending}
        >
          <X className="w-3 h-3" />
          Decline
        </button>
      </div>
    )
  }

  return (
    <button
      className="h-8 px-3 text-xs rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
      style={{ background: "#c9a87c", color: "var(--lc-bg-page)" }}
      onClick={() => send.mutate(affiliate.id)}
      disabled={send.isPending}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b98c" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
    >
      <UserPlus className="w-3.5 h-3.5" />
      Connect
    </button>
  )
}

// ─── Affiliate card ───────────────────────────────────────────────────────────

function AffiliateCard({ affiliate, showFavorite = false }: { affiliate: AffiliateProfile; showFavorite?: boolean }) {
  const { isDark }       = useTheme()
  const { favoriteIds }  = useAffiliateFavorites()
  const toggleFavorite   = useToggleAffiliateFavorite()
  const isFavorite       = favoriteIds.has(affiliate.id)
  const [copied, setCopied]   = useState(false)
  const [hovered, setHovered] = useState(false)

  const hoverBg     = isDark ? "#111e35" : "var(--lc-bg-card)"
  const hoverShadow = isDark ? "0 8px 28px rgba(0,0,0,0.45)" : "0 8px 20px rgba(0,0,0,0.10)"
  const baseShadow  = isDark ? "0 2px 12px rgba(0,0,0,0.28)" : "0 2px 8px rgba(0,0,0,0.06)"

  return (
    <Link
      href={`/affiliates/${affiliate.id}`}
      className="block rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: hovered ? hoverBg : "var(--lc-bg-surface)",
        border:     hovered ? "1px solid var(--lc-border)" : "1px solid var(--lc-bg-glass-mid)",
        boxShadow:  hovered ? hoverShadow : baseShadow,
        transform:  hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card banner */}
      <div
        className="h-[52px] relative flex-shrink-0"
        style={{
          background: affiliate.banner
            ? `url(${affiliate.banner}) center/cover`
            : "linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(79,70,229,0.14) 100%)",
        }}
      >
        {/* Logo overlapping banner */}
        <div className="absolute -bottom-5 left-4">
          <div className="border-2 rounded-xl" style={{ borderColor: hovered ? hoverBg : "var(--lc-bg-surface)" }}>
            <AvatarOrInitials logo={affiliate.logo} name={affiliate.name} size="md" />
          </div>
        </div>

        {/* Favorite star */}
        {showFavorite && (
          <div
            className="absolute top-2 right-2"
            onClick={(e) => { e.preventDefault(); toggleFavorite.mutate({ affiliateId: affiliate.id, isFavorite }) }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer"
              style={isFavorite
                ? { background: "rgba(251,191,36,0.85)" }
                : { background: "rgba(0,0,0,0.40)" }
              }
            >
              <Star className={`w-3 h-3 transition-colors ${isFavorite ? "fill-white text-white" : "text-white/55"}`} />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="pt-8 px-4 pb-3">
        <div className="mb-2.5">
          <h3 className="font-semibold text-sm truncate leading-snug" style={{ color: "var(--lc-text-primary)" }}>
            {affiliate.name}
          </h3>
          {(affiliate.city || affiliate.state) && (
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--lc-text-label)" }}>
              <MapPin className="w-2.5 h-2.5" />
              {[affiliate.city, affiliate.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Affiliate ID pill */}
        {affiliate.affiliateCode ? (
          <div
            className="flex items-center justify-between gap-2 mb-3 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all"
            style={{
              background: copied ? "rgba(52,211,153,0.08)" : "rgba(201,168,124,0.08)",
              border:     copied ? "1px solid rgba(52,211,153,0.20)" : "1px solid rgba(201,168,124,0.18)",
            }}
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText(affiliate.affiliateCode!)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            title="Click to copy affiliate ID"
          >
            <span
              className="text-[11px] font-mono font-bold tracking-widest transition-colors"
              style={{ color: copied ? "rgba(52,211,153,0.90)" : "#c9a87c" }}
            >
              {affiliate.affiliateCode}
            </span>
            {copied ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: "rgba(52,211,153,0.90)" }}>
                <Check className="w-2.5 h-2.5" /> Copied
              </span>
            ) : (
              <Copy className="w-3 h-3" style={{ color: "rgba(201,168,124,0.45)" }} />
            )}
          </div>
        ) : (
          <div className="mb-3" />
        )}

        <div onClick={(e) => e.preventDefault()}>
          <ConnectionButton affiliate={affiliate} size="sm" />
        </div>
      </div>
    </Link>
  )
}

// ─── Request row ──────────────────────────────────────────────────────────────

function RequestRow({ connection, direction }: { connection: AffiliateConnection; direction: "incoming" | "outgoing" }) {
  const respond = useRespondToConnection()
  const other   = direction === "incoming" ? connection.sender : connection.receiver

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
    >
      <AvatarOrInitials logo={other.logo} name={other.name} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" style={{ color: "var(--lc-text-primary)" }}>{other.name}</p>
        <p className="text-xs truncate" style={{ color: "var(--lc-text-label)" }}>
          {[other.city, other.state].filter(Boolean).join(", ") || other.email}
        </p>
      </div>

      <Link
        href={`/affiliates/${other.id}`}
        className="text-xs font-medium shrink-0 hidden sm:block transition-colors"
        style={{ color: "var(--lc-text-muted)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#c9a87c" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)" }}
      >
        Profile
      </Link>

      {direction === "incoming" ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            className="h-7 px-3 text-xs rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            style={{ background: "#c9a87c", color: "var(--lc-bg-page)" }}
            onClick={() => respond.mutate({ connectionId: connection.id, action: "accept" })}
            disabled={respond.isPending}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b98c" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
          <button
            className="h-7 px-2.5 text-xs rounded-lg flex items-center cursor-pointer transition-all"
            style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)", border: "1px solid var(--lc-bg-glass-hover)" }}
            onClick={() => respond.mutate({ connectionId: connection.id, action: "decline" })}
            disabled={respond.isPending}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-dim)" }}
          >
            <Clock className="w-2.5 h-2.5" />
            Sent
          </span>
          <button
            onClick={() => respond.mutate({ connectionId: connection.id, action: "cancel" })}
            disabled={respond.isPending}
            className="transition-colors cursor-pointer"
            style={{ color: "var(--lc-text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)" }}
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.15)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "rgba(201,168,124,0.50)" }} />
      </div>
      <p className="font-medium text-sm" style={{ color: "var(--lc-text-secondary)" }}>{title}</p>
      <p className="text-xs mt-1 max-w-xs leading-relaxed" style={{ color: "var(--lc-text-label)" }}>{description}</p>
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = "browse" | "requests" | "connected"

function TabBar({ active, onChange, pendingCount, connectedCount }: {
  active: Tab
  onChange: (t: Tab) => void
  pendingCount: number
  connectedCount: number
}) {
  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "browse",    label: "Browse" },
    { id: "requests",  label: "Requests",  badge: pendingCount },
    { id: "connected", label: "Connected", badge: connectedCount || undefined },
  ]

  return (
    <div className="flex items-center">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 select-none cursor-pointer"
          style={active === tab.id ? { color: "var(--lc-text-primary)" } : { color: "var(--lc-text-label)" }}
        >
          {tab.label}
          {tab.badge ? (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
                tab.id === "requests" && tab.badge > 0 ? "bg-red-500 text-white" : ""
              )}
              style={!(tab.id === "requests" && tab.badge > 0)
                ? { background: "var(--lc-border)", color: "var(--lc-text-secondary)" }
                : {}
              }
            >
              {tab.badge}
            </span>
          ) : null}
          {active === tab.id && (
            <motion.div
              layoutId="affiliates-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
              style={{ background: "#c9a87c" }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AffiliatesContent() {
  const { isDark }   = useTheme()
  const router       = useRouter()
  const searchParams = useSearchParams()

  const VALID_TABS: Tab[] = ["browse", "requests", "connected"]
  const tabFromUrl = searchParams.get("tab") as Tab | null
  const activeTab  = VALID_TABS.includes(tabFromUrl as Tab) ? (tabFromUrl as Tab) : "browse"

  const setActiveTab = useCallback((tab: Tab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "browse") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const qs = params.toString()
    router.replace(`/affiliates${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router, searchParams])

  const [search, setSearch]                         = useState("")
  const [locationFilter, setLocationFilter]         = useState<string[]>([])
  const [vehicleTypeFilter, setVehicleTypeFilter]   = useState<string[]>([])
  const [minCapacity, setMinCapacity]               = useState(0)
  const debouncedSearch                             = useDebounce(search, 350)
  const hasActiveFilters = locationFilter.length > 0 || vehicleTypeFilter.length > 0 || minCapacity > 0

  const [connectedSearch, setConnectedSearch]                       = useState("")
  const [connectedLocationFilter, setConnectedLocationFilter]       = useState<string[]>([])
  const [connectedVehicleTypeFilter, setConnectedVehicleTypeFilter] = useState<string[]>([])
  const [connectedMinCapacity, setConnectedMinCapacity]             = useState(0)
  const debouncedConnectedSearch  = useDebounce(connectedSearch, 350)
  const hasActiveConnectedFilters =
    !!debouncedConnectedSearch ||
    connectedLocationFilter.length > 0 ||
    connectedVehicleTypeFilter.length > 0 ||
    connectedMinCapacity > 0

  function toggleVehicleType(value: string) {
    setVehicleTypeFilter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])
  }
  function toggleConnectedVehicleType(value: string) {
    setConnectedVehicleTypeFilter((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value])
  }
  function clearFilters() { setLocationFilter([]); setVehicleTypeFilter([]); setMinCapacity(0) }
  function clearConnectedFilters() {
    setConnectedSearch(""); setConnectedLocationFilter([]); setConnectedVehicleTypeFilter([]); setConnectedMinCapacity(0)
  }

  const { data: browseData = [], isLoading: affiliatesLoading } = useAffiliates({
    search: debouncedSearch, locations: locationFilter, vehicleTypes: vehicleTypeFilter, minCapacity,
    enabled: activeTab === "browse",
  })
  const { data: connectedData = [], isLoading: connectedAffiliatesLoading } = useAffiliates({
    search: debouncedConnectedSearch, locations: connectedLocationFilter, vehicleTypes: connectedVehicleTypeFilter, minCapacity: connectedMinCapacity,
    enabled: activeTab === "connected",
  })

  const { data: incoming = [], isLoading: incomingLoading } = useAffiliateConnections("pending")
  const { data: sent = [],     isLoading: sentLoading }     = useAffiliateConnections("sent")
  const { data: connected = [] }                            = useAffiliateConnections("connected")
  const { favoriteIds }                                     = useAffiliateFavorites()

  const pendingCount   = incoming.length
  const connectedCount = connected.length

  const browseList = useMemo(() => browseData.filter((a) => a.connectionStatus !== "CONNECTED"), [browseData])

  const filteredConnectedList = useMemo(() => connectedData.filter((a) => a.connectionStatus === "CONNECTED"), [connectedData])
  const pinnedList   = useMemo(() => filteredConnectedList.filter((a) =>  favoriteIds.has(a.id)), [filteredConnectedList, favoriteIds])
  const unpinnedList = useMemo(() => filteredConnectedList.filter((a) => !favoriteIds.has(a.id)), [filteredConnectedList, favoriteIds])

  return (
    <>
      {/* Dark backdrop behind dock nav */}
      <div
        className="fixed bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "var(--lc-bg-page)", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "var(--lc-bg-page)", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-5xl mx-auto space-y-3">

          {/* ── Header card ─────────────────────────────────────────── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            {/* Title row + stat pills */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <Network className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Network
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}>
                    Connect with trusted limo companies
                  </p>
                </div>
              </div>

              {/* Stat pills — clickable to switch tabs */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {(isDark ? [
                  { label: "Network",   value: browseData.length, bg: "rgba(201,168,124,0.10)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c", tab: "browse"    as Tab },
                  { label: "Connected", value: connectedCount,    bg: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399", tab: "connected" as Tab },
                  { label: "Pending",   value: pendingCount,      bg: "rgba(251,191,36,0.10)",  color: "rgba(251,191,36,0.90)",  dot: "#fbbf24", tab: "requests"  as Tab },
                ] : [
                  { label: "Network",   value: browseData.length, bg: "var(--lc-bg-glass-mid)", color: "var(--lc-text-primary)", dot: "#c9a87c", tab: "browse"    as Tab },
                  { label: "Connected", value: connectedCount,    bg: "var(--lc-bg-glass-mid)", color: "var(--lc-text-primary)", dot: "#64B896", tab: "connected" as Tab },
                  { label: "Pending",   value: pendingCount,      bg: "var(--lc-bg-glass-mid)", color: "var(--lc-text-primary)", dot: "#fbbf24", tab: "requests"  as Tab },
                ]).map(s => (
                  <button
                    key={s.label}
                    onClick={() => setActiveTab(s.tab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer"
                    style={{
                      background: s.bg,
                      border: activeTab === s.tab ? `1px solid ${s.dot}40` : "1px solid var(--lc-border)",
                      color: s.color,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums">{s.value}</span>
                    <span className="font-medium" style={{ opacity: isDark ? 0.7 : 1 }}>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            {/* Tab bar */}
            <div className="px-2">
              <TabBar
                active={activeTab}
                onChange={setActiveTab}
                pendingCount={pendingCount}
                connectedCount={connectedCount}
              />
            </div>
          </div>

          {/* ── Browse filter panel ──────────────────────────────────── */}
          {activeTab === "browse" && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by company name…"
                  className="w-full pl-10 pr-10 h-11 text-sm rounded-xl outline-none transition-all font-medium"
                  style={{
                    background: "var(--lc-bg-glass)",
                    border: "1px solid var(--lc-bg-glass-hover)",
                    color: "var(--lc-text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {affiliatesLoading && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(201,168,124,0.60)", borderTopColor: "transparent" }} />
                )}
                {!affiliatesLoading && search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "var(--lc-border)" }}
                  >
                    <X className="w-3 h-3" style={{ color: "var(--lc-text-secondary)" }} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <LocationMultiSelect value={locationFilter} onChange={setLocationFilter} />
                <PassengerFilter value={minCapacity} onChange={setMinCapacity} />
                <VehicleTypeFilter selected={vehicleTypeFilter} onToggle={toggleVehicleType} onClear={() => setVehicleTypeFilter([])} />
                <div className="flex-1" />
                {!affiliatesLoading && (
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--lc-text-muted)" }}>
                    {browseList.length} {browseList.length === 1 ? "affiliate" : "affiliates"}
                  </span>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: "var(--lc-text-label)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {(minCapacity > 0 || vehicleTypeFilter.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {minCapacity > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)", color: "#c9a87c" }}
                    >
                      <Users className="w-3 h-3" />
                      {minCapacity}+ passengers
                      <button onClick={() => setMinCapacity(0)} className="ml-0.5 cursor-pointer transition-opacity hover:opacity-60"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {vehicleTypeFilter.map((vt) => (
                    <span
                      key={vt}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)", color: "#c9a87c" }}
                    >
                      <Car className="w-3 h-3" />
                      {VEHICLE_FILTERS.find((f) => f.value === vt)?.label ?? vt}
                      <button onClick={() => toggleVehicleType(vt)} className="ml-0.5 cursor-pointer transition-opacity hover:opacity-60"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Connected filter panel ───────────────────────────────── */}
          {activeTab === "connected" && connectedCount > 0 && (
            <div
              className="rounded-2xl p-4 space-y-3"
              style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                <input
                  type="text"
                  value={connectedSearch}
                  onChange={(e) => setConnectedSearch(e.target.value)}
                  placeholder="Search connected affiliates…"
                  className="w-full pl-10 pr-10 h-11 text-sm rounded-xl outline-none transition-all font-medium"
                  style={{
                    background: "var(--lc-bg-glass)",
                    border: "1px solid var(--lc-bg-glass-hover)",
                    color: "var(--lc-text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {connectedSearch && (
                  <button
                    onClick={() => setConnectedSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                    style={{ background: "var(--lc-border)" }}
                  >
                    <X className="w-3 h-3" style={{ color: "var(--lc-text-secondary)" }} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <LocationMultiSelect value={connectedLocationFilter} onChange={setConnectedLocationFilter} />
                <PassengerFilter value={connectedMinCapacity} onChange={setConnectedMinCapacity} />
                <VehicleTypeFilter selected={connectedVehicleTypeFilter} onToggle={toggleConnectedVehicleType} onClear={() => setConnectedVehicleTypeFilter([])} />
                <div className="flex-1" />
                {!connectedAffiliatesLoading && (
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--lc-text-muted)" }}>
                    {filteredConnectedList.length} {filteredConnectedList.length === 1 ? "connection" : "connections"}
                  </span>
                )}
                {hasActiveConnectedFilters && (
                  <button
                    onClick={clearConnectedFilters}
                    className="flex items-center gap-1 text-xs font-medium transition-colors cursor-pointer"
                    style={{ color: "var(--lc-text-label)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)" }}
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Tab content ─────────────────────────────────────────── */}
          <div>

            {/* Browse */}
            {activeTab === "browse" && (
              <>
                {affiliatesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-2xl h-36 animate-pulse"
                        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }} />
                    ))}
                  </div>
                ) : browseList.length === 0 ? (
                  <EmptyState
                    icon={search ? Search : Network}
                    title={search ? "No affiliates found" : "No other affiliates yet"}
                    description={
                      search
                        ? `No results for "${search}". Try a different search term.`
                        : "You're the first one here — more limousine companies will join soon."
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {browseList.map((affiliate) => (
                      <AffiliateCard key={affiliate.id} affiliate={affiliate} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Requests */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                {/* Incoming */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-muted)" }}>
                      Incoming Requests
                    </h2>
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  {incomingLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 rounded-xl animate-pulse"
                          style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }} />
                      ))}
                    </div>
                  ) : incoming.length === 0 ? (
                    <div
                      className="text-sm px-4 py-5 text-center rounded-xl"
                      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", color: "var(--lc-text-label)" }}
                    >
                      No pending incoming requests
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {incoming.map((c) => (
                        <RequestRow key={c.id} connection={c} direction="incoming" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-muted)" }}>
                    Sent Requests
                  </h2>
                  {sentLoading ? (
                    <div className="space-y-2">
                      {[1].map((i) => (
                        <div key={i} className="h-16 rounded-xl animate-pulse"
                          style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }} />
                      ))}
                    </div>
                  ) : sent.length === 0 ? (
                    <div
                      className="text-sm px-4 py-5 text-center rounded-xl"
                      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", color: "var(--lc-text-label)" }}
                    >
                      No outgoing requests
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sent.map((c) => (
                        <RequestRow key={c.id} connection={c} direction="outgoing" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Connected */}
            {activeTab === "connected" && (
              <>
                {connectedAffiliatesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="rounded-2xl h-36 animate-pulse"
                        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }} />
                    ))}
                  </div>
                ) : connectedCount === 0 ? (
                  <EmptyState
                    icon={Handshake}
                    title="No connections yet"
                    description="Browse the network and send connection requests to other limousine companies."
                  />
                ) : filteredConnectedList.length === 0 ? (
                  <EmptyState
                    icon={Search}
                    title="No results"
                    description="No connected affiliates match your search. Try different terms or clear the filters."
                  />
                ) : (
                  <div className="space-y-6">
                    {/* Pinned */}
                    {pinnedList.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-muted)" }}>Pinned</h2>
                          <span className="text-[10px] font-medium" style={{ color: "var(--lc-text-muted)" }}>{pinnedList.length}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {pinnedList.map((affiliate) => (
                            <AffiliateCard key={affiliate.id} affiliate={affiliate} showFavorite />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All connections */}
                    <div>
                      {pinnedList.length > 0 && (
                        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-muted)" }}>
                          All Connections
                        </h2>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {unpinnedList.map((affiliate) => (
                          <AffiliateCard key={affiliate.id} affiliate={affiliate} showFavorite />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

export default function AffiliatesPage() {
  return (
    <Suspense>
      <AffiliatesContent />
    </Suspense>
  )
}
