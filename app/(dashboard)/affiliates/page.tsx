"use client"

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Network, UserPlus, CheckCircle2, Clock,
  MapPin, X, Check, Building2, Handshake, Star, SlidersHorizontal, ChevronDown, Car, Copy, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/lib/hooks/use-debounce"
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

// ─── Location suggestions (US cities + states, Canadian cities + provinces) ───

const LOCATIONS = [
  // US States
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
  "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
  // US Cities
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
  "Independence, MO", "Indianapolis, IN", "Inglewood, CA", "Irvine, CA",
  "Irving, TX",
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
  // Canadian Provinces & Territories
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon",
  // Canadian Major Cities (City, Province)
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

// ─── Featured locations (shown when search query is empty) ──────────────────

const FEATURED_LOCATIONS = [
  "New York City, NY", "Los Angeles, CA", "Miami, FL",   "Chicago, IL",
  "Las Vegas, NV",     "Houston, TX",     "Atlanta, GA", "Dallas, TX",
  "San Francisco, CA", "Boston, MA",      "Washington, DC", "Orlando, FL",
]

// ─── Location multi-select (popover pill) ────────────────────────────────────

function LocationMultiSelect({
  value,
  onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen]       = useState(false)
  const [inputVal, setInputVal] = useState("")
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the search input when the panel opens; clear query on close
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    } else {
      setInputVal("")
    }
  }, [open])

  // Close on outside click
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

  // Trigger label
  const triggerLabel =
    value.length === 0 ? "Location"
    : value.length === 1 ? value[0]
    : `${value.length} cities`

  return (
    <div ref={ref} className="relative">

      {/* ── Trigger pill — identical shape to VehicleTypeFilter / PassengerFilter ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
          value.length > 0
            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
        )}
      >
        <MapPin className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-[140px] truncate">{triggerLabel}</span>
        <ChevronDown className={cn(
          "w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {/* ── Dropdown panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] z-50 overflow-hidden"
          >

            {/* Search zone */}
            <div className="p-2.5 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Search cities & states…"
                  className="w-full pl-8.5 pr-8 h-9 text-sm rounded-xl border border-gray-200 bg-gray-50/80 focus:bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-400 transition-all"
                />
                {inputVal && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setInputVal(""); inputRef.current?.focus() }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Suggestions list */}
            <div className="overflow-y-auto" style={{ maxHeight: "204px" }}>
              {/* Section label */}
              <p className="px-3.5 pt-1 pb-1 text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em]">
                {inputVal.trim() ? "Results" : "Popular markets"}
              </p>

              {suggestions.length === 0 && inputVal.trim() ? (
                <div className="py-5 px-4 text-center">
                  <p className="text-[13px] text-gray-400">
                    No results for{" "}
                    <span className="font-medium text-gray-600">"{inputVal}"</span>
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
                        className="w-full text-left px-3 py-1.5 hover:bg-blue-50/70 flex items-center gap-2.5 group/row transition-colors"
                      >
                        {/* Icon tile */}
                        <div className="w-[26px] h-[26px] rounded-lg bg-gray-100 group-hover/row:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                          <MapPin className="w-3 h-3 text-gray-400 group-hover/row:text-blue-500 transition-colors" />
                        </div>
                        {/* Label */}
                        <span className="flex-1 truncate text-sm">
                          <span className="font-medium text-gray-800">{city}</span>
                          {state
                            ? <span className="text-gray-400">, {state}</span>
                            : <span className="text-[12px] text-gray-400"> — State</span>
                          }
                        </span>
                        {/* "Add" affordance */}
                        <span className="text-[10px] font-semibold text-blue-400 opacity-0 group-hover/row:opacity-100 transition-opacity mr-0.5 tracking-wide">
                          ADD
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Selected tray (shown only when cities are chosen) ── */}
            <AnimatePresence>
              {value.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{    opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  {/* Hairline divider */}
                  <div className="mx-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                  <div className="p-3">
                    {/* Tray header */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em]">
                        Selected
                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                          {value.length}
                        </span>
                      </p>
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { onChange([]); setInputVal(""); inputRef.current?.focus() }}
                        className="text-[11px] text-gray-400 hover:text-red-500 font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    </div>

                    {/* Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence mode="popLayout">
                        {value.map((loc) => (
                          <motion.span
                            key={loc}
                            layout
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1    }}
                            exit={{    opacity: 0, scale: 0.75 }}
                            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                            className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100/80 text-blue-700 text-[11px] font-medium pl-2.5 pr-1 py-[3px] rounded-full group/chip"
                          >
                            <span className="max-w-[130px] truncate leading-none">{loc}</span>
                            <button
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => removeLocation(loc)}
                              className="w-[14px] h-[14px] rounded-full bg-blue-100 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0 group/remove"
                            >
                              <X className="w-[9px] h-[9px] text-blue-400 group-hover/remove:text-red-500 transition-colors" />
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

// ─── Filter config ───────────────────────────────────────────────────────────

const VEHICLE_FILTERS = [
  { label: "Sedan",         value: "SEDAN" },
  { label: "SUV",           value: "SUV" },
  { label: "Premium Sedan", value: "STRETCH_LIMO" },
  { label: "Sprinter",      value: "SPRINTER" },
  { label: "Mini Coach",    value: "PARTY_BUS" },
  { label: "Motor Coach",   value: "COACH" },
]

// ─── Passenger capacity filter ───────────────────────────────────────────────

const PASSENGER_QUICK_PICKS = [4, 7, 14, 25, 55]

function PassengerFilter({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
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

  function apply(v: number) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
          value > 0
            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
        )}
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
            className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-4"
          >
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Min. passenger capacity</p>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setDraft((d) => Math.max(0, d - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all text-lg font-medium"
              >−</button>
              <div className="flex-1 text-center">
                {draft === 0
                  ? <span className="text-sm text-gray-400 font-medium">Any</span>
                  : <span className="text-xl font-bold text-gray-900">{draft}<span className="text-sm text-gray-400 font-normal ml-0.5">+</span></span>
                }
              </div>
              <button
                type="button"
                onClick={() => setDraft((d) => d + 1)}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all text-lg font-medium"
              >+</button>
            </div>
            <p className="text-[11px] text-gray-400 mb-2">Quick select</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                type="button"
                onClick={() => setDraft(0)}
                className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all", draft === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >Any</button>
              {PASSENGER_QUICK_PICKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft(n)}
                  className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all", draft === n ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
                >{n}+</button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => apply(draft)}
              className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
            >Apply</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Vehicle type filter ──────────────────────────────────────────────────────

function VehicleTypeFilter({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[]
  onToggle: (v: string) => void
  onClear: () => void
}) {
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
    ? "Vehicle Type"
    : selected.length === 1
      ? VEHICLE_FILTERS.find((f) => f.value === selected[0])?.label ?? "1 selected"
      : `${selected.length} types`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 h-10 px-3.5 rounded-xl border text-sm font-medium transition-all whitespace-nowrap",
          selected.length > 0
            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white"
        )}
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
            className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2">
              {VEHICLE_FILTERS.map((vf) => {
                const checked = selected.includes(vf.value)
                return (
                  <button
                    key={vf.value}
                    onClick={() => onToggle(vf.value)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all",
                      checked ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                      checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    )}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-medium">{vf.label}</span>
                  </button>
                )
              })}
            </div>
            {selected.length > 0 && (
              <>
                <div className="border-t border-gray-100" />
                <div className="p-2">
                  <button
                    onClick={() => { onClear(); setOpen(false) }}
                    className="w-full text-center py-2 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function AvatarOrInitials({
  logo,
  name,
  size = "md",
}: {
  logo?: string | null
  name: string
  size?: "sm" | "md" | "lg"
}) {
  const dim = size === "sm" ? "w-9 h-9" : size === "lg" ? "w-14 h-14" : "w-11 h-11"
  const text = size === "sm" ? "text-[11px]" : size === "lg" ? "text-xl" : "text-sm"

  if (logo) {
    return (
      <div className={`${dim} rounded-xl overflow-hidden bg-white border border-gray-100 shadow-sm flex-shrink-0`}>
        <img src={logo} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div
      className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0 font-bold ${text} text-white`}
      style={{
        background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)",
      }}
    >
      {getInitials(name)}
    </div>
  )
}

// ─── Connection action button ────────────────────────────────────────────────

function ConnectionButton({
  affiliate,
  size = "default",
}: {
  affiliate: AffiliateProfile
  size?: "default" | "sm"
}) {
  const send = useSendConnectionRequest()
  const respond = useRespondToConnection()
  const remove = useRemoveConnection()

  const status: ConnectionView = affiliate.connectionStatus
  const connectionId = affiliate.connectionId

  if (status === "CONNECTED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" />
        Connected
      </span>
    )
  }

  if (status === "SENT") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    )
  }

  if (status === "RECEIVED") {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "accept" })}
          disabled={respond.isPending}
        >
          <Check className="w-3 h-3" />
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs gap-1 text-gray-500"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "decline" })}
          disabled={respond.isPending}
        >
          <X className="w-3 h-3" />
          Decline
        </Button>
      </div>
    )
  }

  return (
    <Button
      size={size === "sm" ? "sm" : "default"}
      className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
      onClick={() => send.mutate(affiliate.id)}
      disabled={send.isPending}
    >
      <UserPlus className="w-3.5 h-3.5" />
      Connect
    </Button>
  )
}

// ─── Affiliate card (browse / connected grids) ───────────────────────────────

function AffiliateCard({
  affiliate,
  showFavorite = false,
}: {
  affiliate: AffiliateProfile
  showFavorite?: boolean
}) {
  const { favoriteIds } = useAffiliateFavorites()
  const toggleFavorite = useToggleAffiliateFavorite()
  const isFavorite = favoriteIds.has(affiliate.id)
  const [copied, setCopied] = useState(false)

  return (
    <Link
      href={`/affiliates/${affiliate.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Card banner */}
      <div
        className="h-[52px] relative flex-shrink-0"
        style={{
          background: affiliate.banner
            ? `url(${affiliate.banner}) center/cover`
            : "linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%)",
        }}
      >
        {/* Logo overlapping banner */}
        <div className="absolute -bottom-5 left-4">
          <div className="border-2 border-white rounded-xl shadow-sm">
            <AvatarOrInitials logo={affiliate.logo} name={affiliate.name} size="md" />
          </div>
        </div>

        {/* Favorite star — only shown on connected cards */}
        {showFavorite && (
          <div
            className="absolute top-2 right-2"
            onClick={(e) => { e.preventDefault(); toggleFavorite.mutate({ affiliateId: affiliate.id, isFavorite }) }}
          >
            <div
              className={`
                w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150
                ${isFavorite
                  ? "bg-amber-400/90 shadow-sm"
                  : "bg-white/60 hover:bg-white/90"}
              `}
            >
              <Star
                className={`w-3 h-3 transition-colors ${isFavorite ? "fill-white text-white" : "text-gray-400"}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="pt-8 px-4 pb-3">
        <div className="mb-2.5">
          <h3 className="font-semibold text-gray-900 text-sm truncate leading-snug">{affiliate.name}</h3>
          {(affiliate.city || affiliate.state) && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {[affiliate.city, affiliate.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>

        {/* Affiliate ID pill — full width, prominent, copyable */}
        {affiliate.affiliateCode ? (
          <div
            className="flex items-center justify-between gap-2 mb-3 px-2.5 py-1.5 rounded-lg cursor-pointer group transition-all"
            style={{
              background: copied
                ? "rgba(16,185,129,0.07)"
                : "linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(79,70,229,0.06) 100%)",
              border: copied ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(37,99,235,0.12)",
            }}
            onClick={(e) => {
              e.preventDefault()
              navigator.clipboard.writeText(affiliate.affiliateCode!)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            title="Click to copy affiliate ID"
          >
            <span className={`text-[11px] font-mono font-bold tracking-widest transition-colors ${copied ? "text-emerald-600" : "text-blue-700"}`}>
              {affiliate.affiliateCode}
            </span>
            {copied ? (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                <Check className="w-2.5 h-2.5" /> Copied
              </span>
            ) : (
              <Copy className="w-3 h-3 text-blue-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            )}
          </div>
        ) : (
          <div className="mb-3" />
        )}

        {/* Stop click propagation so buttons don't navigate */}
        <div onClick={(e) => e.preventDefault()}>
          <ConnectionButton affiliate={affiliate} size="sm" />
        </div>
      </div>
    </Link>
  )
}

// ─── Request row (incoming / outgoing) ──────────────────────────────────────

function RequestRow({
  connection,
  direction,
}: {
  connection: AffiliateConnection
  direction: "incoming" | "outgoing"
}) {
  const respond = useRespondToConnection()
  const other = direction === "incoming" ? connection.sender : connection.receiver

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
      <AvatarOrInitials logo={other.logo} name={other.name} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{other.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {[other.city, other.state].filter(Boolean).join(", ") || other.email}
        </p>
      </div>

      <Link
        href={`/affiliates/${other.id}`}
        className="text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium shrink-0 hidden sm:block"
      >
        Profile
      </Link>

      {direction === "incoming" ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
            onClick={() => respond.mutate({ connectionId: connection.id, action: "accept" })}
            disabled={respond.isPending}
          >
            <Check className="w-3 h-3" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2.5 text-xs text-gray-500 gap-1"
            onClick={() => respond.mutate({ connectionId: connection.id, action: "decline" })}
            disabled={respond.isPending}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
            <Clock className="w-2.5 h-2.5" />
            Sent
          </span>
          <button
            onClick={() => respond.mutate({ connectionId: connection.id, action: "cancel" })}
            disabled={respond.isPending}
            className="text-gray-300 hover:text-red-400 transition-colors"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Empty states ────────────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
      <p className="font-medium text-gray-500 text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1 max-w-xs">{description}</p>
    </div>
  )
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

type Tab = "browse" | "requests" | "connected"

function TabBar({
  active,
  onChange,
  pendingCount,
  connectedCount,
}: {
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
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 select-none",
            active === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
          )}
        >
          {tab.label}
          {tab.badge ? (
            <span className={cn(
              "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
              tab.id === "requests" && tab.badge > 0
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-500"
            )}>
              {tab.badge}
            </span>
          ) : null}
          {active === tab.id && (
            <motion.div
              layoutId="affiliates-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function AffiliatesContent() {
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

  // ── Browse filters (server-side) ──────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState<string[]>([])
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string[]>([])
  const [minCapacity, setMinCapacity] = useState(0)
  const debouncedSearch = useDebounce(search, 350)
  const hasActiveFilters = locationFilter.length > 0 || vehicleTypeFilter.length > 0 || minCapacity > 0

  // ── Connected filters (server-side via separate query) ───────────────────
  const [connectedSearch, setConnectedSearch] = useState("")
  const [connectedLocationFilter, setConnectedLocationFilter] = useState<string[]>([])
  const [connectedVehicleTypeFilter, setConnectedVehicleTypeFilter] = useState<string[]>([])
  const [connectedMinCapacity, setConnectedMinCapacity] = useState(0)
  const debouncedConnectedSearch = useDebounce(connectedSearch, 350)
  const hasActiveConnectedFilters =
    !!debouncedConnectedSearch ||
    connectedLocationFilter.length > 0 ||
    connectedVehicleTypeFilter.length > 0 ||
    connectedMinCapacity > 0

  function toggleVehicleType(value: string) {
    setVehicleTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function toggleConnectedVehicleType(value: string) {
    setConnectedVehicleTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function clearFilters() {
    setLocationFilter([])
    setVehicleTypeFilter([])
    setMinCapacity(0)
  }

  function clearConnectedFilters() {
    setConnectedSearch("")
    setConnectedLocationFilter([])
    setConnectedVehicleTypeFilter([])
    setConnectedMinCapacity(0)
  }

  // Two separate queries — each only active on its own tab
  const { data: browseData = [], isLoading: affiliatesLoading } = useAffiliates({
    search: debouncedSearch,
    locations: locationFilter,
    vehicleTypes: vehicleTypeFilter,
    minCapacity,
    enabled: activeTab === "browse",
  })
  const { data: connectedData = [], isLoading: connectedAffiliatesLoading } = useAffiliates({
    search: debouncedConnectedSearch,
    locations: connectedLocationFilter,
    vehicleTypes: connectedVehicleTypeFilter,
    minCapacity: connectedMinCapacity,
    enabled: activeTab === "connected",
  })

  const { data: incoming = [], isLoading: incomingLoading } = useAffiliateConnections("pending")
  const { data: sent = [], isLoading: sentLoading } = useAffiliateConnections("sent")
  const { data: connected = [] } = useAffiliateConnections("connected")
  const { favoriteIds } = useAffiliateFavorites()

  const pendingCount   = incoming.length
  const connectedCount = connected.length

  const browseList = useMemo(() => {
    return browseData.filter((a) => a.connectionStatus !== "CONNECTED")
  }, [browseData])

  const filteredConnectedList = useMemo(() => {
    return connectedData.filter((a) => a.connectionStatus === "CONNECTED")
  }, [connectedData])

  const pinnedList = useMemo(() => {
    return filteredConnectedList.filter((a) => favoriteIds.has(a.id))
  }, [filteredConnectedList, favoriteIds])

  const unpinnedList = useMemo(() => {
    return filteredConnectedList.filter((a) => !favoriteIds.has(a.id))
  }, [filteredConnectedList, favoriteIds])

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Premium header card ───────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)]">

        {/* Title row + inline metric strip */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">

          {/* Left: icon + title + description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                boxShadow: "0 4px 12px rgba(37,99,235,0.18)",
              }}
            >
              <Network className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
                Affiliates Network
              </h1>
              <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">
                Connect with trusted limo companies for coverage and referrals
              </p>
            </div>
          </div>

          {/* Right: metric strip */}
          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "On Network", value: browseData.length,  dot: "bg-blue-500",    tab: "browse"    as Tab },
              { label: "Connected",  value: connectedCount,    dot: "bg-emerald-500", tab: "connected" as Tab },
              { label: "Pending",    value: pendingCount,      dot: "bg-amber-400",   tab: "requests"  as Tab },
            ] as const).map((stat) => (
              <button
                key={stat.label}
                onClick={() => setActiveTab(stat.tab)}
                className={cn(
                  "flex flex-col items-center justify-center px-5 py-3 min-w-[88px] transition-all duration-150",
                  activeTab === stat.tab
                    ? "bg-white shadow-[0_0_0_1px_rgba(37,99,235,0.08)] relative"
                    : "hover:bg-white/70"
                )}
              >
                <span className={cn(
                  "text-[22px] font-bold leading-none tracking-tight",
                  activeTab === stat.tab ? "text-blue-600" : "text-gray-800"
                )}>
                  {stat.value}
                </span>
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stat.dot)} />
                  <span className="text-[11px] text-gray-400 font-medium leading-none whitespace-nowrap">
                    {stat.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        {/* Toolbar: tabs only */}
        <div className="px-6">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={pendingCount}
            connectedCount={connectedCount}
          />
        </div>
      </div>

      {/* ── Browse filter panel ───────────────────────────────────── */}
      {activeTab === "browse" && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name…"
              className="w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-400 transition-all"
            />
            {affiliatesLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {!affiliatesLoading && search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LocationMultiSelect value={locationFilter} onChange={setLocationFilter} />
            <PassengerFilter value={minCapacity} onChange={setMinCapacity} />
            <VehicleTypeFilter
              selected={vehicleTypeFilter}
              onToggle={toggleVehicleType}
              onClear={() => setVehicleTypeFilter([])}
            />
            <div className="flex-1" />
            {!affiliatesLoading && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {browseList.length} {browseList.length === 1 ? "affiliate" : "affiliates"}
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
          {(minCapacity > 0 || vehicleTypeFilter.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              {minCapacity > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-700 font-medium">
                  <Users className="w-3 h-3" />
                  {minCapacity}+ passengers
                  <button onClick={() => setMinCapacity(0)} className="ml-0.5 hover:text-blue-900 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              )}
              {vehicleTypeFilter.map((vt) => (
                <span key={vt} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs text-blue-700 font-medium">
                  <Car className="w-3 h-3" />
                  {VEHICLE_FILTERS.find((f) => f.value === vt)?.label ?? vt}
                  <button onClick={() => toggleVehicleType(vt)} className="ml-0.5 hover:text-blue-900 transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Connected filter panel ────────────────────────────────── */}
      {activeTab === "connected" && connectedCount > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={connectedSearch}
              onChange={(e) => setConnectedSearch(e.target.value)}
              placeholder="Search connected affiliates…"
              className="w-full pl-10 pr-10 h-11 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-400 transition-all"
            />
            {connectedSearch && (
              <button
                onClick={() => setConnectedSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <LocationMultiSelect value={connectedLocationFilter} onChange={setConnectedLocationFilter} />
            <PassengerFilter value={connectedMinCapacity} onChange={setConnectedMinCapacity} />
            <VehicleTypeFilter
              selected={connectedVehicleTypeFilter}
              onToggle={toggleConnectedVehicleType}
              onClear={() => setConnectedVehicleTypeFilter([])}
            />
            <div className="flex-1" />
            {!connectedAffiliatesLoading && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {filteredConnectedList.length} {filteredConnectedList.length === 1 ? "connection" : "connections"}
              </span>
            )}
            {hasActiveConnectedFilters && (
              <button
                onClick={clearConnectedFilters}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Tab content ──────────────────────────────────────────── */}
      <div>

        {/* ── Browse ── */}
        {activeTab === "browse" && (
          <>
            {affiliatesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
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

        {/* ── Requests ── */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Incoming */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
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
                    <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : incoming.length === 0 ? (
                <div className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 px-4 py-5 text-center">
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
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Sent Requests
              </h2>
              {sentLoading ? (
                <div className="space-y-2">
                  {[1].map((i) => (
                    <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : sent.length === 0 ? (
                <div className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 px-4 py-5 text-center">
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

        {/* ── Connected ── */}
        {activeTab === "connected" && (
          <>
            {connectedAffiliatesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
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
                {/* ── Pinned shortlist ── */}
                {pinnedList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pinned</h2>
                      <span className="text-[10px] text-gray-300 font-medium">{pinnedList.length}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {pinnedList.map((affiliate) => (
                        <AffiliateCard key={affiliate.id} affiliate={affiliate} showFavorite />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── All connections ── */}
                <div>
                  {pinnedList.length > 0 && (
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
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
  )
}

export default function AffiliatesPage() {
  return (
    <Suspense>
      <AffiliatesContent />
    </Suspense>
  )
}
