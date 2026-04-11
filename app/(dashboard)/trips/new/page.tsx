"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowLeft, Plane, Search, UserPlus, X, Plus,
  User, Users, Calendar, MapPin, Car, Building2,
  Star, Baby, Accessibility, UserCheck, ChevronDown, Ship,
  FileText, AlertTriangle, CheckCircle2, Copy, Check, Pencil,
  Clock, Navigation, ArrowRight, ArrowUpRight, DollarSign, GripVertical,
} from "lucide-react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { CreateAccountDialog } from "@/components/trips/create-account-dialog"
import { DriverPickerCard } from "@/components/trips/driver-picker-card"
import { VehiclePickerCard } from "@/components/trips/vehicle-picker-card"
import { TripSuccessModal } from "@/components/trips/trip-success-modal"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { FBOAutocomplete } from "@/components/ui/fbo-autocomplete"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { preUploadAttachment } from "@/lib/hooks/use-attachments"
import { useCustomers, useCreateCustomer } from "@/lib/hooks/use-customers"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useVehicleTypes } from "@/lib/hooks/use-vehicle-types"
import { useServiceTypes } from "@/lib/hooks/use-service-types"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { formatCurrency, generateConfirmationNumber, formatPhone, cn } from "@/lib/utils"
import { DatePickerInput } from "@/components/ui/date-picker"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { useUpsertAddress } from "@/lib/hooks/use-addresses"
import { ReservationMetadata } from "@/components/trips/reservation-metadata"
import { SendEmailModal } from "@/components/email/send-email-modal"
import { TripAttachmentsSection } from "@/components/dispatch/trip-attachments"
import { FarmOutPartnerCard } from "@/components/trips/farm-out-partner-card"
import type { Customer, Driver, Vehicle, AffiliateSearchResult, Trip, PendingFile } from "@/types"

const schema = z.object({
  customerId:           z.string().min(1, "Customer is required"),
  clientRef:            z.string().optional(),
  tripType:             z.string().min(1),
  pickupDate:           z.string().min(1, "Required"),
  pickupTime:           z.string().min(1, "Required"),
  passengerFirstName:   z.string().optional(),
  passengerLastName:    z.string().optional(),
  passengerCompany:     z.string().optional(),
  passengerPhone:       z.string().optional(),
  passengerEmail:       z.string().optional(),
  passengerCount:       z.number().int().min(1),
  luggageCount:         z.number().int().min(0).optional(),
  driverId:             z.string().optional(),
  vehicleType:          z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]).optional(),
  vehicleId:            z.string().optional(),
  secondaryDriverId:    z.string().optional(),
  secondaryVehicleId:   z.string().optional(),
  price:                z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().optional()),
  gratuityPercent:      z.preprocess((v) => (typeof v === "number" && isNaN(v) ? 0 : v), z.number().min(0).max(100)),
  tripNotes:            z.string().optional(),
  internalNotes:        z.string().optional(),
  meetAndGreet:         z.boolean(),
  childSeat:            z.boolean(),
  vip:                  z.boolean(),
})

type FormData = z.infer<typeof schema>


function CustomerSearch({ onSelect, onClear, error }: { onSelect: (c: Customer) => void; onClear?: () => void; error?: string }) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Customer | null>(null)
  const [selectedIsAffiliate, setSelectedIsAffiliate] = useState(false)
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [affiliateLoading, setAffiliateLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 250)
  const { data: customerResults = [] } = useCustomers(debouncedQuery)
  const [affiliateResults, setAffiliateResults] = useState<AffiliateSearchResult[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch affiliate search results in parallel with customers
  useEffect(() => {
    if (!debouncedQuery.trim()) { setAffiliateResults([]); return }
    fetch(`/api/affiliates/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => setAffiliateResults(Array.isArray(data) ? data : []))
      .catch(() => setAffiliateResults([]))
  }, [debouncedQuery])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function handleSelect(c: Customer, isAffiliate = false) {
    setSelected(c)
    setSelectedIsAffiliate(isAffiliate)
    setQuery(c.name)
    setOpen(false)
    onSelect(c)
  }

  async function handleSelectAffiliate(a: AffiliateSearchResult) {
    setAffiliateLoading(true)
    try {
      const res = await fetch("/api/affiliates/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateCompanyId: a.id }),
      })
      if (!res.ok) throw new Error("Failed")
      const customer: Customer = await res.json()
      handleSelect(customer, true)
    } catch {
      // fallback: show as unresolved
    } finally {
      setAffiliateLoading(false)
    }
  }

  function handleCreated(c: Customer) {
    setShowCreate(false)
    handleSelect(c)
  }

  function handleClear() {
    setSelected(null)
    setSelectedIsAffiliate(false)
    setQuery("")
    setOpen(false)
    onClear?.()
  }

  const hasCustomers = customerResults.length > 0
  const hasAffiliates = affiliateResults.length > 0
  const showDropdown = open && query.length > 0 && !selected

  return (
    <>
      <div className="flex gap-2">
        <div className="relative flex-1" ref={containerRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search by name, phone, affiliate ID…"
            className={`h-10 text-sm pl-9 pr-8 ${error ? "border-red-400" : ""}`}
          />
          {selected && (
            <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {/* Customer results */}
              {hasCustomers && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    Accounts
                  </div>
                  {customerResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelect(c)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {c.company && (
                          <div className="text-xs font-semibold text-gray-500 truncate">{c.company}</div>
                        )}
                        <div className="text-sm font-medium text-gray-900 truncate">{c.name}</div>
                        {(c.phone || c.email) && (
                          <div className="text-xs text-gray-400 truncate">{c.phone ? formatPhone(c.phone) : c.email}</div>
                        )}
                      </div>
                      {c.customerNumber && <span className="text-xs font-mono text-gray-300 flex-shrink-0">#{c.customerNumber}</span>}
                    </button>
                  ))}
                </>
              )}

              {/* Affiliate results */}
              {hasAffiliates && (
                <>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 border-t border-t-gray-100">
                    Affiliates
                  </div>
                  {affiliateResults.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => handleSelectAffiliate(a)}
                      disabled={affiliateLoading}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-600">
                        {a.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">{a.name}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {[a.city, a.state].filter(Boolean).join(", ") || a.email || ""}
                        </div>
                      </div>
                      {a.affiliateCode && (
                        <span className="text-[11px] font-mono font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                          {a.affiliateCode}
                        </span>
                      )}
                    </button>
                  ))}
                </>
              )}

              {!hasCustomers && !hasAffiliates && (
                <div className="px-4 py-3 text-sm text-gray-400">No accounts found</div>
              )}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setShowCreate(true)}
          className="h-10 px-3 text-sm text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200 gap-1.5 flex-shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          New Account
        </Button>
      </div>

      {selected && (
        <div className={`mt-2.5 flex items-center gap-3 rounded-xl px-4 py-3 border ${
          selectedIsAffiliate
            ? "bg-blue-50 border-blue-100"
            : "bg-blue-50 border-blue-100"
        }`}>
          <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${
            selectedIsAffiliate ? "rounded-xl bg-blue-200 text-xs font-bold text-blue-700" : "rounded-full bg-blue-200"
          }`}>
            {selectedIsAffiliate
              ? selected.name.slice(0, 2).toUpperCase()
              : <User className="w-4 h-4 text-blue-600" />}
          </div>
          <div className="flex-1 min-w-0">
            {!selectedIsAffiliate && selected.company && (
              <div className="text-xs font-semibold text-blue-500 truncate">{selected.company}</div>
            )}
            <div className="text-sm font-semibold text-gray-900">{selected.name}</div>
            <div className="text-xs text-gray-500 truncate">
              {selectedIsAffiliate ? "Affiliate account" : (selected.phone ? formatPhone(selected.phone) : selected.email || "")}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {selected.customerNumber && <div className="text-xs font-mono text-blue-400">#{selected.customerNumber}</div>}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {showCreate && <CreateAccountDialog onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </>
  )
}


type StopLocationType = "address" | "airport" | "seaport" | "fbo"
type StopRole = "pickup" | "stop" | "wait" | "drop"

interface StopEntry {
  id: string
  locType: StopLocationType
  role: StopRole
  address: string
  notes: string
  flightNumber: string
  // Structured address fields
  locationName?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  timeIn?: string
  // FBO-specific
  tailNumber?: string
  // Seaport fields
  seaportCode?: string
  portName?: string
  cruiseShipName?: string
  cruiseLineName?: string
  arrivingDepartingTo?: string
  seaportInstructions?: string
  // Airport fields
  airportCode?: string
  airportName?: string
  airlineCode?: string
  airlineName?: string
  arrDep?: string
  terminalGate?: string
  airportInstructions?: string
  etaEtd?: string
  meetOption?: string
  flightTracking?: {
    status?: string | null
    estimatedArrival?: string | null
    actualArrival?: string | null
    scheduledArrival?: string | null
    destinationTimezone?: string | null
    arrivalGate?: string | null
    baggageClaim?: string | null
    arrivalDelayMinutes?: number | null
    loading?: boolean
    error?: string
    lastFetched?: number
  }
}

const STOP_LOC_TABS: { type: StopLocationType; label: string; Icon: React.ElementType }[] = [
  { type: "address", label: "Address", Icon: MapPin },
  { type: "airport", label: "Airport", Icon: Plane },
  { type: "seaport", label: "Seaport", Icon: Ship },
  { type: "fbo",     label: "FBO",     Icon: Building2 },
]

const STOP_ROLES: { value: StopRole; label: string }[] = [
  { value: "pickup", label: "Pick-up" },
  { value: "drop",   label: "Drop-off" },
  { value: "stop",   label: "Stop" },
  { value: "wait",   label: "Wait" },
]

const STOP_ROLE_STYLE: Record<StopRole, { dot: string; pill: string }> = {
  pickup: { dot: "bg-emerald-500 ring-emerald-100", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  drop:   { dot: "bg-red-500 ring-red-100",         pill: "bg-red-50 text-red-700 border-red-200" },
  stop:   { dot: "bg-blue-500 ring-blue-100",       pill: "bg-blue-50 text-blue-700 border-blue-200" },
  wait:   { dot: "bg-amber-500 ring-amber-100",     pill: "bg-amber-50 text-amber-700 border-amber-200" },
}

const ROLE_PREFIX: Record<StopRole, string> = {
  pickup: "PU", drop: "DO", stop: "ST", wait: "WT",
}

const ROLE_ROW_BG: Record<StopRole, string> = {
  pickup: "bg-sky-50 text-sky-900 border-sky-100",
  drop:   "bg-red-50 text-red-900 border-red-100",
  stop:   "bg-gray-50 text-gray-800 border-gray-100",
  wait:   "bg-amber-50 text-amber-900 border-amber-100",
}

const STATE_OPTIONS = [
  // US States
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "Dist. of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  // Canadian Provinces
  { code: "AB", name: "Alberta" }, { code: "BC", name: "British Columbia" }, { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" }, { code: "NL", name: "Newfoundland" }, { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" }, { code: "NU", name: "Nunavut" }, { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" }, { code: "QC", name: "Quebec" }, { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
]

const AIRPORT_OPTIONS: { iata: string; name: string; city: string; country: string }[] = [
  // United States
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "US" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "US" },
  { iata: "ORD", name: "Chicago O'Hare International Airport", city: "Chicago", country: "US" },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "US" },
  { iata: "DEN", name: "Denver International Airport", city: "Denver", country: "US" },
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "US" },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "US" },
  { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "US" },
  { iata: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "US" },
  { iata: "MCO", name: "Orlando International Airport", city: "Orlando", country: "US" },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "US" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "US" },
  { iata: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "US" },
  { iata: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "US" },
  { iata: "BOS", name: "Boston Logan International Airport", city: "Boston", country: "US" },
  { iata: "MSP", name: "Minneapolis-Saint Paul International Airport", city: "Minneapolis", country: "US" },
  { iata: "DTW", name: "Detroit Metropolitan Wayne County Airport", city: "Detroit", country: "US" },
  { iata: "FLL", name: "Fort Lauderdale-Hollywood International Airport", city: "Fort Lauderdale", country: "US" },
  { iata: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "US" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "US" },
  { iata: "BWI", name: "Baltimore/Washington International Airport", city: "Baltimore", country: "US" },
  { iata: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington DC", country: "US" },
  { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington DC", country: "US" },
  { iata: "MDW", name: "Chicago Midway International Airport", city: "Chicago", country: "US" },
  { iata: "SAN", name: "San Diego International Airport", city: "San Diego", country: "US" },
  { iata: "TPA", name: "Tampa International Airport", city: "Tampa", country: "US" },
  { iata: "BNA", name: "Nashville International Airport", city: "Nashville", country: "US" },
  { iata: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "US" },
  { iata: "STL", name: "St. Louis Lambert International Airport", city: "St. Louis", country: "US" },
  { iata: "SLC", name: "Salt Lake City International Airport", city: "Salt Lake City", country: "US" },
  { iata: "MSY", name: "Louis Armstrong New Orleans International Airport", city: "New Orleans", country: "US" },
  { iata: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "US" },
  { iata: "RSW", name: "Southwest Florida International Airport", city: "Fort Myers", country: "US" },
  { iata: "PBI", name: "Palm Beach International Airport", city: "West Palm Beach", country: "US" },
  { iata: "DAL", name: "Dallas Love Field", city: "Dallas", country: "US" },
  { iata: "HOU", name: "Houston Hobby Airport", city: "Houston", country: "US" },
  { iata: "MCI", name: "Kansas City International Airport", city: "Kansas City", country: "US" },
  { iata: "OAK", name: "Oakland International Airport", city: "Oakland", country: "US" },
  { iata: "SJC", name: "San Jose International Airport", city: "San Jose", country: "US" },
  { iata: "BUR", name: "Hollywood Burbank Airport", city: "Burbank", country: "US" },
  { iata: "SNA", name: "John Wayne Airport", city: "Orange County", country: "US" },
  { iata: "LGB", name: "Long Beach Airport", city: "Long Beach", country: "US" },
  { iata: "ONT", name: "Ontario International Airport", city: "Ontario", country: "US" },
  { iata: "SMF", name: "Sacramento International Airport", city: "Sacramento", country: "US" },
  { iata: "RDU", name: "Raleigh-Durham International Airport", city: "Raleigh", country: "US" },
  { iata: "MEM", name: "Memphis International Airport", city: "Memphis", country: "US" },
  { iata: "IND", name: "Indianapolis International Airport", city: "Indianapolis", country: "US" },
  { iata: "CMH", name: "John Glenn Columbus International Airport", city: "Columbus", country: "US" },
  { iata: "PIT", name: "Pittsburgh International Airport", city: "Pittsburgh", country: "US" },
  { iata: "CLE", name: "Cleveland Hopkins International Airport", city: "Cleveland", country: "US" },
  { iata: "MKE", name: "Milwaukee Mitchell International Airport", city: "Milwaukee", country: "US" },
  { iata: "OMA", name: "Eppley Airfield", city: "Omaha", country: "US" },
  { iata: "BDL", name: "Bradley International Airport", city: "Hartford", country: "US" },
  { iata: "PVD", name: "T.F. Green Airport", city: "Providence", country: "US" },
  { iata: "BUF", name: "Buffalo Niagara International Airport", city: "Buffalo", country: "US" },
  { iata: "ALB", name: "Albany International Airport", city: "Albany", country: "US" },
  { iata: "ABQ", name: "Albuquerque International Sunport", city: "Albuquerque", country: "US" },
  { iata: "TUS", name: "Tucson International Airport", city: "Tucson", country: "US" },
  { iata: "ELP", name: "El Paso International Airport", city: "El Paso", country: "US" },
  { iata: "PDX", name: "Portland International Airport", city: "Portland", country: "US" },
  { iata: "RNO", name: "Reno-Tahoe International Airport", city: "Reno", country: "US" },
  { iata: "BOI", name: "Boise Airport", city: "Boise", country: "US" },
  { iata: "GEG", name: "Spokane International Airport", city: "Spokane", country: "US" },
  { iata: "ANC", name: "Ted Stevens Anchorage International Airport", city: "Anchorage", country: "US" },
  { iata: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "US" },
  { iata: "OGG", name: "Kahului Airport", city: "Maui", country: "US" },
  { iata: "KOA", name: "Ellison Onizuka Kona International Airport", city: "Kona", country: "US" },
  { iata: "LIH", name: "Lihue Airport", city: "Kauai", country: "US" },
  { iata: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "US" },
  { iata: "JAX", name: "Jacksonville International Airport", city: "Jacksonville", country: "US" },
  { iata: "SAV", name: "Savannah/Hilton Head International Airport", city: "Savannah", country: "US" },
  { iata: "CHS", name: "Charleston International Airport", city: "Charleston", country: "US" },
  { iata: "MYR", name: "Myrtle Beach International Airport", city: "Myrtle Beach", country: "US" },
  { iata: "GSP", name: "Greenville-Spartanburg International Airport", city: "Greenville", country: "US" },
  { iata: "AVL", name: "Asheville Regional Airport", city: "Asheville", country: "US" },
  { iata: "ORF", name: "Norfolk International Airport", city: "Norfolk", country: "US" },
  { iata: "RIC", name: "Richmond International Airport", city: "Richmond", country: "US" },
  { iata: "PSP", name: "Palm Springs International Airport", city: "Palm Springs", country: "US" },
  { iata: "SRQ", name: "Sarasota Bradenton International Airport", city: "Sarasota", country: "US" },
  { iata: "PIE", name: "St. Pete-Clearwater International Airport", city: "St. Petersburg", country: "US" },
  { iata: "DAB", name: "Daytona Beach International Airport", city: "Daytona Beach", country: "US" },
  { iata: "PNS", name: "Pensacola International Airport", city: "Pensacola", country: "US" },
  { iata: "TLH", name: "Tallahassee International Airport", city: "Tallahassee", country: "US" },
  { iata: "VPS", name: "Destin-Fort Walton Beach Airport", city: "Fort Walton Beach", country: "US" },
  { iata: "BZN", name: "Bozeman Yellowstone International Airport", city: "Bozeman", country: "US" },
  { iata: "HPN", name: "Westchester County Airport", city: "White Plains", country: "US" },
  { iata: "ISP", name: "Long Island MacArthur Airport", city: "Islip", country: "US" },
  { iata: "FAT", name: "Fresno Yosemite International Airport", city: "Fresno", country: "US" },
  // Canada
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "CA" },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International Airport", city: "Montreal", country: "CA" },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "CA" },
  { iata: "YYC", name: "Calgary International Airport", city: "Calgary", country: "CA" },
  { iata: "YEG", name: "Edmonton International Airport", city: "Edmonton", country: "CA" },
  { iata: "YOW", name: "Ottawa Macdonald-Cartier International Airport", city: "Ottawa", country: "CA" },
  { iata: "YHZ", name: "Halifax Stanfield International Airport", city: "Halifax", country: "CA" },
  { iata: "YWG", name: "Winnipeg Richardson International Airport", city: "Winnipeg", country: "CA" },
  { iata: "YQB", name: "Québec City Jean Lesage International Airport", city: "Quebec City", country: "CA" },
  // Mexico & Central America
  { iata: "MEX", name: "Benito Juárez International Airport", city: "Mexico City", country: "MX" },
  { iata: "CUN", name: "Cancún International Airport", city: "Cancun", country: "MX" },
  { iata: "GDL", name: "Don Miguel Hidalgo y Costilla International Airport", city: "Guadalajara", country: "MX" },
  { iata: "MTY", name: "General Mariano Escobedo International Airport", city: "Monterrey", country: "MX" },
  { iata: "SJD", name: "Los Cabos International Airport", city: "Los Cabos", country: "MX" },
  { iata: "PVR", name: "Licenciado Gustavo Díaz Ordaz International Airport", city: "Puerto Vallarta", country: "MX" },
  { iata: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "PA" },
  { iata: "SJO", name: "Juan Santamaría International Airport", city: "San Jose", country: "CR" },
  { iata: "GUA", name: "La Aurora International Airport", city: "Guatemala City", country: "GT" },
  { iata: "SAL", name: "El Salvador International Airport", city: "San Salvador", country: "SV" },
  // Caribbean
  { iata: "HAV", name: "José Martí International Airport", city: "Havana", country: "CU" },
  { iata: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "BS" },
  { iata: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "JM" },
  { iata: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "JM" },
  { iata: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "BB" },
  { iata: "AUA", name: "Queen Beatrix International Airport", city: "Oranjestad", country: "AW" },
  { iata: "SXM", name: "Princess Juliana International Airport", city: "Sint Maarten", country: "SX" },
  { iata: "POS", name: "Piarco International Airport", city: "Port of Spain", country: "TT" },
  // South America
  { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "BR" },
  { iata: "GIG", name: "Rio de Janeiro Galeão International Airport", city: "Rio de Janeiro", country: "BR" },
  { iata: "BSB", name: "Brasília International Airport", city: "Brasília", country: "BR" },
  { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "AR" },
  { iata: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "CL" },
  { iata: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "PE" },
  { iata: "BOG", name: "El Dorado International Airport", city: "Bogota", country: "CO" },
  { iata: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "EC" },
  { iata: "GYE", name: "José Joaquín de Olmedo International Airport", city: "Guayaquil", country: "EC" },
  { iata: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "VE" },
  { iata: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "UY" },
  // Europe
  { iata: "LHR", name: "London Heathrow Airport", city: "London", country: "GB" },
  { iata: "LGW", name: "London Gatwick Airport", city: "London", country: "GB" },
  { iata: "STN", name: "London Stansted Airport", city: "London", country: "GB" },
  { iata: "LCY", name: "London City Airport", city: "London", country: "GB" },
  { iata: "MAN", name: "Manchester Airport", city: "Manchester", country: "GB" },
  { iata: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "GB" },
  { iata: "GLA", name: "Glasgow International Airport", city: "Glasgow", country: "GB" },
  { iata: "BHX", name: "Birmingham Airport", city: "Birmingham", country: "GB" },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "IE" },
  { iata: "CDG", name: "Paris Charles de Gaulle Airport", city: "Paris", country: "FR" },
  { iata: "ORY", name: "Paris Orly Airport", city: "Paris", country: "FR" },
  { iata: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "FR" },
  { iata: "LYS", name: "Lyon-Saint Exupéry Airport", city: "Lyon", country: "FR" },
  { iata: "MRS", name: "Marseille Provence Airport", city: "Marseille", country: "FR" },
  { iata: "AMS", name: "Amsterdam Schiphol Airport", city: "Amsterdam", country: "NL" },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "DE" },
  { iata: "MUC", name: "Munich Airport", city: "Munich", country: "DE" },
  { iata: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "DE" },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "DE" },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "DE" },
  { iata: "CGN", name: "Cologne Bonn Airport", city: "Cologne", country: "DE" },
  { iata: "STR", name: "Stuttgart Airport", city: "Stuttgart", country: "DE" },
  { iata: "ZRH", name: "Zürich Airport", city: "Zurich", country: "CH" },
  { iata: "GVA", name: "Geneva Airport", city: "Geneva", country: "CH" },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "AT" },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "BE" },
  { iata: "BCN", name: "Barcelona El Prat Airport", city: "Barcelona", country: "ES" },
  { iata: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "ES" },
  { iata: "PMI", name: "Palma de Mallorca Airport", city: "Palma", country: "ES" },
  { iata: "AGP", name: "Málaga Airport", city: "Malaga", country: "ES" },
  { iata: "VLC", name: "Valencia Airport", city: "Valencia", country: "ES" },
  { iata: "FCO", name: "Rome Fiumicino Airport", city: "Rome", country: "IT" },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "IT" },
  { iata: "LIN", name: "Milan Linate Airport", city: "Milan", country: "IT" },
  { iata: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "IT" },
  { iata: "NAP", name: "Naples International Airport", city: "Naples", country: "IT" },
  { iata: "FLR", name: "Florence Peretola Airport", city: "Florence", country: "IT" },
  { iata: "LIS", name: "Lisbon Humberto Delgado Airport", city: "Lisbon", country: "PT" },
  { iata: "OPO", name: "Porto Francisco Sá Carneiro Airport", city: "Porto", country: "PT" },
  { iata: "FAO", name: "Faro Airport", city: "Faro", country: "PT" },
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "GR" },
  { iata: "HER", name: "Heraklion Nikos Kazantzakis Airport", city: "Heraklion", country: "GR" },
  { iata: "RHO", name: "Rhodes Diagoras Airport", city: "Rhodes", country: "GR" },
  { iata: "SKG", name: "Thessaloniki Macedonia International Airport", city: "Thessaloniki", country: "GR" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "TR" },
  { iata: "SAW", name: "Istanbul Sabiha Gökçen International Airport", city: "Istanbul", country: "TR" },
  { iata: "AYT", name: "Antalya Airport", city: "Antalya", country: "TR" },
  { iata: "ESB", name: "Ankara Esenboğa Airport", city: "Ankara", country: "TR" },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "DK" },
  { iata: "OSL", name: "Oslo Gardermoen Airport", city: "Oslo", country: "NO" },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "SE" },
  { iata: "GOT", name: "Gothenburg Landvetter Airport", city: "Gothenburg", country: "SE" },
  { iata: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "FI" },
  { iata: "RIX", name: "Riga International Airport", city: "Riga", country: "LV" },
  { iata: "TLL", name: "Lennart Meri Tallinn Airport", city: "Tallinn", country: "EE" },
  { iata: "VNO", name: "Vilnius Airport", city: "Vilnius", country: "LT" },
  { iata: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "PL" },
  { iata: "KRK", name: "Kraków John Paul II International Airport", city: "Krakow", country: "PL" },
  { iata: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "CZ" },
  { iata: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "HU" },
  { iata: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "RO" },
  { iata: "SOF", name: "Sofia Airport", city: "Sofia", country: "BG" },
  { iata: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "RS" },
  { iata: "ZAG", name: "Zagreb Airport", city: "Zagreb", country: "HR" },
  { iata: "SPU", name: "Split Airport", city: "Split", country: "HR" },
  { iata: "DBV", name: "Dubrovnik Airport", city: "Dubrovnik", country: "HR" },
  { iata: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "SI" },
  { iata: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "RU" },
  { iata: "DME", name: "Domodedovo International Airport", city: "Moscow", country: "RU" },
  { iata: "LED", name: "Pulkovo Airport", city: "St. Petersburg", country: "RU" },
  { iata: "KBP", name: "Kyiv Boryspil International Airport", city: "Kyiv", country: "UA" },
  { iata: "TBS", name: "Tbilisi International Airport", city: "Tbilisi", country: "GE" },
  { iata: "EVN", name: "Zvartnots International Airport", city: "Yerevan", country: "AM" },
  { iata: "GYD", name: "Heydar Aliyev International Airport", city: "Baku", country: "AZ" },
  // Middle East
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "AE" },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "AE" },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "QA" },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "BH" },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "KW" },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "SA" },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "SA" },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "OM" },
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "JO" },
  { iata: "BEY", name: "Beirut Rafic Hariri International Airport", city: "Beirut", country: "LB" },
  { iata: "TLV", name: "Ben Gurion International Airport", city: "Tel Aviv", country: "IL" },
  // Africa
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "EG" },
  { iata: "HRG", name: "Hurghada International Airport", city: "Hurghada", country: "EG" },
  { iata: "SSH", name: "Sharm el-Sheikh International Airport", city: "Sharm el-Sheikh", country: "EG" },
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "MA" },
  { iata: "RAK", name: "Marrakesh Menara Airport", city: "Marrakesh", country: "MA" },
  { iata: "TUN", name: "Tunis-Carthage International Airport", city: "Tunis", country: "TN" },
  { iata: "ADD", name: "Bole International Airport", city: "Addis Ababa", country: "ET" },
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "KE" },
  { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "ZA" },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "ZA" },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "ZA" },
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "NG" },
  { iata: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "NG" },
  { iata: "ACC", name: "Kotoka International Airport", city: "Accra", country: "GH" },
  { iata: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "TZ" },
  // Asia-Pacific
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "JP" },
  { iata: "HND", name: "Haneda Airport", city: "Tokyo", country: "JP" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "JP" },
  { iata: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "JP" },
  { iata: "CTS", name: "New Chitose Airport", city: "Sapporo", country: "JP" },
  { iata: "FUK", name: "Fukuoka Airport", city: "Fukuoka", country: "JP" },
  { iata: "OKA", name: "Naha Airport", city: "Okinawa", country: "JP" },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "KR" },
  { iata: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "KR" },
  { iata: "PUS", name: "Gimhae International Airport", city: "Busan", country: "KR" },
  { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "CN" },
  { iata: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "CN" },
  { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "CN" },
  { iata: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "CN" },
  { iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "CN" },
  { iata: "SZX", name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "CN" },
  { iata: "CTU", name: "Chengdu Tianfu International Airport", city: "Chengdu", country: "CN" },
  { iata: "HGH", name: "Hangzhou Xiaoshan International Airport", city: "Hangzhou", country: "CN" },
  { iata: "XMN", name: "Xiamen Gaoqi International Airport", city: "Xiamen", country: "CN" },
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "HK" },
  { iata: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "TW" },
  { iata: "TSA", name: "Taipei Songshan Airport", city: "Taipei", country: "TW" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "TH" },
  { iata: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "TH" },
  { iata: "HKT", name: "Phuket International Airport", city: "Phuket", country: "TH" },
  { iata: "CNX", name: "Chiang Mai International Airport", city: "Chiang Mai", country: "TH" },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "VN" },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "VN" },
  { iata: "DAD", name: "Da Nang International Airport", city: "Da Nang", country: "VN" },
  { iata: "REP", name: "Siem Reap International Airport", city: "Siem Reap", country: "KH" },
  { iata: "PNH", name: "Phnom Penh International Airport", city: "Phnom Penh", country: "KH" },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "MY" },
  { iata: "PEN", name: "Penang International Airport", city: "Penang", country: "MY" },
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "SG" },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "ID" },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "ID" },
  { iata: "SUB", name: "Juanda International Airport", city: "Surabaya", country: "ID" },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "PH" },
  { iata: "CEB", name: "Mactan-Cebu International Airport", city: "Cebu", country: "PH" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "IN" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "Delhi", country: "IN" },
  { iata: "MAA", name: "Chennai International Airport", city: "Chennai", country: "IN" },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", country: "IN" },
  { iata: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "IN" },
  { iata: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "IN" },
  { iata: "COK", name: "Cochin International Airport", city: "Kochi", country: "IN" },
  { iata: "AMD", name: "Sardar Vallabhbhai Patel International Airport", city: "Ahmedabad", country: "IN" },
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "LK" },
  { iata: "MLE", name: "Ibrahim Nasir International Airport", city: "Malé", country: "MV" },
  { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "BD" },
  { iata: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "NP" },
  { iata: "ISB", name: "Islamabad International Airport", city: "Islamabad", country: "PK" },
  { iata: "LHE", name: "Allama Iqbal International Airport", city: "Lahore", country: "PK" },
  { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "PK" },
  { iata: "TAS", name: "Tashkent International Airport", city: "Tashkent", country: "UZ" },
  { iata: "ALA", name: "Almaty International Airport", city: "Almaty", country: "KZ" },
  // Australia & NZ
  { iata: "SYD", name: "Sydney Kingsford Smith International Airport", city: "Sydney", country: "AU" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "AU" },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "AU" },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "AU" },
  { iata: "ADL", name: "Adelaide Airport", city: "Adelaide", country: "AU" },
  { iata: "OOL", name: "Gold Coast Airport", city: "Gold Coast", country: "AU" },
  { iata: "CNS", name: "Cairns Airport", city: "Cairns", country: "AU" },
  { iata: "AKL", name: "Auckland International Airport", city: "Auckland", country: "NZ" },
  { iata: "WLG", name: "Wellington International Airport", city: "Wellington", country: "NZ" },
  { iata: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "NZ" },
  { iata: "NAN", name: "Nadi International Airport", city: "Nadi", country: "FJ" },
]

function AirportPicker({
  codeValue, nameValue,
  onCodeChange, onNameChange,
  codeError,
}: {
  codeValue: string
  nameValue: string
  onCodeChange: (v: string) => void
  onNameChange: (v: string) => void
  codeError?: boolean
}) {
  const [codeQuery, setCodeQuery] = useState(codeValue)
  const [nameQuery, setNameQuery] = useState(nameValue)
  const [codeOpen, setCodeOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [codeDropStyle, setCodeDropStyle] = useState<React.CSSProperties>({})
  const [nameDropStyle, setNameDropStyle] = useState<React.CSSProperties>({})
  const codeRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const codeDropRef = useRef<HTMLDivElement>(null)
  const nameDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setCodeQuery(codeValue) }, [codeValue])
  useEffect(() => { setNameQuery(nameValue) }, [nameValue])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (codeRef.current && !codeRef.current.contains(t) && codeDropRef.current && !codeDropRef.current.contains(t)) setCodeOpen(false)
      if (nameRef.current && !nameRef.current.contains(t) && nameDropRef.current && !nameDropRef.current.contains(t)) setNameOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const codeFiltered = codeQuery.trim()
    ? AIRPORT_OPTIONS.filter((a) =>
        a.iata.toLowerCase().startsWith(codeQuery.toLowerCase()) ||
        a.iata.toLowerCase().includes(codeQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(codeQuery.toLowerCase())
      ).slice(0, 10)
    : AIRPORT_OPTIONS.slice(0, 10)

  const nameFiltered = nameQuery.trim()
    ? AIRPORT_OPTIONS.filter((a) =>
        a.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(nameQuery.toLowerCase()) ||
        a.iata.toLowerCase().includes(nameQuery.toLowerCase())
      ).slice(0, 10)
    : []

  function openCodeDrop() {
    if (codeRef.current) {
      const rect = codeRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 250
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 320), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 320), zIndex: 9999 }
      setCodeDropStyle(style)
    }
    setCodeOpen(true)
  }

  function openNameDrop() {
    if (nameRef.current) {
      const rect = nameRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 250
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 360), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 360), zIndex: 9999 }
      setNameDropStyle(style)
    }
    setNameOpen(true)
  }

  function selectAirport(airport: typeof AIRPORT_OPTIONS[0]) {
    setCodeQuery(airport.iata)
    setNameQuery(airport.name)
    onCodeChange(airport.iata)
    onNameChange(airport.name)
    setCodeOpen(false)
    setNameOpen(false)
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* Code field */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Airport Code</Label>
        <div ref={codeRef} className="relative">
          <input
            value={codeQuery}
            onChange={(e) => { setCodeQuery(e.target.value); onCodeChange(e.target.value); openCodeDrop() }}
            onFocus={openCodeDrop}
            autoComplete="new-password"
            className={`w-full h-9 text-sm border rounded-md pl-2.5 pr-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800 ${codeError ? "border-red-400" : "border-gray-200"}`}
          />
          {codeOpen && codeFiltered.length > 0 && createPortal(
            <div ref={codeDropRef} style={codeDropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {codeFiltered.map((a) => (
                  <button
                    key={a.iata}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectAirport(a) }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${a.iata === codeValue ? "bg-blue-50" : ""}`}
                  >
                    <span className="text-xs font-mono font-bold text-gray-900 w-8 flex-shrink-0">{a.iata}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 truncate">{a.name}</div>
                      <div className="text-[10px] text-gray-400">{a.city}, {a.country}</div>
                    </div>
                    {a.iata === codeValue && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
      {/* Name field */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Airport Name</Label>
        <div ref={nameRef} className="relative">
          <input
            value={nameQuery}
            onChange={(e) => { setNameQuery(e.target.value); onNameChange(e.target.value); if (e.target.value) { openNameDrop() } else { setNameOpen(false) } }}
            onFocus={() => { if (nameQuery) openNameDrop() }}
            autoComplete="new-password"
            className="w-full h-9 text-sm border border-gray-200 rounded-md pl-2.5 pr-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
          />
          {nameOpen && nameFiltered.length > 0 && createPortal(
            <div ref={nameDropRef} style={nameDropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {nameFiltered.map((a) => (
                  <button
                    key={a.iata}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); selectAirport(a) }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${a.iata === codeValue ? "bg-blue-50" : ""}`}
                  >
                    <span className="text-xs font-mono font-bold text-gray-900 w-8 flex-shrink-0">{a.iata}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 truncate">{a.name}</div>
                      <div className="text-[10px] text-gray-400">{a.city}, {a.country}</div>
                    </div>
                    {a.iata === codeValue && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}

const AIRLINE_OPTIONS: { iata: string; name: string; country: string }[] = [
  // North America
  { iata: "AA", name: "American Airlines", country: "US" },
  { iata: "DL", name: "Delta Air Lines", country: "US" },
  { iata: "UA", name: "United Airlines", country: "US" },
  { iata: "WN", name: "Southwest Airlines", country: "US" },
  { iata: "B6", name: "JetBlue Airways", country: "US" },
  { iata: "AS", name: "Alaska Airlines", country: "US" },
  { iata: "NK", name: "Spirit Airlines", country: "US" },
  { iata: "F9", name: "Frontier Airlines", country: "US" },
  { iata: "G4", name: "Allegiant Air", country: "US" },
  { iata: "SY", name: "Sun Country Airlines", country: "US" },
  { iata: "HA", name: "Hawaiian Airlines", country: "US" },
  { iata: "MX", name: "Breeze Airways", country: "US" },
  { iata: "AC", name: "Air Canada", country: "CA" },
  { iata: "WS", name: "WestJet", country: "CA" },
  { iata: "AM", name: "Aeromexico", country: "MX" },
  { iata: "VB", name: "VivaAerobus", country: "MX" },
  { iata: "Y4", name: "Volaris", country: "MX" },
  // South America
  { iata: "LA", name: "LATAM Airlines", country: "CL" },
  { iata: "G3", name: "GOL Linhas Aéreas", country: "BR" },
  { iata: "AD", name: "Azul Brazilian Airlines", country: "BR" },
  { iata: "AR", name: "Aerolíneas Argentinas", country: "AR" },
  { iata: "AV", name: "Avianca", country: "CO" },
  { iata: "H2", name: "Sky Airline", country: "CL" },
  // Europe
  { iata: "BA", name: "British Airways", country: "GB" },
  { iata: "VS", name: "Virgin Atlantic", country: "GB" },
  { iata: "EZ", name: "easyJet", country: "GB" },
  { iata: "FR", name: "Ryanair", country: "IE" },
  { iata: "EI", name: "Aer Lingus", country: "IE" },
  { iata: "AF", name: "Air France", country: "FR" },
  { iata: "U2", name: "easyJet Europe", country: "FR" },
  { iata: "TO", name: "Transavia France", country: "FR" },
  { iata: "LH", name: "Lufthansa", country: "DE" },
  { iata: "DE", name: "Condor", country: "DE" },
  { iata: "EW", name: "Eurowings", country: "DE" },
  { iata: "KL", name: "KLM Royal Dutch Airlines", country: "NL" },
  { iata: "HV", name: "Transavia Netherlands", country: "NL" },
  { iata: "IB", name: "Iberia", country: "ES" },
  { iata: "VY", name: "Vueling Airlines", country: "ES" },
  { iata: "UX", name: "Air Europa", country: "ES" },
  { iata: "AZ", name: "ITA Airways", country: "IT" },
  { iata: "IG", name: "Neos Air", country: "IT" },
  { iata: "TP", name: "TAP Air Portugal", country: "PT" },
  { iata: "LX", name: "Swiss International Air Lines", country: "CH" },
  { iata: "OS", name: "Austrian Airlines", country: "AT" },
  { iata: "SN", name: "Brussels Airlines", country: "BE" },
  { iata: "SK", name: "Scandinavian Airlines", country: "SE" },
  { iata: "DY", name: "Norwegian Air Shuttle", country: "NO" },
  { iata: "AY", name: "Finnair", country: "FI" },
  { iata: "TK", name: "Turkish Airlines", country: "TR" },
  { iata: "PC", name: "Pegasus Airlines", country: "TR" },
  { iata: "A3", name: "Aegean Airlines", country: "GR" },
  { iata: "OK", name: "Czech Airlines", country: "CZ" },
  { iata: "LO", name: "LOT Polish Airlines", country: "PL" },
  { iata: "FB", name: "Bulgaria Air", country: "BG" },
  { iata: "RO", name: "TAROM", country: "RO" },
  { iata: "JP", name: "Adria Airways", country: "SI" },
  { iata: "SU", name: "Aeroflot", country: "RU" },
  { iata: "S7", name: "S7 Airlines", country: "RU" },
  { iata: "U6", name: "Ural Airlines", country: "RU" },
  { iata: "PS", name: "Ukraine International Airlines", country: "UA" },
  { iata: "W6", name: "Wizz Air", country: "HU" },
  { iata: "W9", name: "Wizz Air UK", country: "GB" },
  { iata: "VW", name: "Aeromar", country: "MX" },
  // Middle East
  { iata: "EK", name: "Emirates", country: "AE" },
  { iata: "EY", name: "Etihad Airways", country: "AE" },
  { iata: "FZ", name: "flydubai", country: "AE" },
  { iata: "QR", name: "Qatar Airways", country: "QA" },
  { iata: "GF", name: "Gulf Air", country: "BH" },
  { iata: "KU", name: "Kuwait Airways", country: "KW" },
  { iata: "SV", name: "Saudia", country: "SA" },
  { iata: "XY", name: "flynas", country: "SA" },
  { iata: "WY", name: "Oman Air", country: "OM" },
  { iata: "RJ", name: "Royal Jordanian", country: "JO" },
  { iata: "ME", name: "Middle East Airlines", country: "LB" },
  { iata: "LY", name: "El Al Israel Airlines", country: "IL" },
  // Africa
  { iata: "ET", name: "Ethiopian Airlines", country: "ET" },
  { iata: "KQ", name: "Kenya Airways", country: "KE" },
  { iata: "MS", name: "EgyptAir", country: "EG" },
  { iata: "AT", name: "Royal Air Maroc", country: "MA" },
  { iata: "SA", name: "South African Airways", country: "ZA" },
  { iata: "FA", name: "Safair", country: "ZA" },
  // Asia
  { iata: "JL", name: "Japan Airlines", country: "JP" },
  { iata: "NH", name: "All Nippon Airways", country: "JP" },
  { iata: "MM", name: "Peach Aviation", country: "JP" },
  { iata: "7C", name: "Jeju Air", country: "KR" },
  { iata: "KE", name: "Korean Air", country: "KR" },
  { iata: "OZ", name: "Asiana Airlines", country: "KR" },
  { iata: "CA", name: "Air China", country: "CN" },
  { iata: "MU", name: "China Eastern Airlines", country: "CN" },
  { iata: "CZ", name: "China Southern Airlines", country: "CN" },
  { iata: "HU", name: "Hainan Airlines", country: "CN" },
  { iata: "3U", name: "Sichuan Airlines", country: "CN" },
  { iata: "CX", name: "Cathay Pacific", country: "HK" },
  { iata: "CI", name: "China Airlines", country: "TW" },
  { iata: "BR", name: "EVA Air", country: "TW" },
  { iata: "TG", name: "Thai Airways", country: "TH" },
  { iata: "FD", name: "Thai AirAsia", country: "TH" },
  { iata: "PG", name: "Bangkok Airways", country: "TH" },
  { iata: "VN", name: "Vietnam Airlines", country: "VN" },
  { iata: "VJ", name: "VietJet Air", country: "VN" },
  { iata: "QH", name: "Bamboo Airways", country: "VN" },
  { iata: "MH", name: "Malaysia Airlines", country: "MY" },
  { iata: "AK", name: "AirAsia", country: "MY" },
  { iata: "SQ", name: "Singapore Airlines", country: "SG" },
  { iata: "TR", name: "Scoot", country: "SG" },
  { iata: "MI", name: "SilkAir", country: "SG" },
  { iata: "GA", name: "Garuda Indonesia", country: "ID" },
  { iata: "JT", name: "Lion Air", country: "ID" },
  { iata: "QG", name: "Citilink", country: "ID" },
  { iata: "PR", name: "Philippine Airlines", country: "PH" },
  { iata: "Z2", name: "Philippines AirAsia", country: "PH" },
  { iata: "5J", name: "Cebu Pacific", country: "PH" },
  { iata: "AI", name: "Air India", country: "IN" },
  { iata: "6E", name: "IndiGo", country: "IN" },
  { iata: "SG", name: "SpiceJet", country: "IN" },
  { iata: "IX", name: "Air India Express", country: "IN" },
  { iata: "UL", name: "SriLankan Airlines", country: "LK" },
  { iata: "PK", name: "Pakistan International Airlines", country: "PK" },
  { iata: "PA", name: "airblue", country: "PK" },
  // Oceania
  { iata: "QF", name: "Qantas", country: "AU" },
  { iata: "JQ", name: "Jetstar Airways", country: "AU" },
  { iata: "VA", name: "Virgin Australia", country: "AU" },
  { iata: "NZ", name: "Air New Zealand", country: "NZ" },
  { iata: "FJ", name: "Fiji Airways", country: "FJ" },
  // Caribbean & Central America
  { iata: "CM", name: "Copa Airlines", country: "PA" },
  { iata: "BW", name: "Caribbean Airlines", country: "TT" },
  { iata: "8J", name: "Jet2.com", country: "GB" },
]

function AirlinePicker({
  codeValue, nameValue,
  onCodeChange, onNameChange,
}: {
  codeValue: string
  nameValue: string
  onCodeChange: (v: string) => void
  onNameChange: (v: string) => void
}) {
  const [codeQuery, setCodeQuery] = useState(codeValue)
  const [nameQuery, setNameQuery] = useState(nameValue)
  const [codeOpen, setCodeOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [codeDropStyle, setCodeDropStyle] = useState<React.CSSProperties>({})
  const [nameDropStyle, setNameDropStyle] = useState<React.CSSProperties>({})
  const codeRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const codeDropRef = useRef<HTMLDivElement>(null)
  const nameDropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setCodeQuery(codeValue) }, [codeValue])
  useEffect(() => { setNameQuery(nameValue) }, [nameValue])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (codeRef.current && !codeRef.current.contains(t) && codeDropRef.current && !codeDropRef.current.contains(t)) setCodeOpen(false)
      if (nameRef.current && !nameRef.current.contains(t) && nameDropRef.current && !nameDropRef.current.contains(t)) setNameOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  const codeFiltered = codeQuery.trim()
    ? AIRLINE_OPTIONS.filter((a) =>
        a.iata.toLowerCase().startsWith(codeQuery.toLowerCase()) ||
        a.iata.toLowerCase().includes(codeQuery.toLowerCase()) ||
        a.name.toLowerCase().includes(codeQuery.toLowerCase())
      ).slice(0, 10)
    : AIRLINE_OPTIONS.slice(0, 10)

  const nameFiltered = nameQuery.trim()
    ? AIRLINE_OPTIONS.filter((a) =>
        a.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
        a.iata.toLowerCase().includes(nameQuery.toLowerCase())
      ).slice(0, 10)
    : []

  function openCodeDrop() {
    if (codeRef.current) {
      const rect = codeRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 250
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 300), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 300), zIndex: 9999 }
      setCodeDropStyle(style)
    }
    setCodeOpen(true)
  }

  function openNameDrop() {
    if (nameRef.current) {
      const rect = nameRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 250
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 320), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 320), zIndex: 9999 }
      setNameDropStyle(style)
    }
    setNameOpen(true)
  }

  function selectAirline(airline: typeof AIRLINE_OPTIONS[0]) {
    setCodeQuery(airline.iata)
    setNameQuery(airline.name)
    onCodeChange(airline.iata)
    onNameChange(airline.name)
    setCodeOpen(false)
    setNameOpen(false)
  }

  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Airline Code</Label>
        <div ref={codeRef} className="relative">
          <input
            value={codeQuery}
            onChange={(e) => { setCodeQuery(e.target.value); onCodeChange(e.target.value); openCodeDrop() }}
            onFocus={openCodeDrop}
            autoComplete="new-password"
            className="w-full h-9 text-sm border border-gray-200 rounded-md pl-2.5 pr-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
          />
          {codeOpen && codeFiltered.length > 0 && createPortal(
            <div ref={codeDropRef} style={codeDropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {codeFiltered.map((a) => (
                  <button key={a.iata} type="button" onMouseDown={(e) => { e.preventDefault(); selectAirline(a) }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${a.iata === codeValue ? "bg-blue-50" : ""}`}
                  >
                    <span className="text-xs font-mono font-bold text-gray-900 w-6 flex-shrink-0">{a.iata}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 truncate">{a.name}</div>
                      <div className="text-[10px] text-gray-400">{a.country}</div>
                    </div>
                    {a.iata === codeValue && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Airline Name</Label>
        <div ref={nameRef} className="relative">
          <input
            value={nameQuery}
            onChange={(e) => { setNameQuery(e.target.value); onNameChange(e.target.value); if (e.target.value) { openNameDrop() } else { setNameOpen(false) } }}
            onFocus={() => { if (nameQuery) openNameDrop() }}
            autoComplete="new-password"
            className="w-full h-9 text-sm border border-gray-200 rounded-md pl-2.5 pr-2.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
          />
          {nameOpen && nameFiltered.length > 0 && createPortal(
            <div ref={nameDropRef} style={nameDropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {nameFiltered.map((a) => (
                  <button key={a.iata} type="button" onMouseDown={(e) => { e.preventDefault(); selectAirline(a) }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${a.iata === codeValue ? "bg-blue-50" : ""}`}
                  >
                    <span className="text-xs font-mono font-bold text-gray-900 w-6 flex-shrink-0">{a.iata}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-700 truncate">{a.name}</div>
                      <div className="text-[10px] text-gray-400">{a.country}</div>
                    </div>
                    {a.iata === codeValue && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </div>,
            document.body
          )}
        </div>
      </div>
    </div>
  )
}

function StateCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

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

  const filtered = query.trim()
    ? STATE_OPTIONS.filter((s) =>
        s.code.toLowerCase().includes(query.toLowerCase()) ||
        s.name.toLowerCase().includes(query.toLowerCase())
      )
    : STATE_OPTIONS

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 220
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 220), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 220), zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
  }

  function handleSelect(code: string) {
    onChange(code)
    setQuery(code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); openDropdown() }}
        onFocus={openDropdown}
        autoComplete="new-password"
        className="w-full h-9 text-sm border border-gray-200 rounded-md pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
      />
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      {open && filtered.length > 0 && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => handleSelect(s.code)}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${s.code === value ? "bg-blue-50" : ""}`}
              >
                <span className="text-xs font-mono font-bold text-gray-900 w-7 flex-shrink-0">{s.code}</span>
                <span className="text-xs text-gray-500 flex-1">{s.name}</span>
                {s.code === value && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const COUNTRY_OPTIONS = [
  { code: "USA", name: "United States" },
  { code: "CAN", name: "Canada" },
  { code: "MEX", name: "Mexico" },
  { code: "GBR", name: "United Kingdom" },
  { code: "FRA", name: "France" },
  { code: "DEU", name: "Germany" },
  { code: "ITA", name: "Italy" },
  { code: "ESP", name: "Spain" },
  { code: "PRT", name: "Portugal" },
  { code: "NLD", name: "Netherlands" },
  { code: "BEL", name: "Belgium" },
  { code: "CHE", name: "Switzerland" },
  { code: "AUT", name: "Austria" },
  { code: "SWE", name: "Sweden" },
  { code: "NOR", name: "Norway" },
  { code: "DNK", name: "Denmark" },
  { code: "FIN", name: "Finland" },
  { code: "POL", name: "Poland" },
  { code: "CZE", name: "Czech Republic" },
  { code: "HUN", name: "Hungary" },
  { code: "ROU", name: "Romania" },
  { code: "GRC", name: "Greece" },
  { code: "TUR", name: "Turkey" },
  { code: "RUS", name: "Russia" },
  { code: "UAE", name: "United Arab Emirates" },
  { code: "SAU", name: "Saudi Arabia" },
  { code: "ISR", name: "Israel" },
  { code: "JPN", name: "Japan" },
  { code: "CHN", name: "China" },
  { code: "KOR", name: "South Korea" },
  { code: "IND", name: "India" },
  { code: "AUS", name: "Australia" },
  { code: "NZL", name: "New Zealand" },
  { code: "BRA", name: "Brazil" },
  { code: "ARG", name: "Argentina" },
  { code: "COL", name: "Colombia" },
  { code: "CHL", name: "Chile" },
  { code: "PER", name: "Peru" },
  { code: "ZAF", name: "South Africa" },
  { code: "EGY", name: "Egypt" },
  { code: "MAR", name: "Morocco" },
  { code: "NGR", name: "Nigeria" },
  { code: "KEN", name: "Kenya" },
  { code: "SGP", name: "Singapore" },
  { code: "HKG", name: "Hong Kong" },
  { code: "TWN", name: "Taiwan" },
  { code: "THA", name: "Thailand" },
  { code: "PHL", name: "Philippines" },
  { code: "IDN", name: "Indonesia" },
  { code: "MYS", name: "Malaysia" },
]

function CountryCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const found = COUNTRY_OPTIONS.find((c) => c.code === value)
    setQuery(found ? `${found.code} — ${found.name}` : value)
  }, [value])

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

  const searchQuery = query.includes(" — ") ? "" : query
  const filtered = searchQuery.trim()
    ? COUNTRY_OPTIONS.filter((c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : COUNTRY_OPTIONS

  function openDropdown() {
    if (query.includes(" — ")) setQuery("")
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const style: React.CSSProperties = spaceBelow < 220
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 260), zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, minWidth: Math.max(rect.width, 260), zIndex: 9999 }
      setDropStyle(style)
    }
    setOpen(true)
  }

  function handleSelect(code: string) {
    const option = COUNTRY_OPTIONS.find((c) => c.code === code)
    onChange(code)
    setQuery(option ? `${code} — ${option.name}` : code)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); openDropdown() }}
        onFocus={openDropdown}
        autoComplete="new-password"
        className="w-full h-9 text-sm border border-gray-200 rounded-md pl-2.5 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-gray-800"
      />
      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      {open && filtered.length > 0 && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelect(c.code)}
                className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2.5 ${c.code === value ? "bg-blue-50" : ""}`}
              >
                <span className="text-xs font-mono font-bold text-gray-900 w-8 flex-shrink-0">{c.code}</span>
                <span className="text-xs text-gray-500 flex-1">{c.name}</span>
                {c.code === value && <Check className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

type FlightTrackingData = StopEntry["flightTracking"]

function FlightTrackingBadge({ tracking }: { tracking: NonNullable<FlightTrackingData> }) {
  if (tracking.loading) {
    return (
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blue-500">
        <div className="w-3 h-3 border-[1.5px] border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <span>Fetching live flight data…</span>
      </div>
    )
  }

  if (tracking.error) {
    return (
      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5">
        <span className="font-medium">Flight data:</span> {tracking.error}
      </div>
    )
  }

  const hasData = tracking.estimatedArrival || tracking.actualArrival || tracking.arrivalGate || tracking.baggageClaim

  if (!hasData) return null

  const hasActualArrival = !!tracking.actualArrival

  function formatArrivalTime(utcIso: string, timezone: string | null | undefined): string | null {
    try {
      return new Date(utcIso).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone || "UTC",
      })
    } catch {
      return null
    }
  }

  const arrivalTimeUtc = tracking.actualArrival || tracking.estimatedArrival
  const formattedTime = arrivalTimeUtc
    ? formatArrivalTime(arrivalTimeUtc, tracking.destinationTimezone)
    : null

  const isArrived = tracking.status?.toLowerCase().includes("arrived") || hasActualArrival
  const isDelayed = tracking.arrivalDelayMinutes && tracking.arrivalDelayMinutes > 5
  const isCancelled = tracking.status?.toLowerCase().includes("cancel")

  const statusColor = isCancelled
    ? "bg-red-50 border-red-200 text-red-700"
    : isArrived
    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
    : isDelayed
    ? "bg-amber-50 border-amber-200 text-amber-700"
    : "bg-blue-50 border-blue-200 text-blue-700"

  return (
    <div className={`mt-1.5 rounded-lg border px-2.5 py-1.5 ${statusColor}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {tracking.status && (
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{tracking.status}</span>
        )}
        {formattedTime && (
          <span className="text-[11px] font-semibold">
            {hasActualArrival ? "Landed" : "ETA"}: {formattedTime}
            {isDelayed && tracking.arrivalDelayMinutes ? (
              <span className="ml-1 opacity-70">(+{tracking.arrivalDelayMinutes}m delay)</span>
            ) : null}
          </span>
        )}
        {tracking.arrivalGate && (
          <span className="text-[11px] font-medium">· Gate {tracking.arrivalGate}</span>
        )}
        {tracking.baggageClaim && (
          <span className="text-[11px] font-medium">· Baggage {tracking.baggageClaim}</span>
        )}
      </div>
    </div>
  )
}

// ── SortableStopRow ──────────────────────────────────────────────────────────

interface SortableStopRowProps {
  stop: StopEntry
  isEditing: boolean
  onEdit: (stop: StopEntry) => void
  onDelete: (id: string) => void
  isDragOverlay?: boolean
}

function SortableStopRow({
  stop,
  isEditing,
  onEdit,
  onDelete,
  isDragOverlay = false,
}: SortableStopRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id, disabled: isEditing })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease-out",
    opacity: isDragging && !isDragOverlay ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-3 px-3 py-2.5 border-b last:border-b-0 border-gray-100 transition-colors ${ROLE_ROW_BG[stop.role]} ${
        isDragOverlay
          ? "shadow-lg ring-1 ring-blue-200 rounded-xl scale-[1.02] bg-white cursor-grabbing"
          : isEditing
          ? "opacity-40 cursor-not-allowed"
          : "cursor-pointer hover:brightness-95"
      }`}
      onClick={() => { if (!isEditing && !isDragOverlay) onEdit(stop) }}
    >
      {/* Drag handle — hidden when editing */}
      {!isEditing && (
        <button
          type="button"
          className={`flex-shrink-0 mt-0.5 touch-none ${
            isDragOverlay ? "cursor-grabbing" : "cursor-grab"
          } text-gray-300 hover:text-gray-500 transition-colors`}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      {/* Role prefix — left-aligned, mono */}
      <span className="text-[11px] font-bold font-mono flex-shrink-0 mt-0.5 w-6">
        {ROLE_PREFIX[stop.role]}:
      </span>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {stop.locationName && (
          <div className="text-xs font-semibold truncate">{stop.locationName}</div>
        )}
        <div className="text-sm font-medium truncate">{stop.address}</div>
        {stop.tailNumber && (
          <div className="text-[11px] opacity-70">Tail: {stop.tailNumber}</div>
        )}
        {stop.flightNumber && (
          <div className="text-[11px] opacity-70">
            Flight: {stop.flightNumber}
            {stop.arrDep ? ` · ${stop.arrDep}` : ""}
            {stop.terminalGate ? ` · Gate ${stop.terminalGate}` : ""}
          </div>
        )}
        {stop.etaEtd && (
          <div className="text-[11px] opacity-60">ETA/ETD: {stop.etaEtd}</div>
        )}
        {stop.flightTracking && (
          <FlightTrackingBadge tracking={stop.flightTracking} />
        )}
        {stop.cruiseShipName && (
          <div className="text-[11px] opacity-70">
            Ship: {stop.cruiseShipName}
            {stop.cruiseLineName ? ` · ${stop.cruiseLineName}` : ""}
          </div>
        )}
        {stop.arrivingDepartingTo && (
          <div className="text-[11px] opacity-60">{stop.arrivingDepartingTo}</div>
        )}
        {stop.seaportInstructions && (
          <div className="text-[11px] opacity-60">{stop.seaportInstructions}</div>
        )}
        {stop.notes && (
          <div className="text-[11px] opacity-60 truncate">{stop.notes}</div>
        )}
        {(stop.phone || stop.timeIn) && (
          <div className="text-[11px] opacity-60">
            {stop.phone && <span>{stop.phone}</span>}
            {stop.phone && stop.timeIn && <span className="mx-1">·</span>}
            {stop.timeIn && <span>Time In: {stop.timeIn}</span>}
          </div>
        )}
      </div>
      {/* Action buttons */}
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {!isEditing && !isDragOverlay && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="w-3 h-3 text-gray-400" />
          </span>
        )}
        {!isDragOverlay && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!isEditing) onDelete(stop.id)
            }}
            disabled={isEditing}
            className="text-gray-300 hover:text-red-400 transition-colors disabled:pointer-events-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

function RouteBuilder({
  stops, setStops, stopsError, pickupDate,
}: {
  stops: StopEntry[]
  setStops: React.Dispatch<React.SetStateAction<StopEntry[]>>
  stopsError: string
  pickupDate?: string
}) {
  const upsertAddress = useUpsertAddress()
  const [locType, setLocType] = useState<StopLocationType>("address")
  const [role, setRole] = useState<StopRole>("pickup")
  // Structured address fields
  const [locationName, setLocationName] = useState("")
  const [address1, setAddress1] = useState("")
  const [address2, setAddress2] = useState("")
  const [city, setCity] = useState("")
  const [stateVal, setStateVal] = useState("")
  const [zip, setZip] = useState("")
  const [country, setCountry] = useState("")
  const [phone, setPhone] = useState("")
  const [timeIn, setTimeIn] = useState("")
  const [notes, setNotes] = useState("")
  // Airport fields
  const [airportCode, setAirportCode] = useState("")
  const [airportName, setAirportName] = useState("")
  const [airlineCode, setAirlineCode] = useState("")
  const [airlineName, setAirlineName] = useState("")
  const [flightNumber, setFlightNumber] = useState("")
  const [arrDep, setArrDep] = useState("")
  const [terminalGate, setTerminalGate] = useState("")
  const [airportInstructions, setAirportInstructions] = useState("")
  const [etaEtd, setEtaEtd] = useState("")
  const [meetOption, setMeetOption] = useState("")
  // FBO-specific
  const [tailNumber, setTailNumber] = useState("")
  // Seaport fields
  const [seaportCode, setSeaportCode] = useState("")
  const [portName, setPortName] = useState("")
  const [cruiseShipName, setCruiseShipName] = useState("")
  const [cruiseLineName, setCruiseLineName] = useState("")
  const [arrivingDepartingTo, setArrivingDepartingTo] = useState("")
  const [seaportInstructions, setSeaportInstructions] = useState("")
  const [addError, setAddError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      setStops((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id)
        const newIndex = prev.findIndex((s) => s.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const fetchFlightData = useCallback(async (stopId: string, flightNum: string) => {
    if (!flightNum.trim()) return
    setStops(prev => prev.map(s => s.id === stopId
      ? { ...s, flightTracking: { ...s.flightTracking, loading: true, error: undefined } }
      : s
    ))
    try {
      const params = new URLSearchParams({ flight: flightNum.trim() })
      if (pickupDate) {
        // Convert MM/DD/YYYY → YYYY-MM-DD for the API
        const parts = pickupDate.split("/")
        const isoDate = parts.length === 3
          ? `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`
          : pickupDate
        params.set("date", isoDate)
      }
      const res = await fetch(`/api/flights/track?${params}`)
      const data = await res.json()
      if (!res.ok) {
        setStops(prev => prev.map(s => s.id === stopId
          ? { ...s, flightTracking: { loading: false, error: data.detail ? `${data.error}: ${data.detail}` : (data.error || "Unavailable"), lastFetched: Date.now() } }
          : s
        ))
        return
      }
      setStops(prev => prev.map(s => s.id === stopId
        ? { ...s, flightTracking: { ...data, loading: false, lastFetched: Date.now() } }
        : s
      ))
    } catch {
      setStops(prev => prev.map(s => s.id === stopId
        ? { ...s, flightTracking: { loading: false, error: "Network error", lastFetched: Date.now() } }
        : s
      ))
    }
  }, [pickupDate, setStops])

  // Auto-refresh flight data every 5 minutes for stops with flight tracking
  useEffect(() => {
    const interval = setInterval(() => {
      stops.forEach(stop => {
        if (stop.locType === "airport" && stop.flightNumber && stop.flightTracking && !stop.flightTracking.loading) {
          const isArrived = stop.flightTracking.status?.toLowerCase().includes("arrived") || !!stop.flightTracking.actualArrival
          const age = stop.flightTracking.lastFetched ? Date.now() - stop.flightTracking.lastFetched : Infinity
          if (!isArrived && age > 590000) {
            fetchFlightData(stop.id, stop.flightNumber)
          }
        }
      })
    }, 600000)
    return () => clearInterval(interval)
  }, [stops, fetchFlightData])

  function resetForm() {
    setLocationName(""); setAddress1(""); setAddress2(""); setCity("")
    setStateVal(""); setZip(""); setCountry(""); setPhone(""); setTimeIn("")
    setNotes("")
    setAirportCode(""); setAirportName(""); setAirlineCode(""); setAirlineName("")
    setFlightNumber(""); setArrDep(""); setTerminalGate(""); setAirportInstructions("")
    setEtaEtd(""); setMeetOption("")
    setTailNumber("")
    setSeaportCode(""); setPortName(""); setCruiseShipName(""); setCruiseLineName("")
    setArrivingDepartingTo(""); setSeaportInstructions("")
  }

  function handleLocTab(t: StopLocationType) {
    setLocType(t); resetForm()
  }

  function editStop(stop: StopEntry) {
    setIsEditing(true)
    setStops(prev => prev.filter(s => s.id !== stop.id))
    setLocType(stop.locType)
    setRole(stop.role)
    setLocationName(stop.locationName ?? "")
    setAddress1(stop.address1 ?? "")
    setAddress2(stop.address2 ?? "")
    setCity(stop.city ?? "")
    setStateVal(stop.state ?? "")
    setZip(stop.zip ?? "")
    setCountry(stop.country ?? "")
    setPhone(stop.phone ?? "")
    setTimeIn(stop.timeIn ?? "")
    setNotes(stop.notes ?? "")
    setAirportCode(stop.airportCode ?? "")
    setAirportName(stop.airportName ?? "")
    setAirlineCode(stop.airlineCode ?? "")
    setAirlineName(stop.airlineName ?? "")
    setFlightNumber(stop.flightNumber ?? "")
    setArrDep(stop.arrDep ?? "")
    setTerminalGate(stop.terminalGate ?? "")
    setAirportInstructions(stop.airportInstructions ?? "")
    setEtaEtd(stop.etaEtd ?? "")
    setMeetOption(stop.meetOption ?? "")
    setTailNumber(stop.tailNumber ?? "")
    setSeaportCode(stop.seaportCode ?? "")
    setPortName(stop.portName ?? "")
    setCruiseShipName(stop.cruiseShipName ?? "")
    setCruiseLineName(stop.cruiseLineName ?? "")
    setArrivingDepartingTo(stop.arrivingDepartingTo ?? "")
    setSeaportInstructions(stop.seaportInstructions ?? "")
    setAddError("")
  }

  function handleAddressBookSelect(addr: import("@/lib/hooks/use-addresses").CompanyAddress) {
    if (addr.name)     setLocationName(addr.name)
    if (addr.address1) { setAddress1(addr.address1); setAddError("") }
    if (addr.address2) setAddress2(addr.address2)
    if (addr.city)     setCity(addr.city)
    if (addr.state)    setStateVal(addr.state)
    if (addr.zip)      setZip(addr.zip)
    if (addr.country)  setCountry(addr.country)
    if (addr.phone)    setPhone(addr.phone)
  }

  function handleAdd() {
    let primaryAddr = ""
    if (locType === "address" || locType === "fbo") primaryAddr = address1.trim()
    else if (locType === "airport") primaryAddr = (airportCode || airportName).trim()
    else if (locType === "seaport") primaryAddr = (seaportCode || portName).trim()
    else primaryAddr = ""

    if (!primaryAddr) { setAddError("Enter a location before adding"); return }
    setAddError("")

    let formattedAddress = ""
    if (locType === "address" || locType === "fbo") {
      formattedAddress = [locationName || address1, address2, city, stateVal ? `${stateVal}${zip ? " " + zip : ""}` : zip].filter(Boolean).join(", ")
      if (locType === "fbo") formattedAddress = [locationName || address1, city, stateVal].filter(Boolean).join(", ")
    } else if (locType === "airport") {
      const parts = [airportName || airportCode, airportCode && airportName ? `(${airportCode})` : ""].filter(Boolean)
      formattedAddress = parts.join(" ") || airportCode || airportName
    } else if (locType === "seaport") {
      formattedAddress = [portName || seaportCode, seaportCode && portName ? `(${seaportCode})` : ""].filter(Boolean).join(" ") || seaportCode || portName
    }

    setIsEditing(false)
    const newStopId = `s${Date.now()}`
    const rawFlight = flightNumber.trim()
    const rawAirline = airlineCode.trim().toUpperCase()
    // Build full IATA flight number (e.g. "AA620"). Don't double-prepend if user already typed "AA620".
    const fullFlightNum = rawAirline && !rawFlight.toUpperCase().startsWith(rawAirline)
      ? rawAirline + rawFlight
      : rawFlight
    setStops(prev => [...prev, {
      id: newStopId, locType, role,
      address: formattedAddress,
      notes: notes.trim(),
      flightNumber: fullFlightNum,
      // Address / FBO fields
      locationName: locationName.trim() || undefined,
      address1: address1.trim() || undefined,
      address2: address2.trim() || undefined,
      city: city.trim() || undefined,
      state: stateVal.trim() || undefined,
      zip: zip.trim() || undefined,
      country: country.trim() || undefined,
      phone: phone.trim() || undefined,
      timeIn: timeIn.trim() || undefined,
      tailNumber: tailNumber.trim() || undefined,
      // Airport fields
      airportCode: airportCode.trim() || undefined,
      airportName: airportName.trim() || undefined,
      airlineCode: airlineCode.trim() || undefined,
      airlineName: airlineName.trim() || undefined,
      arrDep: arrDep.trim() || undefined,
      terminalGate: terminalGate.trim() || undefined,
      airportInstructions: airportInstructions.trim() || undefined,
      etaEtd: etaEtd.trim() || undefined,
      meetOption: meetOption.trim() || undefined,
      // Seaport fields
      seaportCode: seaportCode.trim() || undefined,
      portName: portName.trim() || undefined,
      cruiseShipName: cruiseShipName.trim() || undefined,
      cruiseLineName: cruiseLineName.trim() || undefined,
      arrivingDepartingTo: arrivingDepartingTo.trim() || undefined,
      seaportInstructions: seaportInstructions.trim() || undefined,
    }])
    if (locType === "airport" && fullFlightNum) {
      setTimeout(() => fetchFlightData(newStopId, fullFlightNum), 50)
    }
    // Auto-save address to company address book (fire-and-forget)
    if ((locType === "address" || locType === "fbo") && address1.trim()) {
      upsertAddress.mutate({
        name:     locationName.trim() || undefined,
        address1: address1.trim(),
        address2: address2.trim() || undefined,
        city:     city.trim()     || undefined,
        state:    stateVal.trim() || undefined,
        zip:      zip.trim()      || undefined,
        country:  country.trim()  || undefined,
        phone:    phone.trim()    || undefined,
        notes:    notes.trim()    || undefined,
      })
    }
    resetForm()
    if (role === "pickup") setRole("drop")
  }

  return (
    <div className="space-y-3">
      {/* Entry form */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Location type tabs */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80">
          {STOP_LOC_TABS.map(({ type: t, label, Icon }) => (
            <button
              key={t} type="button" onClick={() => handleLocTab(t)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                locType === t ? "border-blue-500 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="p-3 bg-white space-y-2">
          {locType === "address" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Location Description / Name</Label>
                <AddressAutocomplete
                  value={locationName}
                  onChange={(v) => setLocationName(v)}
                  onSelect={handleAddressBookSelect}
                  placeholder=""
                  inputClassName="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Address 1 *</Label>
                <AddressAutocomplete
                  value={address1}
                  onChange={(v) => { setAddress1(v); setAddError("") }}
                  onSelect={handleAddressBookSelect}
                  error={!!addError}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Address 2</Label>
                <Input value={address2} onChange={(e) => setAddress2(e.target.value)}
                  className="h-9 text-sm" autoComplete="off" />
              </div>
              <div className="grid grid-cols-[2fr_90px_80px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">City</Label>
                  <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">State</Label>
                  <StateCombobox value={stateVal} onChange={setStateVal} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Zip</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Country</Label>
                  <CountryCombobox value={country} onChange={setCountry} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                    type="tel" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)}
                    onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs" />
              </div>
            </>
          )}
          {locType === "airport" && (
            <>
              <AirportPicker
                codeValue={airportCode}
                nameValue={airportName}
                onCodeChange={(v) => { setAirportCode(v); setAddError("") }}
                onNameChange={(v) => { setAirportName(v); setAddError("") }}
                codeError={!!addError}
              />
              <div className="grid grid-cols-[1fr_120px] gap-2">
                <AirlinePicker
                  codeValue={airlineCode}
                  nameValue={airlineName}
                  onCodeChange={setAirlineCode}
                  onNameChange={setAirlineName}
                />
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Flight #</Label>
                  <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[120px_120px_1fr_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Arr/Dep</Label>
                  <select value={arrDep} onChange={(e) => setArrDep(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Terminal/Gate</Label>
                  <Input value={terminalGate} onChange={(e) => setTerminalGate(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Airport Instructions</Label>
                  <Input value={airportInstructions} onChange={(e) => setAirportInstructions(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">ETA/ETD</Label>
                  <Input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)}
                    onBlur={(e) => setEtaEtd(formatTime(e.target.value))}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Meet Option</Label>
                  <select value={meetOption} onChange={(e) => setMeetOption(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select…</option>
                    <option value="Curbside">Curbside</option>
                    <option value="Inside">Inside</option>
                    <option value="Baggage Claim">Baggage Claim</option>
                    <option value="Gate">Gate</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Driver instructions, special requests…" className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="(305) 555-0000" type="tel" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)}
                    onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    placeholder="e.g. 3:00 PM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
            </>
          )}
          {locType === "seaport" && (
            <>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Seaport Code *</Label>
                  <Input value={seaportCode} onChange={(e) => { setSeaportCode(e.target.value.toUpperCase()); setAddError("") }}
                    placeholder="MIA" className={`h-9 text-sm ${addError ? "border-red-400" : ""}`} autoComplete="off" maxLength={6} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Port of Call Name</Label>
                  <Input value={portName} onChange={(e) => { setPortName(e.target.value); setAddError("") }}
                    placeholder="Port of Miami" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Cruise Ship Name</Label>
                  <Input value={cruiseShipName} onChange={(e) => setCruiseShipName(e.target.value)}
                    placeholder="Symphony of the Seas" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Cruise Line Name</Label>
                  <Input value={cruiseLineName} onChange={(e) => setCruiseLineName(e.target.value)}
                    placeholder="Royal Caribbean" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Arriving From / Departing To</Label>
                  <Input value={arrivingDepartingTo} onChange={(e) => setArrivingDepartingTo(e.target.value)}
                    placeholder="Nassau, Bahamas" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">ETA / ETD</Label>
                  <Input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)}
                    onBlur={(e) => setEtaEtd(formatTime(e.target.value))}
                    placeholder="e.g. 9:00 AM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Seaport Instructions</Label>
                <Select value={seaportInstructions} onValueChange={(v) => typeof v === "string" && setSeaportInstructions(v)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select instructions…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Meet at terminal entrance">Meet at terminal entrance</SelectItem>
                    <SelectItem value="Meet at baggage claim">Meet at baggage claim</SelectItem>
                    <SelectItem value="Meet at gangway">Meet at gangway</SelectItem>
                    <SelectItem value="Curbside pickup">Curbside pickup</SelectItem>
                    <SelectItem value="Meet inside terminal">Meet inside terminal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pier, terminal, additional instructions…" className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)}
                    onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    placeholder="e.g. 9:30 AM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
            </>
          )}
          {locType === "fbo" && (
            <>
              <div className="grid grid-cols-[1fr_140px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Location Description / FBO Name *</Label>
                  <FBOAutocomplete
                    value={locationName}
                    onChange={(v) => { setLocationName(v); setAddError("") }}
                    onSelect={(fbo) => {
                      setLocationName(fbo.name)
                      setAddress1(fbo.address)
                      setCity(fbo.city)
                      setStateVal(fbo.state)
                      setZip(fbo.zip ?? "")
                      setCountry(fbo.country ?? "USA")
                      setAddError("")
                    }}
                    hasError={!!addError}
                    placeholder="Signature Aviation, Atlantic, Million Air…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Tail #</Label>
                  <Input value={tailNumber} onChange={(e) => setTailNumber(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Address 1</Label>
                  <AddressAutocomplete
                    value={address1}
                    onChange={(v) => setAddress1(v)}
                    onSelect={handleAddressBookSelect}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Address 2</Label>
                  <Input value={address2} onChange={(e) => setAddress2(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[2fr_90px_80px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">City</Label>
                  <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">State</Label>
                  <StateCombobox value={stateVal} onChange={setStateVal} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Zip</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Country</Label>
                  <CountryCombobox value={country} onChange={setCountry} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)}
                    type="tel" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-900 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)}
                    onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
            </>
          )}
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </div>

        {/* Role selector + Add button */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50/50 border-t border-gray-100">
          {STOP_ROLES.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                role === value ? STOP_ROLE_STYLE[value].pill : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <input type="radio" name="entry-role" value={value} checked={role === value}
                onChange={() => setRole(value)} className="sr-only" />
              <span className={`w-1.5 h-1.5 rounded-full ${
                role === value
                  ? value === "pickup" ? "bg-emerald-500" : value === "drop" ? "bg-red-500"
                  : value === "wait" ? "bg-amber-500" : "bg-blue-500"
                  : "bg-gray-300"
              }`} />
              {label}
            </label>
          ))}
          <button
            type="button" onClick={handleAdd}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add to Route
          </button>
        </div>
      </div>

      {/* Route list */}
      {stops.length > 0 ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Routing Information</p>
            </div>
            <SortableContext items={stops.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {stops.map((stop) => (
                <SortableStopRow
                  key={stop.id}
                  stop={stop}
                  isEditing={isEditing}
                  onEdit={editStop}
                  onDelete={(id) => setStops((prev) => prev.filter((s) => s.id !== id))}
                />
              ))}
            </SortableContext>
          </div>
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease-out" }}>
            {activeId ? (
              <SortableStopRow
                stop={stops.find((s) => s.id === activeId)!}
                isEditing={false}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="text-xs text-gray-400 text-center py-6 border border-dashed border-gray-200 rounded-xl">
          Add locations above to build the trip itinerary
        </div>
      )}

      {stopsError && <p className="text-xs text-red-500">{stopsError}</p>}
    </div>
  )
}

function formatTime(raw: string): string {
  const s = raw.trim()
  if (!s) return s

  const lower = s.toLowerCase()

  // Detect AM/PM suffix
  let ampm: "AM" | "PM" | null = null
  let timeStr = lower
  if (timeStr.endsWith("am")) { ampm = "AM"; timeStr = timeStr.slice(0, -2).trim() }
  else if (timeStr.endsWith("pm")) { ampm = "PM"; timeStr = timeStr.slice(0, -2).trim() }

  let hours: number, minutes: number

  if (timeStr.includes(":")) {
    const [h, m] = timeStr.split(":")
    hours = parseInt(h, 10)
    minutes = parseInt(m, 10) || 0
  } else if (timeStr.length <= 2) {
    hours = parseInt(timeStr, 10)
    minutes = 0
  } else if (timeStr.length === 3) {
    // e.g. "930" → 9:30
    hours = parseInt(timeStr[0], 10)
    minutes = parseInt(timeStr.slice(1), 10)
  } else if (timeStr.length === 4) {
    // e.g. "1500" → 15:00
    hours = parseInt(timeStr.slice(0, 2), 10)
    minutes = parseInt(timeStr.slice(2), 10)
  } else {
    return raw
  }

  if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) return raw

  // If no AM/PM provided, infer from 24-hour value
  if (!ampm) {
    if (hours === 0) { ampm = "AM"; hours = 12 }
    else if (hours < 12) { ampm = "AM" }
    else if (hours === 12) { ampm = "PM" }
    else { ampm = "PM"; hours -= 12 }
  }

  const minStr = minutes.toString().padStart(2, "0")
  return `${hours}:${minStr} ${ampm}`
}

function StepHeader({ step, icon: Icon, title, subtitle }: { step: number; icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex-shrink-0">
        {step}
      </span>
      <Icon className="w-3.5 h-3.5 text-gray-400" />
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  )
}

export default function NewTripPage() {
  const router = useRouter()
  const createTrip = useCreateTrip()
  const { data: drivers, isLoading: driversLoading } = useDrivers()
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles()
  const { data: vehicleTypes = [], isLoading: vehicleTypesLoading } = useVehicleTypes()
  const { data: serviceTypes = [] } = useServiceTypes()
  const enabledTypes = serviceTypes.filter((t) => t.isEnabled)

  const [selectedAccount, setSelectedAccount] = useState<Customer | null>(null)
  const [tripTypeValue, setTripTypeValue] = useState("")
  const [driverIdValue, setDriverIdValue] = useState("")
  const [vehicleTypeValue, setVehicleTypeValue] = useState("")
  const [vehicleIdValue, setVehicleIdValue] = useState("")
  const [secondaryDriverIdValue, setSecondaryDriverIdValue] = useState("")
  const [secondaryVehicleIdValue, setSecondaryVehicleIdValue] = useState("")
  const [dispatchTab, setDispatchTab] = useState<"primary" | "secondary">("primary")
  const [stops, setStops] = useState<StopEntry[]>([])
  const [stopsError, setStopsError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [notesTab, setNotesTab] = useState<"trip" | "internal">("trip")
  const [childSeats, setChildSeats] = useState({ forward: 0, rear: 0, booster: 0 })
  const [childSeatsOpen, setChildSeatsOpen] = useState(false)
  const [confirmationNumber] = useState(() => generateConfirmationNumber())
  const [createdConfirmation, setCreatedConfirmation] = useState<string | null>(null)
  const [createdTrip, setCreatedTrip]               = useState<Trip | null>(null)
  const [headerCopied, setHeaderCopied]              = useState(false)
  const [sendEmailOpen, setSendEmailOpen]            = useState(false)
  const [sendEmailRecipient, setSendEmailRecipient]  = useState<"driver" | "client" | "affiliate">("driver")
  const [pendingAttachments, setPendingAttachments]  = useState<PendingFile[]>([])
  const [selectedPartnerId, setSelectedPartnerId]    = useState<string | null>(null)
  const [isFormSubmitting, setIsFormSubmitting]      = useState(false)

  type AdditionalPax = { id: string; firstName: string; lastName: string; phone: string; email: string }
  const [additionalPassengers, setAdditionalPassengers] = useState<AdditionalPax[]>([])
  const addAdditionalPassenger = useCallback(() => {
    setAdditionalPassengers(prev => [...prev, { id: Math.random().toString(36).slice(2), firstName: "", lastName: "", phone: "", email: "" }])
  }, [])
  const removeAdditionalPassenger = useCallback((id: string) => {
    setAdditionalPassengers(prev => prev.filter(p => p.id !== id))
  }, [])
  const updateAdditionalPassenger = useCallback((id: string, field: string, value: string) => {
    setAdditionalPassengers(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      tripType:         "",
      pickupDate:       "",
      pickupTime:       "",
      passengerCount:   1,
      luggageCount:     0,
      gratuityPercent:  20,
      meetAndGreet:     false,
      childSeat:        false,
      vip:              false,
    },
  })

  const price = watch("price") || 0
  const gratuityPercent = watch("gratuityPercent") || 0
  const gratuityAmt = price ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : 0
  const total = price ? price + gratuityAmt : 0

  const vip = watch("vip")
  const meetAndGreet = watch("meetAndGreet")
  const totalChildSeats = childSeats.forward + childSeats.rear + childSeats.booster

  async function onSubmit(data: FormData) {
    setIsFormSubmitting(true)
    try {
      const pickupStop = stops.find(s => s.role === "pickup")
      const dropStop = [...stops].reverse().find(s => s.role === "drop")

      if (!pickupStop?.address.trim()) {
        setStopsError("A pickup location with an address is required")
        return
      }
      if (!dropStop?.address.trim()) {
        setStopsError("A drop-off location with an address is required")
        return
      }
      setStopsError("")
      setSubmitError("")

      // Pre-upload any pending attachments
      let uploadedAttachments: Array<{ url: string; storagePath: string; name: string; mimeType: string; size: number }> = []
      if (pendingAttachments.length > 0) {
        try {
          uploadedAttachments = await Promise.all(
            pendingAttachments.map((pf) => preUploadAttachment(pf.file))
          )
        } catch (err) {
          setSubmitError(err instanceof Error ? err.message : "Failed to upload attachments")
          return
        }
      }

      const airportStop = stops.find(s => s.locType === "airport" && s.flightNumber)
      const gratuity = data.price ? Math.round(data.price * ((data.gratuityPercent || 0) / 100) * 100) / 100 : undefined
      const totalPrice = data.price && gratuity ? data.price + gratuity : data.price

      const stopsData = stops.map((stop, idx) => ({
        order: idx,
        address: stop.address,
        locationName: stop.locationName || null,
        role: stop.role || null,
        notes: stop.notes || null,
        arrivalTime: stop.timeIn || null,
      }))

      createTrip.mutate({
        tripNumber:       confirmationNumber,
        customerId:       data.customerId,
        clientRef:        data.clientRef || undefined,
        tripType:         data.tripType,
        pickupDate:       data.pickupDate,
        pickupTime:       data.pickupTime,
        pickupAddress:    pickupStop.address,
        pickupNotes:      pickupStop.notes || undefined,
        dropoffAddress:   dropStop.address,
        dropoffNotes:     dropStop.notes || undefined,
        flightNumber:     airportStop?.flightNumber || undefined,
        passengerName:    [data.passengerFirstName, data.passengerLastName].filter(Boolean).join(" ") || undefined,
        passengerPhone:   data.passengerPhone || undefined,
        passengerEmail:   data.passengerEmail || undefined,
        passengerCount:   data.passengerCount,
        additionalPassengers: additionalPassengers.length > 0
          ? additionalPassengers.map(({ firstName, lastName, phone, email }) => ({ firstName, lastName, phone: phone || undefined, email: email || undefined }))
          : undefined,
        luggageCount:     data.luggageCount ?? undefined,
        driverId:         data.driverId || undefined,
        vehicleType:      data.vehicleType || undefined,
        vehicleId:        data.vehicleId || undefined,
        secondaryDriverId:  data.secondaryDriverId || undefined,
        secondaryVehicleId: data.secondaryVehicleId || undefined,
        price:            data.price as never,
        gratuity:         gratuity as never,
        totalPrice:       totalPrice as never,
        notes:            data.tripNotes || undefined,
        internalNotes:    data.internalNotes || undefined,
        attachments:      uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        meetAndGreet:     data.meetAndGreet,
        childSeat:        totalChildSeats > 0,
        childSeatDetails: totalChildSeats > 0 ? JSON.stringify([
          ...(childSeats.forward > 0 ? [{ type: "FORWARD_FACING", count: childSeats.forward }] : []),
          ...(childSeats.rear    > 0 ? [{ type: "REAR_FACING",    count: childSeats.rear    }] : []),
          ...(childSeats.booster > 0 ? [{ type: "BOOSTER",        count: childSeats.booster }] : []),
        ]) : undefined,
        wheelchairAccess: false,
        vip:              data.vip,
        stops: stopsData as never,
      } as never, {
        onSuccess: (trip) => { setCreatedConfirmation(confirmationNumber); setCreatedTrip(trip) },
        onError: (err) => setSubmitError(err instanceof Error ? err.message : "Failed to save reservation. Please check your information and try again."),
      })
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const simpleAddons = [
    { name: "vip" as const,          label: "VIP",          icon: Star,      active: vip },
    { name: "meetAndGreet" as const, label: "Meet & Greet", icon: UserCheck, active: meetAndGreet },
  ]

  const CHILD_SEAT_TYPES = [
    { key: "forward" as const, label: "Forward Facing" },
    { key: "rear"    as const, label: "Rear Facing"    },
    { key: "booster" as const, label: "Booster"        },
  ]

  // ── Success modal (rendered below in main return) ──

  return (
    <div className="h-full flex flex-col">

      {/* ─── Header ─── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-white flex-shrink-0">
        <button
          type="button"
          onClick={() => router.push("/dispatch")}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="Go to dispatch"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="h-5 w-px bg-gray-200 flex-shrink-0" />
        <h1 className="text-sm font-semibold text-gray-900">New Reservation</h1>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
          Draft
        </span>

        {/* Confirmation number — visible immediately on open */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(confirmationNumber)
            setHeaderCopied(true)
            setTimeout(() => setHeaderCopied(false), 2000)
          }}
          className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors group"
          title="Click to copy confirmation number"
          aria-label="Copy confirmation number"
        >
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-blue-400 mb-0.5">Confirmation #</span>
            <span className="text-sm font-mono font-bold text-blue-700 tracking-wide">{confirmationNumber}</span>
          </div>
          {headerCopied
            ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            : <Copy className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          }
        </button>

        <div className="flex-1" />
        <Button
          form="new-trip-form"
          type="submit"
          disabled={createTrip.isPending}
          className="bg-[#2563EB] hover:bg-blue-700 text-white h-9 px-5 text-sm font-semibold"
        >
          {createTrip.isPending ? "Creating…" : "Create Reservation"}
        </Button>
      </div>

      {/* ─── Body ─── */}
      <div className="overflow-y-auto flex-1 bg-[#f0f2f5]">
        <form id="new-trip-form" onSubmit={handleSubmit(onSubmit, (errs) => {
          const labels: Record<string, string> = {
            customerId: "Account (Bill To)", pickupDate: "Pickup Date",
            pickupTime: "Pickup Time", tripType: "Service Type",
          }
          const missing = Object.keys(errs).map(k => labels[k] || k).join(", ")
          setSubmitError(`Please fill in required fields: ${missing}`)
        })}>
          <div className="max-w-[1300px] mx-auto p-4 sm:p-5 flex flex-col lg:flex-row gap-5 items-start">

            {/* ─── Left: Main content ─── */}
            <div className="flex-1 min-w-0 space-y-4 w-full">

              {/* ── Card 1: Bill To & Passenger ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100"
                  style={{ background: "linear-gradient(90deg, rgba(37,99,235,0.05) 0%, transparent 70%)" }}>
                  <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 2px 8px rgba(37,99,235,0.30)" }}>
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Bill To &amp; Passenger</h3>
                </div>

                {/* Account sub-section */}
                <div className="px-5 pt-4 pb-4 border-b border-gray-50">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-blue-400 inline-block flex-shrink-0" />
                    Account
                  </p>
                  <CustomerSearch
                    onSelect={(c) => {
                      setValue("customerId", c.id)
                      setSelectedAccount(c)
                    }}
                    onClear={() => {
                      setValue("customerId", "")
                      setSelectedAccount(null)
                    }}
                    error={errors.customerId?.message}
                  />
                  {/* Client Reference # */}
                  <div className="mt-3 space-y-1.5">
                    <Label className="text-[11px] font-medium text-gray-500 flex items-center gap-1.5">
                      Client Reference #
                      <span className="text-[10px] font-normal text-gray-400 normal-case">— affiliate&apos;s confirmation number for this job</span>
                    </Label>
                    <Input
                      {...register("clientRef")}
                      className="h-9 text-sm font-mono"
                      placeholder="e.g. 14547002*1"
                    />
                  </div>
                </div>

                {/* Booked By sub-section */}
                {selectedAccount && (
                  <div className="px-5 pt-4 pb-4 border-b border-gray-50">
                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="w-1 h-3 rounded-full bg-teal-400 inline-block flex-shrink-0" />
                      Booked By
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Name</p>
                        <p className="text-sm font-medium text-gray-800">{selectedAccount.name}</p>
                      </div>
                      {selectedAccount.company && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Company</p>
                          <p className="text-sm font-medium text-gray-800">{selectedAccount.company}</p>
                        </div>
                      )}
                      {selectedAccount.phone && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
                          <p className="text-sm text-gray-700">{formatPhone(selectedAccount.phone)}</p>
                        </div>
                      )}
                      {selectedAccount.email && (
                        <div>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                          <p className="text-sm text-gray-700">{selectedAccount.email}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Passenger sub-section */}
                <div className="px-5 pt-4 pb-5">
                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="w-1 h-3 rounded-full bg-purple-400 inline-block flex-shrink-0" />
                    Passengers
                    <span className="font-normal text-gray-400 normal-case">— if different from account holder</span>
                  </p>
                  <div className="space-y-2.5">
                    {/* Primary passenger */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold shadow-sm shadow-indigo-200">1</span>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Primary</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-2.5">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">First Name</Label>
                          <Input {...register("passengerFirstName")} className="h-9 text-sm bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Last Name</Label>
                          <Input {...register("passengerLastName")} className="h-9 text-sm bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Company</Label>
                          <Input {...register("passengerCompany")} className="h-9 text-sm bg-white" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Phone</Label>
                          <Input
                            {...register("passengerPhone")}
                            type="tel"
                            className="h-9 text-sm bg-white"
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                              let formatted = digits
                              if (digits.length >= 7) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                              else if (digits.length >= 4) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                              else if (digits.length >= 1) formatted = `(${digits}`
                              e.target.value = formatted
                              register("passengerPhone").onChange(e)
                            }}
                          />
                        </div>
                      </div>
                      <div className="w-[calc(75%-6px)]">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Email</Label>
                          <Input {...register("passengerEmail")} type="email" className="h-9 text-sm bg-white" />
                        </div>
                      </div>
                    </div>

                    {/* Additional passengers */}
                    {additionalPassengers.map((pax, idx) => (
                      <div key={pax.id} className="group relative bg-white border border-gray-200 rounded-xl px-4 py-3.5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold">{idx + 2}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Additional</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAdditionalPassenger(pax.id)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">First Name</Label>
                            <Input value={pax.firstName} onChange={(e) => updateAdditionalPassenger(pax.id, "firstName", e.target.value)} className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">Last Name</Label>
                            <Input value={pax.lastName} onChange={(e) => updateAdditionalPassenger(pax.id, "lastName", e.target.value)} className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">Phone</Label>
                            <Input
                              type="tel"
                              value={pax.phone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                                let formatted = digits
                                if (digits.length >= 7) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                                else if (digits.length >= 4) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                                else if (digits.length >= 1) formatted = `(${digits}`
                                updateAdditionalPassenger(pax.id, "phone", formatted)
                              }}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">Email</Label>
                            <Input value={pax.email} type="email" onChange={(e) => updateAdditionalPassenger(pax.id, "email", e.target.value)} className="h-9 text-sm" />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add passenger */}
                    <button
                      type="button"
                      onClick={addAdditionalPassenger}
                      className="w-full h-9 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-indigo-300 rounded-xl text-[12px] font-medium text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add passenger
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Card 2: Schedule ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100"
                  style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.05) 0%, transparent 70%)" }}>
                  <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 2px 8px rgba(99,102,241,0.30)" }}>
                    <Calendar className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Schedule</h3>
                </div>
                <div className="px-4 sm:px-5 py-4">
                  <div className="grid grid-cols-2 sm:grid-cols-[180px_160px_1fr_72px_72px] gap-2 sm:gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Pickup Date</Label>
                      <DatePickerInput
                        value={watch("pickupDate") || ""}
                        onChange={(v) => setValue("pickupDate", v, { shouldValidate: true })}
                        hasError={!!errors.pickupDate}
                      />
                      {errors.pickupDate && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Pickup Time</Label>
                      <Input
                        type="text"
                        value={watch("pickupTime") || ""}
                        onChange={(e) => setValue("pickupTime", e.target.value)}
                        onBlur={(e) => setValue("pickupTime", formatTime(e.target.value), { shouldValidate: true })}
                        placeholder="e.g. 3:00 PM"
                        autoComplete="off"
                        className={`h-9 text-sm ${errors.pickupTime ? "border-red-400" : ""}`}
                      />
                      {errors.pickupTime && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Service Type</Label>
                      <Select
                        value={tripTypeValue}
                        onValueChange={(v) => {
                          if (typeof v === "string") {
                            setTripTypeValue(v)
                            setValue("tripType", v)
                          }
                        }}
                      >
                        <SelectTrigger className={`h-9 text-sm w-full ${errors.tripType ? "border-red-400" : ""}`}>
                          <span className={tripTypeValue ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                            {tripTypeValue
                              ? (enabledTypes.find(t => t.value === tripTypeValue)?.label ?? tripTypeValue)
                              : "Select type"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {enabledTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.tripType && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Pax</Label>
                      <Input
                        type="number" min={1}
                        {...register("passengerCount", { valueAsNumber: true })}
                        className="h-9 text-sm text-center"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Bags</Label>
                      <Input
                        type="number" min={0}
                        {...register("luggageCount", { valueAsNumber: true })}
                        className="h-9 text-sm text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Card 3: Route ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100"
                  style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.05) 0%, transparent 70%)" }}>
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 2px 8px rgba(16,185,129,0.30)" }}>
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Route</h3>
                  {stops.length > 0 && (
                    <span className="ml-auto text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      {stops.length} stop{stops.length !== 1 ? "s" : ""} added
                    </span>
                  )}
                </div>
                <div className="px-5 py-4">
                  <RouteBuilder stops={stops} setStops={setStops} stopsError={stopsError} pickupDate={watch("pickupDate") || ""} />
                </div>
              </div>

              {/* ── Card 4: Notes (tabbed) ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100"
                  style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.05) 0%, transparent 70%)" }}>
                  <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center flex-shrink-0"
                    style={{ boxShadow: "0 2px 8px rgba(245,158,11,0.30)" }}>
                    <FileText className="w-3 h-3 text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Notes</h3>
                  <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5">
                    {(["trip", "internal"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setNotesTab(tab)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          notesTab === tab
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {tab === "trip" ? "Trip Notes" : "Internal"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-4">
                  {notesTab === "trip" ? (
                    <Textarea
                      {...register("tripNotes")}
                      rows={3}
                      className="text-sm resize-none"
                      placeholder="Notes visible to the driver and customer…"
                    />
                  ) : (
                    <>
                      <Textarea
                        {...register("internalNotes")}
                        rows={3}
                        className="text-sm resize-none"
                        placeholder="Dispatch notes, reminders (not visible to customer)…"
                      />
                      <p className="mt-2 text-[11px] text-amber-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        Internal only — not visible to the customer
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* ── Card 5: Attachments ── */}
              <TripAttachmentsSection
                mode="create"
                onPendingFilesChange={setPendingAttachments}
              />

            </div>

            {/* ─── Right: Sticky sidebar ─── */}
            <div className="w-full lg:w-[288px] lg:flex-shrink-0 lg:sticky lg:top-5 space-y-4">

              {/* Dispatch card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 rounded-t-2xl">
                  <Car className="w-3.5 h-3.5 text-gray-400" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Dispatch</h4>
                </div>
                <div className="px-4 py-3.5 space-y-2.5">
                  {/* Driver label row with inline Primary/Secondary toggle */}
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-900">Driver</Label>
                    <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => setDispatchTab("primary")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150",
                          dispatchTab === "primary"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Primary
                      </button>
                      <button
                        type="button"
                        onClick={() => setDispatchTab("secondary")}
                        className={cn(
                          "relative px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150",
                          dispatchTab === "secondary"
                            ? "bg-white text-gray-800 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        )}
                      >
                        Secondary
                        {(secondaryDriverIdValue || secondaryVehicleIdValue) && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  {dispatchTab === "primary" ? (
                    <>
                      <DriverPickerCard
                        label={null}
                        drivers={drivers?.filter((d) => d.status === "ACTIVE") ?? []}
                        value={driverIdValue}
                        onChange={(id) => { setDriverIdValue(id); setValue("driverId", id) }}
                        isLoading={driversLoading}
                      />
                      {/* Type Dropdown */}
                      <div>
                        <Label htmlFor="vehicle-type" className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2">Type</Label>
                        <Select
                          value={vehicleTypeValue}
                          onValueChange={(value) => {
                            if (typeof value === "string") {
                              setVehicleTypeValue(value)
                              setValue("vehicleType", value as any)
                            }
                          }}
                        >
                          <SelectTrigger id="vehicle-type" className="w-full">
                            <SelectValue placeholder="Select vehicle type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {vehicleTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <VehiclePickerCard
                        vehicles={vehicles?.filter((v) => v.status === "ACTIVE") ?? []}
                        value={vehicleIdValue}
                        passengerCount={watch("passengerCount") || 1}
                        onChange={(id) => { setVehicleIdValue(id); setValue("vehicleId", id) }}
                        isLoading={vehiclesLoading}
                      />
                    </>
                  ) : (
                    <div className="space-y-2.5">
                      <DriverPickerCard
                        label={null}
                        drivers={drivers?.filter((d) => d.status === "ACTIVE") ?? []}
                        value={secondaryDriverIdValue}
                        onChange={(id) => { setSecondaryDriverIdValue(id); setValue("secondaryDriverId", id) }}
                        isLoading={driversLoading}
                      />
                      <VehiclePickerCard
                        vehicles={vehicles?.filter((v) => v.status === "ACTIVE") ?? []}
                        value={secondaryVehicleIdValue}
                        passengerCount={watch("passengerCount") || 1}
                        onChange={(id) => { setSecondaryVehicleIdValue(id); setValue("secondaryVehicleId", id) }}
                        isLoading={vehiclesLoading}
                      />
                      {(secondaryDriverIdValue || secondaryVehicleIdValue) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSecondaryDriverIdValue("")
                            setSecondaryVehicleIdValue("")
                            setValue("secondaryDriverId", "")
                            setValue("secondaryVehicleId", "")
                          }}
                          className="w-full text-[11px] text-red-400 hover:text-red-600 transition-colors text-center py-1"
                        >
                          Clear secondary assignment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Farm Out Partner Card */}
              <FarmOutPartnerCard
                selectedPartnerId={selectedPartnerId}
                onSelectPartner={setSelectedPartnerId}
              />

              {/* Pricing card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Pricing</h4>
                </div>
                <div className="px-4 py-3.5 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Base Fare</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                        <Input
                          type="number" step="0.01"
                          {...register("price", { valueAsNumber: true })}
                          className="pl-6 h-9 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-gray-900">Gratuity %</Label>
                      <Input
                        type="number" min={0} max={100}
                        {...register("gratuityPercent", { valueAsNumber: true })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 px-4 py-3.5 space-y-2" style={{ background: "linear-gradient(to bottom, #f9fafb, #ffffff)" }}>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Base Fare</span>
                      <span>{price > 0 ? formatCurrency(price) : "—"}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Gratuity ({gratuityPercent}%)</span>
                      <span>{price > 0 ? formatCurrency(gratuityAmt) : "—"}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2.5 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-600">Total</span>
                      <span className={`text-2xl font-bold tracking-tight ${price > 0 ? "text-gray-900" : "text-gray-200"}`}>
                        {price > 0 ? formatCurrency(total) : "$0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100">
                  <Star className="w-3.5 h-3.5 text-gray-400" />
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Add-ons</h4>
                </div>
                <div className="px-4 py-3.5 space-y-2.5">

                  {/* VIP + Meet & Greet */}
                  <div className="grid grid-cols-2 gap-2">
                    {simpleAddons.map(({ name, label, icon: Icon, active }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setValue(name, !active)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                          active
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Child Seats — expandable */}
                  <div
                    className="rounded-xl border overflow-hidden transition-colors"
                    style={{
                      borderColor: totalChildSeats > 0 ? "rgba(37,99,235,0.25)" : "rgb(229,231,235)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setChildSeatsOpen((o) => !o)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5"
                      style={{ background: totalChildSeats > 0 ? "rgba(37,99,235,0.03)" : "white" }}
                    >
                      <Baby className={`w-3.5 h-3.5 flex-shrink-0 ${totalChildSeats > 0 ? "text-blue-500" : "text-gray-400"}`} />
                      <span className={`text-xs font-semibold flex-1 text-left ${totalChildSeats > 0 ? "text-blue-700" : "text-gray-500"}`}>
                        Child Seats
                      </span>
                      {totalChildSeats > 0 ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {totalChildSeats} seat{totalChildSeats !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">None</span>
                      )}
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${childSeatsOpen ? "rotate-180" : ""}`} />
                    </button>

                    {childSeatsOpen && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {CHILD_SEAT_TYPES.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50/60">
                            <span className="text-xs text-gray-700 flex-1 font-medium">{label}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: Math.max(0, s[key] - 1) }))}
                                disabled={childSeats[key] === 0}
                                className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm leading-none"
                              >
                                −
                              </button>
                              <span className={`w-5 text-center text-sm font-bold tabular-nums ${childSeats[key] > 0 ? "text-blue-700" : "text-gray-400"}`}>
                                {childSeats[key]}
                              </span>
                              <button
                                type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: s[key] + 1 }))}
                                className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors text-sm leading-none"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Reservation Metadata */}
              <ReservationMetadata />

              {/* Submit */}
              {submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}
              <Button
                form="new-trip-form"
                type="submit"
                disabled={createTrip.isPending}
                className="w-full bg-[#2563EB] hover:bg-blue-700 text-white h-11 text-sm font-semibold rounded-xl"
                style={{ boxShadow: "0 4px 14px rgba(37,99,235,0.30)" }}
              >
                {createTrip.isPending ? "Creating…" : "Create Reservation"}
              </Button>

            </div>

          </div>
        </form>

        {/* ─── Success Modal ─── */}
        {createdTrip && createdConfirmation && (
          <TripSuccessModal
            trip={createdTrip}
            confirmationNumber={createdConfirmation}
            open={!!createdConfirmation && !!createdTrip}
            onClose={() => {
              setCreatedConfirmation(null)
              setCreatedTrip(null)
            }}
            onNewReservation={() => {
              setCreatedConfirmation(null)
              setCreatedTrip(null)
              router.push("/trips/new")
            }}
            onGoToDispatch={() => router.push("/dispatch")}
            onSendEmail={(recipient) => {
              setSendEmailRecipient(recipient)
              setSendEmailOpen(true)
            }}
          />
        )}

        {/* ─── Email Modal ─── */}
        {createdTrip && (
          <SendEmailModal
            trip={createdTrip}
            open={sendEmailOpen}
            onOpenChange={setSendEmailOpen}
            defaultRecipient={sendEmailRecipient}
          />
        )}

      </div>
    </div>
  )
}
