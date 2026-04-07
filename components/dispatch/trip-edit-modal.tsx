"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  X, Plane, Phone, Copy, Check, User, Car, UserCheck,
  ChevronDown, MapPin, Building2, Ship, Plus, Star,
  AlertTriangle, Baby, ArrowRightLeft, Pencil, Send, Calendar,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerInput } from "@/components/ui/date-picker"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { FBOAutocomplete } from "@/components/ui/fbo-autocomplete"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useServiceTypes } from "@/lib/hooks/use-service-types"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useTripFarmOuts, useCancelFarmOut } from "@/lib/hooks/use-farm-outs"
import { FarmOutModal } from "@/components/dispatch/farm-out-modal"
import { SendEmailModal } from "@/components/email/send-email-modal"
import { CopyReservationModal } from "@/components/dispatch/copy-reservation-modal"
import { formatCurrency, formatPhone, getTripStatusLabel, cn } from "@/lib/utils"
import type { Trip, TripStatus, Driver, Vehicle, Customer } from "@/types"
import { format, parse, isValid } from "date-fns"

// ── Status helpers ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<TripStatus, string> = {
  QUOTE:            "bg-slate-100 text-slate-600",
  CONFIRMED:        "bg-blue-100 text-blue-700",
  DISPATCHED:       "bg-violet-100 text-violet-700",
  DRIVER_EN_ROUTE:  "bg-amber-100 text-amber-700",
  DRIVER_ARRIVED:   "bg-yellow-100 text-yellow-800",
  IN_PROGRESS:      "bg-emerald-100 text-emerald-700",
  COMPLETED:        "bg-gray-100 text-gray-500",
  CANCELLED:        "bg-red-100 text-red-600",
  NO_SHOW:          "bg-red-100 text-red-600",
}

const STATUS_DOT: Record<TripStatus, string> = {
  QUOTE:            "bg-slate-400",
  CONFIRMED:        "bg-blue-500",
  DISPATCHED:       "bg-violet-500",
  DRIVER_EN_ROUTE:  "bg-amber-500",
  DRIVER_ARRIVED:   "bg-yellow-500",
  IN_PROGRESS:      "bg-emerald-500",
  COMPLETED:        "bg-gray-400",
  CANCELLED:        "bg-red-500",
  NO_SHOW:          "bg-red-400",
}

const ALL_STATUSES: TripStatus[] = [
  "QUOTE", "CONFIRMED", "DISPATCHED", "DRIVER_EN_ROUTE",
  "DRIVER_ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW",
]

function StatusDropdown({ trip, onUpdate }: { trip: Trip; onUpdate: (status: TripStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all",
          "hover:brightness-95 active:scale-95",
          STATUS_BADGE[trip.status]
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[trip.status])} />
        {getTripStatusLabel(trip.status)}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          {ALL_STATUSES.map((s) => {
            const isActive = s === trip.status
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onUpdate(s); setOpen(false) }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors",
                  isActive ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", STATUS_DOT[s])} />
                {getTripStatusLabel(s)}
                {isActive && <Check className="w-3 h-3 ml-auto text-gray-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── formatTime helper ────────────────────────────────────────────────────────

function formatTime(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  const lower = s.toLowerCase()
  let ampm: "AM" | "PM" | null = null
  let timeStr = lower
  if (timeStr.endsWith("am")) { ampm = "AM"; timeStr = timeStr.slice(0, -2).trim() }
  else if (timeStr.endsWith("pm")) { ampm = "PM"; timeStr = timeStr.slice(0, -2).trim() }
  let hours: number, minutes: number
  if (timeStr.includes(":")) {
    const [h, m] = timeStr.split(":")
    hours = parseInt(h, 10); minutes = parseInt(m, 10) || 0
  } else if (timeStr.length <= 2) {
    hours = parseInt(timeStr, 10); minutes = 0
  } else if (timeStr.length === 3) {
    hours = parseInt(timeStr[0], 10); minutes = parseInt(timeStr.slice(1), 10)
  } else if (timeStr.length === 4) {
    hours = parseInt(timeStr.slice(0, 2), 10); minutes = parseInt(timeStr.slice(2), 10)
  } else { return raw }
  if (isNaN(hours) || isNaN(minutes) || hours > 23 || minutes > 59) return raw
  if (!ampm) {
    if (hours === 0) { ampm = "AM"; hours = 12 }
    else if (hours < 12) { ampm = "AM" }
    else if (hours === 12) { ampm = "PM" }
    else { ampm = "PM"; hours -= 12 }
  }
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`
}

// ── Stop types ───────────────────────────────────────────────────────────────

type StopLocationType = "address" | "airport" | "seaport" | "fbo"
type StopRole = "pickup" | "stop" | "wait" | "drop"

interface StopEntry {
  id: string; locType: StopLocationType; role: StopRole
  address: string; notes: string; flightNumber: string
  locationName?: string; address2?: string; city?: string; state?: string
  zip?: string; country?: string; phone?: string; timeIn?: string
  tailNumber?: string
  seaportCode?: string; portName?: string; cruiseShipName?: string
  cruiseLineName?: string; arrivingDepartingTo?: string; seaportInstructions?: string
  airportCode?: string; airportName?: string; airlineCode?: string; airlineName?: string
  arrDep?: string; terminalGate?: string; airportInstructions?: string
  etaEtd?: string; meetOption?: string
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
  pickup: { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  drop:   { dot: "bg-red-500",     pill: "bg-red-50 text-red-700 border-red-200" },
  stop:   { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border-blue-200" },
  wait:   { dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700 border-amber-200" },
}
const ROLE_PREFIX: Record<StopRole, string> = { pickup: "PU", drop: "DO", stop: "ST", wait: "WT" }
const ROLE_ROW_BG: Record<StopRole, string> = {
  pickup: "bg-sky-50 text-sky-900 border-sky-100",
  drop:   "bg-red-50 text-red-900 border-red-100",
  stop:   "bg-gray-50 text-gray-800 border-gray-100",
  wait:   "bg-amber-50 text-amber-900 border-amber-100",
}

// ── RouteBuilder ─────────────────────────────────────────────────────────────

function RouteBuilder({ stops, setStops, stopsError }: {
  stops: StopEntry[]
  setStops: React.Dispatch<React.SetStateAction<StopEntry[]>>
  stopsError: string
}) {
  const [locType, setLocType] = useState<StopLocationType>("address")
  const [role, setRole] = useState<StopRole>("pickup")
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
  const [tailNumber, setTailNumber] = useState("")
  const [seaportCode, setSeaportCode] = useState("")
  const [portName, setPortName] = useState("")
  const [cruiseShipName, setCruiseShipName] = useState("")
  const [cruiseLineName, setCruiseLineName] = useState("")
  const [arrivingDepartingTo, setArrivingDepartingTo] = useState("")
  const [seaportInstructions, setSeaportInstructions] = useState("")
  const [addError, setAddError] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  function resetForm() {
    setIsEditing(false)
    setLocationName(""); setAddress1(""); setAddress2(""); setCity("")
    setStateVal(""); setZip(""); setCountry(""); setPhone(""); setTimeIn(""); setNotes("")
    setAirportCode(""); setAirportName(""); setAirlineCode(""); setAirlineName("")
    setFlightNumber(""); setArrDep(""); setTerminalGate(""); setAirportInstructions("")
    setEtaEtd(""); setMeetOption(""); setTailNumber("")
    setSeaportCode(""); setPortName(""); setCruiseShipName(""); setCruiseLineName("")
    setArrivingDepartingTo(""); setSeaportInstructions("")
  }

  function editStop(stop: StopEntry) {
    setIsEditing(true)
    setStops(prev => prev.filter(s => s.id !== stop.id))
    setLocType(stop.locType)
    setRole(stop.role)
    setLocationName(stop.locationName ?? "")
    setAddress1(stop.address ?? "")
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

  function handleAdd() {
    let primaryAddr = ""
    if (locType === "address" || locType === "fbo") primaryAddr = (locType === "fbo" ? locationName : address1).trim()
    else if (locType === "airport") primaryAddr = (airportCode || airportName).trim()
    else if (locType === "seaport") primaryAddr = (seaportCode || portName).trim()
    if (!primaryAddr) { setAddError("Enter a location before adding"); return }
    setAddError("")

    let formattedAddress = ""
    if (locType === "address") {
      formattedAddress = [locationName || address1, address2, city, stateVal ? `${stateVal}${zip ? " " + zip : ""}` : zip].filter(Boolean).join(", ")
    } else if (locType === "fbo") {
      formattedAddress = [locationName || address1, city, stateVal].filter(Boolean).join(", ")
    } else if (locType === "airport") {
      formattedAddress = [airportName || airportCode, airportCode && airportName ? `(${airportCode})` : ""].filter(Boolean).join(" ") || airportCode || airportName
    } else if (locType === "seaport") {
      formattedAddress = [portName || seaportCode, seaportCode && portName ? `(${seaportCode})` : ""].filter(Boolean).join(" ") || seaportCode || portName
    }

    setIsEditing(false)
    setStops(prev => [...prev, {
      id: `s${Date.now()}`, locType, role,
      address: formattedAddress, notes: notes.trim(), flightNumber: flightNumber.trim(),
      locationName: locationName.trim() || undefined, address2: address2.trim() || undefined,
      city: city.trim() || undefined, state: stateVal.trim() || undefined,
      zip: zip.trim() || undefined, country: country.trim() || undefined,
      phone: phone.trim() || undefined, timeIn: timeIn.trim() || undefined,
      tailNumber: tailNumber.trim() || undefined,
      airportCode: airportCode.trim() || undefined, airportName: airportName.trim() || undefined,
      airlineCode: airlineCode.trim() || undefined, airlineName: airlineName.trim() || undefined,
      arrDep: arrDep.trim() || undefined, terminalGate: terminalGate.trim() || undefined,
      airportInstructions: airportInstructions.trim() || undefined,
      etaEtd: etaEtd.trim() || undefined, meetOption: meetOption.trim() || undefined,
      seaportCode: seaportCode.trim() || undefined, portName: portName.trim() || undefined,
      cruiseShipName: cruiseShipName.trim() || undefined, cruiseLineName: cruiseLineName.trim() || undefined,
      arrivingDepartingTo: arrivingDepartingTo.trim() || undefined, seaportInstructions: seaportInstructions.trim() || undefined,
    }])
    resetForm()
    if (role === "pickup") setRole("drop")
  }

  return (
    <div className="space-y-3">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-gray-100 bg-gray-50/80">
          {STOP_LOC_TABS.map(({ type: t, label, Icon }) => (
            <button key={t} type="button" onClick={() => { setLocType(t); resetForm() }}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-all ${
                locType === t ? "border-blue-500 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="p-3 bg-white space-y-2">
          {locType === "address" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Location Name</Label>
                <Input value={locationName} onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Hotel, office, venue name…" className="h-9 text-sm" autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Address 1 *</Label>
                <Input value={address1} onChange={(e) => { setAddress1(e.target.value); setAddError("") }}
                  placeholder="123 Main St" className={`h-9 text-sm ${addError ? "border-red-400" : ""}`} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Address 2</Label>
                <Input value={address2} onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Suite, floor, apt…" className="h-9 text-sm" autoComplete="off" />
              </div>
              <div className="grid grid-cols-[1fr_90px_90px_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">City</Label>
                  <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">State</Label>
                  <Input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="FL" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Zip</Label>
                  <Input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33101" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(305) 555-0000" type="tel" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)} onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    placeholder="e.g. 3:00 PM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, entrance, driver instructions…" className="h-8 text-xs" />
              </div>
            </>
          )}
          {locType === "airport" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Airport Code *</Label>
                  <Input value={airportCode} onChange={(e) => { setAirportCode(e.target.value); setAddError("") }}
                    placeholder="MIA" className={`h-9 text-sm ${addError ? "border-red-400" : ""}`} autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Airport Name</Label>
                  <Input value={airportName} onChange={(e) => { setAirportName(e.target.value); setAddError("") }}
                    placeholder="Miami International" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[100px_1fr_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Airline Code</Label>
                  <Input value={airlineCode} onChange={(e) => setAirlineCode(e.target.value)} placeholder="AA" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Airline Name</Label>
                  <Input value={airlineName} onChange={(e) => setAirlineName(e.target.value)} placeholder="American Airlines" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Flight #</Label>
                  <Input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="AA 123" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[120px_120px_1fr_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Arr/Dep</Label>
                  <select value={arrDep} onChange={(e) => setArrDep(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select…</option>
                    <option value="Arrival">Arrival</option>
                    <option value="Departure">Departure</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Terminal/Gate</Label>
                  <Input value={terminalGate} onChange={(e) => setTerminalGate(e.target.value)} placeholder="D22" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Airport Instructions</Label>
                  <Input value={airportInstructions} onChange={(e) => setAirportInstructions(e.target.value)} placeholder="Meet at baggage claim…" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">ETA/ETD</Label>
                  <Input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)} onBlur={(e) => setEtaEtd(formatTime(e.target.value))}
                    placeholder="3:00 PM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Meet Option</Label>
                  <select value={meetOption} onChange={(e) => setMeetOption(e.target.value)}
                    className="w-full h-9 text-sm border border-gray-200 rounded-md px-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="">Select…</option>
                    <option>Curbside</option><option>Inside</option>
                    <option>Baggage Claim</option><option>Gate</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Driver instructions…" className="h-9 text-sm" />
                </div>
              </div>
            </>
          )}
          {locType === "seaport" && (
            <>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Seaport Code *</Label>
                  <Input value={seaportCode} onChange={(e) => { setSeaportCode(e.target.value.toUpperCase()); setAddError("") }}
                    placeholder="MIA" className={`h-9 text-sm ${addError ? "border-red-400" : ""}`} autoComplete="off" maxLength={6} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Port Name</Label>
                  <Input value={portName} onChange={(e) => { setPortName(e.target.value); setAddError("") }}
                    placeholder="Port of Miami" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Cruise Ship</Label>
                  <Input value={cruiseShipName} onChange={(e) => setCruiseShipName(e.target.value)} placeholder="Symphony of the Seas" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Cruise Line</Label>
                  <Input value={cruiseLineName} onChange={(e) => setCruiseLineName(e.target.value)} placeholder="Royal Caribbean" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Arriving From / Departing To</Label>
                  <Input value={arrivingDepartingTo} onChange={(e) => setArrivingDepartingTo(e.target.value)} placeholder="Nassau, Bahamas" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">ETA / ETD</Label>
                  <Input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)} onBlur={(e) => setEtaEtd(formatTime(e.target.value))}
                    placeholder="9:00 AM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Seaport Instructions</Label>
                <Select value={seaportInstructions} onValueChange={(v) => typeof v === "string" && setSeaportInstructions(v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select instructions…" /></SelectTrigger>
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
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pier, terminal, additional instructions…" className="h-8 text-xs" />
              </div>
            </>
          )}
          {locType === "fbo" && (
            <>
              <div className="grid grid-cols-[1fr_140px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">FBO Name *</Label>
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
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tail #</Label>
                  <Input value={tailNumber} onChange={(e) => setTailNumber(e.target.value)} placeholder="N12345" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Address 1</Label>
                  <Input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="123 Aviation Blvd" className="h-9 text-sm" autoComplete="off" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">City / State</Label>
                  <div className="flex gap-2">
                    <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                    <Input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="FL" className="h-9 text-sm w-16" autoComplete="off" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(305) 555-0000" type="tel" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Time In</Label>
                  <Input value={timeIn} onChange={(e) => setTimeIn(e.target.value)} onBlur={(e) => setTimeIn(formatTime(e.target.value))}
                    placeholder="3:00 PM" className="h-9 text-sm" autoComplete="off" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Driver instructions, access codes…" className="h-8 text-xs" />
              </div>
            </>
          )}
          {addError && <p className="text-xs text-red-500">{addError}</p>}
        </div>

        {/* Role + Add */}
        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50/50 border-t border-gray-100">
          {STOP_ROLES.map(({ value, label }) => (
            <label key={value}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
                role === value ? STOP_ROLE_STYLE[value].pill : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
              }`}>
              <input type="radio" name="edit-modal-role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
              <span className={`w-1.5 h-1.5 rounded-full ${
                role === value ? (value === "pickup" ? "bg-emerald-500" : value === "drop" ? "bg-red-500" : value === "wait" ? "bg-amber-500" : "bg-blue-500") : "bg-gray-300"
              }`} />
              {label}
            </label>
          ))}
          <button type="button" onClick={handleAdd}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors">
            <Plus className="w-3 h-3" />Add to Route
          </button>
        </div>
      </div>

      {/* Route list */}
      {stops.length > 0 ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Routing Information</p>
          </div>
          {stops.map((stop) => (
            <div key={stop.id}
              onClick={() => { if (!isEditing) editStop(stop) }}
              className={`group flex items-start gap-3 px-3 py-2.5 border-b last:border-b-0 border-gray-100 transition-all ${ROLE_ROW_BG[stop.role]} ${isEditing ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-95"}`}>
              <span className="text-[11px] font-bold font-mono flex-shrink-0 mt-0.5 w-6">{ROLE_PREFIX[stop.role]}:</span>
              <div className="flex-1 min-w-0">
                {stop.locationName && <div className="text-xs font-semibold truncate">{stop.locationName}</div>}
                <div className="text-sm font-medium truncate">{stop.address}</div>
                {stop.tailNumber && <div className="text-[11px] opacity-70">Tail: {stop.tailNumber}</div>}
                {stop.flightNumber && <div className="text-[11px] opacity-70">Flight: {stop.flightNumber}{stop.arrDep ? ` · ${stop.arrDep}` : ""}{stop.terminalGate ? ` · Gate ${stop.terminalGate}` : ""}</div>}
                {stop.etaEtd && <div className="text-[11px] opacity-60">ETA/ETD: {stop.etaEtd}</div>}
                {stop.cruiseShipName && <div className="text-[11px] opacity-70">Ship: {stop.cruiseShipName}{stop.cruiseLineName ? ` · ${stop.cruiseLineName}` : ""}</div>}
                {stop.notes && <div className="text-[11px] opacity-60 truncate">{stop.notes}</div>}
                {(stop.phone || stop.timeIn) && (
                  <div className="text-[11px] opacity-60">
                    {stop.phone && <span>{stop.phone}</span>}
                    {stop.phone && stop.timeIn && <span className="mx-1">·</span>}
                    {stop.timeIn && <span>Time In: {stop.timeIn}</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                {!isEditing && (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3 h-3 text-gray-400" />
                  </span>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); if (!isEditing) setStops(prev => prev.filter(s => s.id !== stop.id)) }}
                  disabled={isEditing}
                  className="text-gray-300 hover:text-red-400 transition-colors disabled:pointer-events-none">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 text-center py-5 border border-dashed border-gray-200 rounded-xl">
          Add locations above to build the trip itinerary
        </div>
      )}
      {stopsError && <p className="text-xs text-red-500">{stopsError}</p>}
    </div>
  )
}

// ── DriverPickerCard ─────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function DriverPickerCard({ drivers, value, onChange }: { drivers: Driver[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = drivers.find((d) => d.id === value) ?? null

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropStyle(spaceBelow < 240
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 })
    }
    setOpen(true)
  }

  return (
    <div ref={ref}>
      {selected ? (
        <div className="group flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5 hover:border-violet-200 transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm overflow-hidden">
              {selected.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.avatarUrl} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(selected.name)
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{selected.name}</div>
            {selected.phone && <div className="text-[11px] text-violet-500 truncate">{formatPhone(selected.phone)}</div>}
          </div>
          <button type="button" onClick={() => onChange("")}
            className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-300 hover:text-red-400 hover:border-red-200 opacity-0 group-hover:opacity-100 transition-all shadow-sm flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
          className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-500 transition-all">
          <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            <UserCheck className="w-4 h-4 text-gray-300" />
          </div>
          <span className="flex-1 text-left text-sm">Assign driver…</span>
          <ChevronDown className={cn("w-4 h-4 text-gray-300 transition-transform", open && "rotate-180")} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden">
          <div className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">Active Drivers</div>
          <div className="max-h-48 overflow-y-auto">
            {drivers.length === 0
              ? <div className="px-4 py-4 text-xs text-gray-400 text-center">No active drivers</div>
              : drivers.map((d) => (
                <button key={d.id} type="button" onClick={() => { onChange(d.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-violet-50/60 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                      {d.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(d.name)
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold text-gray-800">{d.name}</div>
                    {d.phone && <div className="text-[11px] text-gray-400">{formatPhone(d.phone)}</div>}
                  </div>
                </button>
              ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── VehiclePickerCard ────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABEL: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Vehicle",
}

function VehiclePickerCard({ vehicles, value, onChange }: { vehicles: Vehicle[]; value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = vehicles.find((v) => v.id === value) ?? null

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  function openDropdown() {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setDropStyle(spaceBelow < 240
        ? { position: "fixed", bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width, zIndex: 9999 }
        : { position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 9999 })
    }
    setOpen(true)
  }

  return (
    <div ref={ref} className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-500">Vehicle</Label>
      {selected ? (
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{selected.name}</div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500">
              <span>{VEHICLE_TYPE_LABEL[selected.type] ?? "Vehicle"}</span>
              <span className="text-gray-300">·</span>
              <span>{selected.capacity} pax</span>
              {selected.color && <><span className="text-gray-300">·</span><span>{selected.color}</span></>}
            </div>
          </div>
          <button type="button" onClick={() => onChange("")} className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50/50 transition-all">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <Car className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <span className="flex-1 text-left">Select vehicle…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={dropStyle} className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">Available Vehicles</div>
          <div className="max-h-52 overflow-y-auto">
            {vehicles.length === 0
              ? <div className="px-3 py-3 text-xs text-gray-400 text-center">No active vehicles</div>
              : vehicles.map((v) => (
                <button key={v.id} type="button" onClick={() => { onChange(v.id); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Car className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-800">{v.name}</div>
                    <div className="text-[11px] text-gray-400">{VEHICLE_TYPE_LABEL[v.type] ?? v.type} · {v.capacity} pax{v.color ? ` · ${v.color}` : ""}</div>
                  </div>
                </button>
              ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ── Form schema ──────────────────────────────────────────────────────────────

const schema = z.object({
  tripType:        z.string(),
  pickupDate:      z.string().min(1, "Required"),
  pickupTime:      z.string().min(1, "Required"),
  passengerName:   z.string().optional(),
  passengerPhone:  z.string().optional(),
  passengerEmail:  z.string().optional(),
  passengerCount:  z.number().int().min(1),
  luggageCount:    z.number().int().min(0).optional(),
  price:           z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().optional()),
  gratuityPercent: z.preprocess((v) => (typeof v === "number" && isNaN(v) ? 0 : v), z.number().min(0).max(100)),
  clientRef:       z.string().optional(),
  notes:           z.string().optional(),
  internalNotes:   z.string().optional(),
  meetAndGreet:    z.boolean(),
  childSeat:       z.boolean(),
  wheelchairAccess:z.boolean(),
  vip:             z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Main component ───────────────────────────────────────────────────────────

interface TripEditModalProps {
  trip: Trip | null
  open: boolean
  onClose: () => void
}

export function TripEditModal({ trip, open, onClose }: TripEditModalProps) {
  const updateTrip = useUpdateTrip()
  const { data: allDrivers = [] } = useDrivers()
  const { data: allVehicles = [] } = useVehicles()
  const { data: serviceTypes = [] } = useServiceTypes()
  const enabledTypes = serviceTypes.filter((t) => t.isEnabled)

  const isFarmedIn = !!trip?.farmedIn

  const [farmOutOpen, setFarmOutOpen]         = useState(false)
  const [sendEmailOpen, setSendEmailOpen]     = useState(false)
  const [copyOpen, setCopyOpen]               = useState(false)
  const { data: farmOuts } = useTripFarmOuts(isFarmedIn ? null : (trip?.id ?? null))
  const pendingFarmOut = farmOuts?.find((f) => f.status === "PENDING")
  const acceptedFarmOut = farmOuts?.find((f) => f.status === "ACCEPTED")
  const activeFarmOut = acceptedFarmOut || pendingFarmOut
  const cancelFarmOut = useCancelFarmOut(trip?.id ?? "")

  const [copied, setCopied] = useState(false)
  const [driverIdValue, setDriverIdValue] = useState("")
  const [vehicleIdValue, setVehicleIdValue] = useState("")
  const [secondaryDriverIdValue, setSecondaryDriverIdValue] = useState("")
  const [secondaryVehicleIdValue, setSecondaryVehicleIdValue] = useState("")
  const [dispatchTab, setDispatchTab] = useState<"primary" | "secondary">("primary")
  const [tripTypeValue, setTripTypeValue] = useState("")
  const [customerSearch, setCustomerSearch] = useState("")
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const customerPickerRef = useRef<HTMLDivElement>(null)
  const [stops, setStops] = useState<StopEntry[]>([])
  const [stopsError, setStopsError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [notesTab, setNotesTab] = useState<"trip" | "internal">("trip")
  const [childSeats, setChildSeats] = useState({ forward: 0, rear: 0, booster: 0 })
  const [childSeatsOpen, setChildSeatsOpen] = useState(false)

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

  const CHILD_SEAT_TYPES = [
    { key: "forward" as const, label: "Forward Facing" },
    { key: "rear"    as const, label: "Rear Facing"    },
    { key: "booster" as const, label: "Booster"        },
  ]
  const totalChildSeats = childSeats.forward + childSeats.rear + childSeats.booster

  const { data: allCustomers = [] } = useCustomers(customerSearch)
  const activeDrivers = allDrivers.filter((d) => d.status === "ACTIVE")
  const activeVehicles = allVehicles.filter((v) => v.status === "ACTIVE")

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  // Convert a stored date (ISO or MM/DD/YYYY) → display format MM/DD/YYYY
  function toDisplayDate(raw: string | undefined): string {
    if (!raw) return ""
    // Already MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw
    // ISO: YYYY-MM-DD or full ISO string
    const iso = raw.includes("T") ? raw.split("T")[0] : raw
    const d = parse(iso, "yyyy-MM-dd", new Date())
    return isValid(d) ? format(d, "MM/dd/yyyy") : raw
  }

  useEffect(() => {
    if (!trip) return
    const displayDate = toDisplayDate(trip.pickupDate ?? "")
    setTripTypeValue(trip.tripType ?? "ONE_WAY")
    setDriverIdValue(trip.driverId ?? "")
    setVehicleIdValue(trip.vehicleId ?? "")
    setSecondaryDriverIdValue(trip.secondaryDriverId ?? "")
    setSecondaryVehicleIdValue(trip.secondaryVehicleId ?? "")
    setDispatchTab("primary")
    const existing = Array.isArray(trip.additionalPassengers) ? trip.additionalPassengers : []
    setAdditionalPassengers(existing.map((p: { firstName?: string; lastName?: string; phone?: string; email?: string }) => ({
      id: Math.random().toString(36).slice(2),
      firstName: p.firstName ?? "", lastName: p.lastName ?? "",
      phone: p.phone ?? "", email: p.email ?? "",
    })))
    setSaveError("")
    setStopsError("")
    setChildSeatsOpen(false)
    setCustomerPickerOpen(false)
    setCustomerSearch("")
    setSelectedCustomer(trip.customer ?? null)

    // Parse existing child seat details
    const parsedSeats = { forward: 0, rear: 0, booster: 0 }
    if (trip.childSeatDetails) {
      try {
        const details = JSON.parse(trip.childSeatDetails) as Array<{ type: string; count: number }>
        details.forEach(({ type, count }) => {
          if (type === "FORWARD_FACING") parsedSeats.forward = count
          if (type === "REAR_FACING")    parsedSeats.rear = count
          if (type === "BOOSTER")        parsedSeats.booster = count
        })
      } catch { /* ignore */ }
    }
    setChildSeats(parsedSeats)

    // Initialise stops from existing trip data
    const initialStops: StopEntry[] = []
    if (trip.pickupAddress) {
      initialStops.push({
        id: "init-pickup", locType: "address", role: "pickup",
        address: trip.pickupAddress, notes: trip.pickupNotes ?? "", flightNumber: trip.flightNumber ?? "",
      })
    }
    if (trip.dropoffAddress) {
      initialStops.push({
        id: "init-drop", locType: "address", role: "drop",
        address: trip.dropoffAddress, notes: trip.dropoffNotes ?? "", flightNumber: "",
      })
    }
    setStops(initialStops)

    reset({
      tripType:        trip.tripType,
      pickupDate:      displayDate,
      pickupTime:      trip.pickupTime,
      passengerName:   trip.passengerName ?? "",
      passengerPhone:  trip.passengerPhone ? formatPhone(trip.passengerPhone) : "",
      passengerEmail:  trip.passengerEmail ?? "",
      passengerCount:  trip.passengerCount,
      luggageCount:    trip.luggageCount ?? 0,
      price:           trip.price ? parseFloat(String(trip.price)) : undefined,
      gratuityPercent: trip.price && trip.gratuity
        ? Math.round((parseFloat(String(trip.gratuity)) / parseFloat(String(trip.price))) * 100)
        : 20,
      clientRef:       trip.clientRef ?? "",
      notes:           trip.notes ?? "",
      internalNotes:   trip.internalNotes ?? "",
      meetAndGreet:    trip.meetAndGreet,
      childSeat:       trip.childSeat,
      wheelchairAccess:trip.wheelchairAccess,
      vip:             trip.vip,
    })
  }, [trip, reset])

  // Close customer picker on outside click
  useEffect(() => {
    if (!customerPickerOpen) return
    function handler(e: MouseEvent) {
      if (customerPickerRef.current && !customerPickerRef.current.contains(e.target as Node)) {
        setCustomerPickerOpen(false)
        setCustomerSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [customerPickerOpen])

  const copyConfirmation = useCallback(() => {
    if (!trip) return
    navigator.clipboard.writeText(trip.tripNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [trip?.tripNumber])

  if (!trip) return null

  const price = watch("price") || 0
  const gratuityPercent = watch("gratuityPercent") || 0
  const gratuityAmt = price ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : 0
  const total = price ? price + gratuityAmt : 0


  function onSubmit(data: FormData) {
    if (!trip) return
    const pickupStop = stops.find(s => s.role === "pickup")
    const dropStop = [...stops].reverse().find(s => s.role === "drop")
    if (!pickupStop?.address.trim()) { setStopsError("A pickup location is required"); return }
    if (!dropStop?.address.trim()) { setStopsError("A drop-off location is required"); return }
    setStopsError("")
    setSaveError("")

    const airportStop = stops.find(s => s.locType === "airport" && s.flightNumber)
    const gratuity = data.price ? Math.round(data.price * ((data.gratuityPercent || 0) / 100) * 100) / 100 : 0
    const totalPrice = data.price ? data.price + gratuity : undefined

    // Convert display date MM/DD/YYYY → ISO YYYY-MM-DD for the API
    let isoDate = data.pickupDate
    const parsed = parse(data.pickupDate, "MM/dd/yyyy", new Date())
    if (isValid(parsed)) isoDate = format(parsed, "yyyy-MM-dd")

    updateTrip.mutate({
      id: trip.id,
      customerId:       selectedCustomer?.id ?? trip.customerId,
      tripType:         tripTypeValue as never,
      pickupDate:       isoDate,
      pickupTime:       data.pickupTime,
      pickupAddress:    pickupStop.address,
      pickupNotes:      pickupStop.notes || undefined,
      dropoffAddress:   dropStop.address,
      dropoffNotes:     dropStop.notes || undefined,
      flightNumber:     airportStop?.flightNumber || undefined,
      passengerName:    data.passengerName || undefined,
      passengerPhone:   data.passengerPhone || undefined,
      passengerEmail:   data.passengerEmail || undefined,
      additionalPassengers: additionalPassengers.map(({ firstName, lastName, phone, email }) => ({
        firstName, lastName,
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
      })) as never,
      driverId:         driverIdValue || undefined,
      vehicleId:        vehicleIdValue || undefined,
      secondaryDriverId:  secondaryDriverIdValue || undefined,
      secondaryVehicleId: secondaryVehicleIdValue || undefined,
      price:            data.price as never,
      gratuity:         gratuity as never,
      totalPrice:       totalPrice as never,
      clientRef:        data.clientRef || undefined,
      notes:            data.notes || undefined,
      internalNotes:    data.internalNotes || undefined,
      meetAndGreet:     data.meetAndGreet,
      childSeat:        totalChildSeats > 0,
      childSeatDetails: totalChildSeats > 0 ? JSON.stringify([
        ...(childSeats.forward > 0 ? [{ type: "FORWARD_FACING", count: childSeats.forward }] : []),
        ...(childSeats.rear    > 0 ? [{ type: "REAR_FACING",    count: childSeats.rear    }] : []),
        ...(childSeats.booster > 0 ? [{ type: "BOOSTER",        count: childSeats.booster }] : []),
      ]) : undefined,
      wheelchairAccess: data.wheelchairAccess,
      vip:              data.vip,
    }, {
      onSuccess: onClose,
      onError: (err) => setSaveError(err instanceof Error ? err.message : "Failed to save changes"),
    })
  }

  const checkboxFields = [
    { name: "vip" as const,          label: "VIP",          icon: Star },
    { name: "meetAndGreet" as const, label: "Meet & Greet", icon: UserCheck },
  ]

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[1180px] w-[96vw] p-0 flex flex-col overflow-hidden max-h-[92vh] gap-0">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          {/* Close */}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Confirmation # */}
          <button type="button" onClick={copyConfirmation} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group flex-shrink-0">
            <span className="text-sm font-mono font-semibold text-blue-700">{trip.tripNumber}</span>
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />}
          </button>

          {/* Status */}
          <StatusDropdown
            trip={trip}
            onUpdate={(status) => updateTrip.mutate({ id: trip.id, status })}
          />

          <div className="flex-1" />

          {/* Copy Reservation */}
          <button
            type="button"
            onClick={() => setCopyOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>

          {/* Send Email */}
          <button
            type="button"
            onClick={() => setSendEmailOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>

          {/* Save Changes */}
          <Button form="trip-edit-form" type="submit" size="sm" disabled={updateTrip.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm px-6 font-semibold">
            {updateTrip.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {/* ── Reservation Details (Compact) ── */}
        <div className="px-6 py-3 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-4 text-sm">
            {/* Created Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600 font-medium">
                {trip.createdAt ? format(new Date(trip.createdAt), 'MMM d, yyyy') : '—'}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">
                {trip.createdAt ? format(new Date(trip.createdAt), 'h:mm a') : '—'}
              </span>
            </div>

            {/* Divider */}
            <span className="text-gray-300">|</span>

            {/* Created By User & Role */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-slate-700">
                {trip.createdBy?.name
                  ? trip.createdBy.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '—'}
              </div>
              <span className="text-gray-900 font-medium truncate">{trip.createdBy?.name || 'Unknown'}</span>
              {(trip.createdBy?.role === 'ADMIN' || trip.createdBy?.role === 'DISPATCHER') && (
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap",
                  trip.createdBy.role === 'ADMIN'
                    ? "bg-purple-100 text-purple-700"
                    : "bg-blue-100 text-blue-700"
                )}>
                  {trip.createdBy.role === 'ADMIN' ? 'Admin' : 'Dispatcher'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 min-h-0 bg-[#f5f6f8] relative">
          <form id="trip-edit-form" onSubmit={handleSubmit(onSubmit, () => {
            setSaveError("Please check required fields")
          })}>
            <div className="flex min-h-0 gap-0">

              {/* ── LEFT (scrollable main) ── */}
              <div className="flex-1 p-6 space-y-5 min-w-0">

                {/* Schedule */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Schedule</span>
                  </div>
                  {/* Row 1: Date · Time · Service Type */}
                  <div className="grid grid-cols-[200px_180px_1fr] gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Pickup Date</Label>
                      <DatePickerInput
                        value={watch("pickupDate") || ""}
                        onChange={(v) => setValue("pickupDate", v, { shouldValidate: true })}
                        hasError={!!errors.pickupDate}
                      />
                      {errors.pickupDate && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Pickup Time</Label>
                      <Input
                        type="text"
                        value={watch("pickupTime") || ""}
                        onChange={(e) => setValue("pickupTime", e.target.value)}
                        onBlur={(e) => setValue("pickupTime", formatTime(e.target.value), { shouldValidate: true })}
                        placeholder="e.g. 3:00 PM" autoComplete="off"
                        className={`h-9 text-sm ${errors.pickupTime ? "border-red-400" : ""}`}
                      />
                      {errors.pickupTime && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Service Type</Label>
                      <Select value={tripTypeValue}
                        onValueChange={(v) => { if (typeof v === "string") { setTripTypeValue(v); setValue("tripType", v) } }}>
                        <SelectTrigger className="h-9 text-sm w-full">
                          <SelectValue>{enabledTypes.find(t => t.value === tripTypeValue)?.label ?? tripTypeValue}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {enabledTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Row 2: Pax & Bags with steppers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Passengers</Label>
                      <div className="flex items-center gap-3 h-9 px-3 border border-gray-200 rounded-lg bg-gray-50">
                        <button type="button" onClick={() => { const curr = watch("passengerCount") || 1; if (curr > 1) setValue("passengerCount", curr - 1) }} className="text-gray-500 hover:text-gray-700 font-semibold">−</button>
                        <span className="flex-1 text-center font-semibold text-gray-900">{watch("passengerCount") || 1}</span>
                        <button type="button" onClick={() => { const curr = watch("passengerCount") || 1; setValue("passengerCount", curr + 1) }} className="text-gray-500 hover:text-gray-700 font-semibold">+</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">Bags</Label>
                      <div className="flex items-center gap-3 h-9 px-3 border border-gray-200 rounded-lg bg-gray-50">
                        <button type="button" onClick={() => { const curr = watch("luggageCount") || 0; if (curr > 0) setValue("luggageCount", curr - 1) }} className="text-gray-500 hover:text-gray-700 font-semibold">−</button>
                        <span className="flex-1 text-center font-semibold text-gray-900">{watch("luggageCount") || 0}</span>
                        <button type="button" onClick={() => { const curr = watch("luggageCount") || 0; setValue("luggageCount", curr + 1) }} className="text-gray-500 hover:text-gray-700 font-semibold">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Passengers</span>
                  </div>
                  <div className="space-y-2.5">
                    {/* Primary passenger */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl px-3.5 py-3">
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500 text-white text-[9px] font-bold shadow-sm shadow-indigo-200">1</span>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Primary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Name</Label>
                          <Input {...register("passengerName")} className="h-9 text-sm bg-white" placeholder="Full name" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-medium text-gray-500">Phone</Label>
                          <Input
                            {...register("passengerPhone")}
                            type="tel"
                            className="h-9 text-sm bg-white"
                            placeholder="(305) 555-1234"
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                              let formatted = digits
                              if (digits.length > 6) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                              else if (digits.length > 3) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                              else if (digits.length > 0) formatted = `(${digits}`
                              setValue("passengerPhone", formatted, { shouldDirty: true })
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px] font-medium text-gray-500">Email</Label>
                        <Input {...register("passengerEmail")} type="email" className="h-9 text-sm bg-white" placeholder="passenger@example.com" />
                      </div>
                    </div>

                    {/* Additional passengers */}
                    {additionalPassengers.map((pax, idx) => (
                      <div key={pax.id} className="relative bg-white border border-gray-200 rounded-xl px-3.5 py-3">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[9px] font-bold">{idx + 2}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Additional</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAdditionalPassenger(pax.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">First Name</Label>
                            <Input value={pax.firstName} onChange={(e) => updateAdditionalPassenger(pax.id, "firstName", e.target.value)} className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">Last Name</Label>
                            <Input value={pax.lastName} onChange={(e) => updateAdditionalPassenger(pax.id, "lastName", e.target.value)} className="h-9 text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] font-medium text-gray-500">Phone</Label>
                            <Input
                              type="tel"
                              value={pax.phone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                                let formatted = digits
                                if (digits.length > 6) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                                else if (digits.length > 3) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                                else if (digits.length > 0) formatted = `(${digits}`
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
                      className="w-full h-8 flex items-center justify-center gap-1.5 border border-dashed border-gray-200 hover:border-indigo-300 rounded-xl text-[11.5px] font-medium text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/40 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Add passenger
                    </button>
                  </div>
                </div>

                {/* Route */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Route</span>
                  </div>
                  <RouteBuilder stops={stops} setStops={setStops} stopsError={stopsError} />
                </div>

                {/* Client Ref + Notes */}
                <div className="space-y-4">
                  {/* Trip Notes */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                    <Label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block mb-3">Trip Notes</Label>
                    <p className="text-xs text-gray-500 mb-3">Visible to driver and client</p>
                    <textarea {...register("notes")} rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-gray-400"
                      placeholder="Add any trip-specific notes here…" />
                  </div>

                  {/* Internal Notes */}
                  <div className="bg-amber-50 rounded-2xl border border-amber-100 shadow-sm px-6 py-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider">Internal Notes</Label>
                      <span className="text-xs text-amber-700 flex items-center gap-1">🔒 Dispatcher only</span>
                    </div>
                    <textarea {...register("internalNotes")} rows={3}
                      className="w-full border border-amber-200 bg-white rounded-xl px-3 py-2.5 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-gray-400"
                      placeholder="Private notes, reminders, internal instructions…" />
                  </div>
                </div>

                {saveError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{saveError}</span>
                  </div>
                )}
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="w-[320px] flex-shrink-0 border-l border-gray-100 bg-white flex flex-col">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Account / Billing Contact */}
                <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3.5">
                  <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2.5 block">Billing Contact</Label>
                  <div ref={customerPickerRef} className="relative">
                    {selectedCustomer ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-700 flex-shrink-0">
                            {getInitials(selectedCustomer.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate">{selectedCustomer.name}</div>
                            {selectedCustomer.phone && <div className="text-[10px] text-gray-500">{formatPhone(selectedCustomer.phone)}</div>}
                          </div>
                        </div>
                        <button type="button"
                          onClick={() => { setCustomerPickerOpen(true); setCustomerSearch("") }}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold">
                          Change
                        </button>
                      </div>
                    ) : (
                      <button type="button"
                        onClick={() => { setCustomerPickerOpen(true); setCustomerSearch("") }}
                        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-[11px] text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors">
                        <User className="w-3.5 h-3.5" />
                        Select account
                      </button>
                    )}

                    {/* Search dropdown */}
                    {customerPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <div className="p-2 border-b border-gray-100">
                          <input autoFocus type="text" value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search…"
                            className="w-full text-sm px-2 py-1.5 rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {allCustomers.length === 0 ? (
                            <p className="text-[11px] text-gray-400 text-center py-3">No accounts</p>
                          ) : (
                            allCustomers.map((c) => (
                              <button key={c.id} type="button"
                                onClick={() => { setSelectedCustomer(c); setCustomerPickerOpen(false); setCustomerSearch("") }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700 flex-shrink-0">
                                  {getInitials(c.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-900 truncate">{c.name}</div>
                                  {c.phone && <div className="text-[10px] text-gray-400">{c.phone}</div>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Farm-In banner */}
                {isFarmedIn && trip.farmedIn && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <ArrowRightLeft className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-indigo-800">Farm-In</p>
                      <p className="text-xs text-indigo-600 truncate">{trip.farmedIn.name}</p>
                    </div>
                    {trip.agreedPrice && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-indigo-500 font-medium">Agreed Rate</p>
                        <p className="text-sm font-bold text-indigo-800">{formatCurrency(trip.agreedPrice)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Dispatch */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-3 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Dispatch</span>
                  </div>

                  {/* Driver label row with inline Primary/Secondary toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">Driver</p>
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
                      <DriverPickerCard drivers={activeDrivers} value={driverIdValue} onChange={setDriverIdValue} />
                      <VehiclePickerCard vehicles={activeVehicles} value={vehicleIdValue} onChange={setVehicleIdValue} />
                    </>
                  ) : (
                    <div className="space-y-3">
                      <DriverPickerCard drivers={activeDrivers} value={secondaryDriverIdValue} onChange={setSecondaryDriverIdValue} />
                      <VehiclePickerCard vehicles={activeVehicles} value={secondaryVehicleIdValue} onChange={setSecondaryVehicleIdValue} />
                      {(secondaryDriverIdValue || secondaryVehicleIdValue) && (
                        <button
                          type="button"
                          onClick={() => { setSecondaryDriverIdValue(""); setSecondaryVehicleIdValue("") }}
                          className="w-full text-[11px] text-red-400 hover:text-red-600 transition-colors text-center py-1"
                        >
                          Clear secondary assignment
                        </button>
                      )}
                    </div>
                  )}

                  {/* Client Reference — Metadata field under Dispatch */}
                  <div className="bg-gray-50/60 rounded-lg border border-gray-200/70 px-3.5 py-3 -mx-3 px-3">
                    <Label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2.5 block">Client Reference</Label>
                    <Input {...register("clientRef")} className="h-8 text-xs font-mono bg-white border-gray-200 placeholder:text-gray-300" placeholder="e.g. 14547002*1" />
                    <p className="text-xs text-gray-900 mt-1.5">Affiliate or external system reference</p>
                  </div>
                </section>

                {/* Farm-Out status — shown inline after Dispatch */}
                {!isFarmedIn && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status) && (
                  <div className="space-y-1.5">
                    {acceptedFarmOut ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-emerald-800">Farmed Out</p>
                            <p className="text-xs text-emerald-600 truncate">{acceptedFarmOut.toCompany?.name}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm"
                          className="w-full text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-7 border border-orange-200"
                          disabled={cancelFarmOut.isPending}
                          onClick={() => {
                            if (window.confirm(`Cancel the farm-out to ${acceptedFarmOut.toCompany?.name}?`)) {
                              cancelFarmOut.mutate(acceptedFarmOut.id, { onSuccess: () => {} })
                            }
                          }}>
                          Cancel Farm-Out
                        </Button>
                      </>
                    ) : pendingFarmOut ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-amber-800">Awaiting Response</p>
                            <p className="text-xs text-amber-600 truncate">{pendingFarmOut.toCompany?.name}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm"
                          className="w-full text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700 h-7 border border-orange-200"
                          disabled={cancelFarmOut.isPending}
                          onClick={() => {
                            if (window.confirm(`Cancel the pending farm-out to ${pendingFarmOut.toCompany?.name}?`)) {
                              cancelFarmOut.mutate(pendingFarmOut.id, { onSuccess: () => {} })
                            }
                          }}>
                          Cancel Farm-Out
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-sm h-9 gap-2"
                        onClick={() => setFarmOutOpen(true)}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Farm Out to Affiliate
                      </Button>
                    )}
                  </div>
                )}

                {!isFarmedIn && <div className="border-t border-gray-100" />}

                {/* Pricing */}
                {!isFarmedIn && <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-3 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Pricing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Base Fare</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                        <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })}
                          className="pl-6 h-9 text-sm font-tabular-nums" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Gratuity %</Label>
                      <Input type="number" min={0} max={100} {...register("gratuityPercent", { valueAsNumber: true })} className="h-9 text-sm font-tabular-nums" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-100 px-3 py-3 space-y-2">
                    <div className="flex justify-between text-[11px] text-gray-500 font-tabular-nums">
                      <span>Base Fare</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(price || 0)}</span>
                    </div>
                    {gratuityPercent > 0 && price > 0 && (
                      <div className="flex justify-between text-[11px] text-gray-500 font-tabular-nums">
                        <span>Gratuity ({gratuityPercent}%)</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(gratuityAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 pt-2 font-tabular-nums">
                      <span>Total</span>
                      <span>{formatCurrency(total || 0)}</span>
                    </div>
                  </div>
                </section>}

                <div className="border-t border-gray-100" />

                {/* Extras */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-3 rounded-full bg-gray-200 inline-block flex-shrink-0" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Extras</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { name: "vip" as const, label: "VIP", icon: Star },
                      { name: "meetAndGreet" as const, label: "Meet & Greet", icon: UserCheck },
                      { name: "wheelchairAccess" as const, label: "Wheelchair", icon: null },
                    ].map(({ name, label, icon: Icon }) => {
                      const val = watch(name)
                      return (
                        <button key={name} type="button"
                          onClick={() => setValue(name, !val)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                            val
                              ? "bg-blue-50 border-blue-200 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100"
                          }`}>
                          {Icon && <Icon className="w-3.5 h-3.5" />}
                          {label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Child Seats */}
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
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
                              <button type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: Math.max(0, s[key] - 1) }))}
                                disabled={childSeats[key] === 0}
                                className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm leading-none">
                                −
                              </button>
                              <span className={`w-5 text-center text-sm font-bold tabular-nums ${childSeats[key] > 0 ? "text-blue-700" : "text-gray-400"}`}>
                                {childSeats[key]}
                              </span>
                              <button type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: s[key] + 1 }))}
                                className="w-6 h-6 rounded-md border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors text-sm leading-none">
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>


                {/* Cancel Trip */}
                {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status) && (
                  <>
                    <div className="border-t border-gray-100" />
                    <Button type="button" variant="ghost"
                      className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 text-sm h-9 border border-red-200"
                      onClick={() => {
                        if (trip && window.confirm("Cancel this trip?")) {
                          updateTrip.mutate({ id: trip.id, status: "CANCELLED" }, { onSuccess: onClose })
                        }
                      }}>
                      Cancel Trip
                    </Button>
                  </>
                )}

              </div>{/* end scrollable */}

              {/* ── Sticky Footer ── */}
              <div className="sticky bottom-0 flex items-center gap-3 px-6 py-4 border-t border-gray-100 bg-white flex-shrink-0">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1">
                  Cancel
                </Button>
                <Button
                  form="trip-edit-form"
                  type="submit"
                  disabled={updateTrip.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  {updateTrip.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
    {farmOutOpen && trip && (
      <FarmOutModal
        trip={trip}
        open={farmOutOpen}
        onClose={() => setFarmOutOpen(false)}
      />
    )}
    {trip && (
      <SendEmailModal
        trip={trip}
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
      />
    )}
    {trip && (
      <CopyReservationModal
        trip={trip}
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
      />
    )}
    </>
  )
}
