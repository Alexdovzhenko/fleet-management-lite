"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Network, UserPlus, CheckCircle2, Clock,
  MapPin, X, Check, Building2, Handshake, Star, SlidersHorizontal, ChevronDown, Car, Copy,
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
  // US Major Cities (City, ST)
  "Albuquerque, NM", "Anaheim, CA", "Anchorage, AK", "Arlington, TX", "Atlanta, GA",
  "Aurora, CO", "Austin, TX", "Bakersfield, CA", "Baltimore, MD", "Baton Rouge, LA",
  "Bellevue, WA", "Birmingham, AL", "Boise, ID", "Boston, MA", "Bridgeport, CT",
  "Buffalo, NY", "Charlotte, NC", "Chesapeake, VA", "Chicago, IL", "Chula Vista, CA",
  "Cincinnati, OH", "Cleveland, OH", "Colorado Springs, CO", "Columbus, OH",
  "Corpus Christi, TX", "Dallas, TX", "Denver, CO", "Des Moines, IA", "Detroit, MI",
  "Durham, NC", "El Paso, TX", "Fort Lauderdale, FL", "Fort Wayne, IN",
  "Fort Worth, TX", "Fremont, CA", "Fresno, CA", "Garland, TX", "Gilbert, AZ",
  "Glendale, AZ", "Greensboro, NC", "Henderson, NV", "Hialeah, FL", "Hollywood, FL",
  "Honolulu, HI", "Houston, TX", "Huntsville, AL", "Indianapolis, IN", "Irvine, CA",
  "Jacksonville, FL", "Jersey City, NJ", "Kansas City, MO", "Knoxville, TN",
  "Laredo, TX", "Las Vegas, NV", "Lexington, KY", "Lincoln, NE", "Little Rock, AR",
  "Long Beach, CA", "Los Angeles, CA", "Louisville, KY", "Lubbock, TX",
  "Madison, WI", "Memphis, TN", "Mesa, AZ", "Miami, FL", "Milwaukee, WI",
  "Minneapolis, MN", "Modesto, CA", "Montgomery, AL", "Nashville, TN",
  "New Orleans, LA", "New York City, NY", "Newark, NJ", "Norfolk, VA",
  "North Las Vegas, NV", "Oakland, CA", "Oklahoma City, OK", "Omaha, NE",
  "Orlando, FL", "Oxnard, CA", "Pasadena, CA", "Philadelphia, PA", "Phoenix, AZ",
  "Pittsburgh, PA", "Plano, TX", "Portland, OR", "Providence, RI", "Raleigh, NC",
  "Reno, NV", "Richmond, VA", "Riverside, CA", "Rochester, NY", "Sacramento, CA",
  "Salt Lake City, UT", "San Antonio, TX", "San Bernardino, CA", "San Diego, CA",
  "San Francisco, CA", "San Jose, CA", "Santa Ana, CA", "Santa Clarita, CA",
  "Scottsdale, AZ", "Seattle, WA", "Shreveport, LA", "Spokane, WA", "St. Louis, MO",
  "St. Paul, MN", "St. Petersburg, FL", "Stockton, CA", "Syracuse, NY",
  "Tacoma, WA", "Tampa, FL", "Toledo, OH", "Tucson, AZ", "Tulsa, OK",
  "Virginia Beach, VA", "Washington, DC", "Wichita, KS", "Winston-Salem, NC",
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

// ─── Location autocomplete input ─────────────────────────────────────────────

function LocationInput({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const suggestions = useMemo(() => {
    if (!value.trim()) return []
    const q = value.toLowerCase()
    return LOCATIONS.filter((l) => l.toLowerCase().includes(q)).slice(0, 8)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none z-10" />
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => value && setOpen(true)}
        placeholder="State or province…"
        className="pl-8 pr-7 h-8 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-300 placeholder:text-gray-400 w-44"
      />
      {value && (
        <button
          onClick={() => { onChange(""); setOpen(false) }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
            >
              <MapPin className="w-3 h-3 text-gray-300 flex-shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
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

// ─── Vehicle type dropdown ────────────────────────────────────────────────────

function VehicleDropdown({
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
        className={`flex items-center gap-2 px-3 h-8 rounded-lg border text-sm transition-all ${
          selected.length > 0
            ? "bg-blue-600 border-blue-600 text-white"
            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
        }`}
      >
        <Car className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
          {VEHICLE_FILTERS.map((vf) => {
            const checked = selected.includes(vf.value)
            return (
              <button
                key={vf.value}
                onClick={() => onToggle(vf.value)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                  checked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                }`}>
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                {vf.label}
              </button>
            )
          })}
          {selected.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => { onClear(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear selection
              </button>
            </>
          )}
        </div>
      )}
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

export default function AffiliatesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("browse")
  const [search, setSearch] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string[]>([])

  const debouncedSearch   = useDebounce(search, 350)
  const debouncedLocation = useDebounce(locationFilter, 350)

  const hasActiveFilters = !!locationFilter || vehicleTypeFilter.length > 0

  function toggleVehicleType(value: string) {
    setVehicleTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  function clearFilters() {
    setLocationFilter("")
    setVehicleTypeFilter([])
  }

  const { data: affiliates = [], isLoading: affiliatesLoading } = useAffiliates({
    search: debouncedSearch,
    location: debouncedLocation,
    vehicleTypes: vehicleTypeFilter,
  })
  const { data: incoming = [], isLoading: incomingLoading } = useAffiliateConnections("pending")
  const { data: sent = [], isLoading: sentLoading } = useAffiliateConnections("sent")
  const { data: connected = [], isLoading: connectedLoading } = useAffiliateConnections("connected")
  const { favoriteIds } = useAffiliateFavorites()

  const pendingCount = incoming.length
  const connectedCount = connected.length

  const browseList = useMemo(() => {
    return affiliates.filter((a) => a.connectionStatus !== "CONNECTED")
  }, [affiliates])

  const connectedList = useMemo(() => {
    return affiliates.filter((a) => a.connectionStatus === "CONNECTED")
  }, [affiliates])

  const pinnedList = useMemo(() => {
    return connectedList.filter((a) => favoriteIds.has(a.id))
  }, [connectedList, favoriteIds])

  const unpinnedList = useMemo(() => {
    return connectedList.filter((a) => !favoriteIds.has(a.id))
  }, [connectedList, favoriteIds])

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Premium header card ───────────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">

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
              { label: "On Network", value: affiliates.length, dot: "bg-blue-500",    tab: "browse"    as Tab },
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

        {/* Toolbar: tabs (left) + controls (right) */}
        <div className="flex items-center justify-between gap-4 px-6">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={pendingCount}
            connectedCount={connectedCount}
          />

          {/* Browse controls */}
          <AnimatePresence>
            {activeTab === "browse" && (
              <motion.div
                key="browse-controls"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 py-2"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search companies…"
                    className="pl-8 pr-7 h-8 w-52 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-50 placeholder:text-gray-300 transition-all duration-150"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Thin divider */}
                <div className="w-px h-5 bg-gray-200" />

                {/* Location */}
                <LocationInput value={locationFilter} onChange={setLocationFilter} />

                {/* Vehicle type */}
                <VehicleDropdown
                  selected={vehicleTypeFilter}
                  onToggle={toggleVehicleType}
                  onClear={() => setVehicleTypeFilter([])}
                />

                {/* Clear filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 h-8 px-2.5 text-[12px] text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}

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
            {connectedLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
                ))}
              </div>
            ) : connectedList.length === 0 ? (
              <EmptyState
                icon={Handshake}
                title="No connections yet"
                description="Browse the network and send connection requests to other limousine companies."
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
                    {connectedList.map((affiliate) => (
                      <AffiliateCard key={affiliate.id} affiliate={affiliate} showFavorite />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

    </div>
  )
}
