"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  X, Plane, Phone, Copy, Check, User, Car, UserCheck,
  ChevronDown, MapPin, Building2, Ship, Plus, Star,
  AlertTriangle, Baby, ArrowRightLeft, Pencil, Send, Calendar, Loader2, ArrowLeftRight, GripVertical, Clock,
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

const SAVE_BUTTON_STYLES = `
  @keyframes saveSuccessPulse {
    0% { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3), inset 0 0 0 0 rgba(16, 185, 129, 0.2); }
    50% { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4), inset 0 0 0 2px rgba(16, 185, 129, 0.1); }
    100% { box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2), inset 0 0 0 0 rgba(16, 185, 129, 0); }
  }

  .save-button-success {
    animation: saveSuccessPulse 2.2s ease-out forwards;
  }
`
import { toast } from "sonner"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerInput } from "@/components/ui/date-picker"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { FBOAutocomplete } from "@/components/ui/fbo-autocomplete"
import { useUpdateTrip, useTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useVehicleTypes } from "@/lib/hooks/use-vehicle-types"
import { useServiceTypes } from "@/lib/hooks/use-service-types"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useTripFarmOuts, useCancelFarmOut } from "@/lib/hooks/use-farm-outs"
import { FarmOutModal } from "@/components/dispatch/farm-out-modal"
import { SendEmailModal } from "@/components/email/send-email-modal"
import { CopyReservationModal } from "@/components/dispatch/copy-reservation-modal"
import { RoundTripModal } from "@/components/dispatch/round-trip-modal"
import { TripAttachmentsSection } from "@/components/dispatch/trip-attachments"
import { BillingModal } from "@/components/billing/BillingModal"
import { BillingTriggerButton } from "@/components/dispatch/billing-trigger-button"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { useUpsertAddress, type CompanyAddress } from "@/lib/hooks/use-addresses"
import { useBillingSettings } from "@/lib/hooks/use-billing"
import { formatCurrency, formatPhone, getTripStatusLabel, cn } from "@/lib/utils"
import type { Trip, TripStatus, Driver, Vehicle, Customer } from "@/types"
import { format, parse, isValid } from "date-fns"
import { useStatusActionsStore } from "@/lib/stores/status-actions-store"
import { useStatusConfig } from "@/lib/hooks/use-status-config"

// ── Status helpers ──────────────────────────────────────────────────────────


function StatusDropdown({
  status,
  onUpdate,
}: {
  status: TripStatus
  onUpdate: (status: TripStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { getEnabledStatuses, getStatusBadgeClasses, getStatusDotClass, getStatusLabel } = useStatusConfig()

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
          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-all w-[140px] justify-center",
          "hover:brightness-95 active:scale-95",
          getStatusBadgeClasses(status)
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", getStatusDotClass(status))} />
        {getStatusLabel(status)}
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 rounded-xl py-1 min-w-[160px]" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 8px 32px rgba(0,0,0,0.65)" }}>
          {getEnabledStatuses().map((s) => {
            const isActive = s === status
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onUpdate(s); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors font-semibold" style={{ color: isActive ? "rgba(255,255,255,0.90)" : "rgba(200,212,228,0.70)" }}
              >
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDotClass(s))} />
                {getStatusLabel(s)}
                {isActive && <Check className="w-3 h-3 ml-auto" style={{ color:"rgba(201,168,124,0.70)" }} />}
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
const ROLE_ROW_BG: Record<StopRole, { bg: string; border: string; prefix: string }> = {
  pickup: { bg: "rgba(16,185,129,0.05)",  border: "rgba(16,185,129,0.18)",  prefix: "rgba(52,211,153,0.90)"  },
  drop:   { bg: "rgba(239,68,68,0.05)",   border: "rgba(239,68,68,0.18)",   prefix: "rgba(248,113,113,0.90)" },
  stop:   { bg: "rgba(99,102,241,0.05)",  border: "rgba(99,102,241,0.18)",  prefix: "rgba(129,140,248,0.90)" },
  wait:   { bg: "rgba(245,158,11,0.05)",  border: "rgba(245,158,11,0.18)",  prefix: "rgba(251,191,36,0.90)"  },
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
      className={`group flex items-start gap-3 px-3 py-2.5 last:border-b-0 transition-colors ${
        isDragOverlay ? "scale-[1.02] cursor-grabbing rounded-xl" : isEditing ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      }`}
      style={{
        ...style,
        background: isDragOverlay ? "#0d1526" : ROLE_ROW_BG[stop.role].bg,
        borderBottom: isDragOverlay ? "none" : "1px solid rgba(255,255,255,0.05)",
        borderLeft: isDragOverlay ? "none" : `2px solid ${ROLE_ROW_BG[stop.role].border}`,
        ...(isDragOverlay ? { boxShadow:"0 8px 32px rgba(0,0,0,0.60)", borderRadius:"12px", border:`1px solid ${ROLE_ROW_BG[stop.role].border}` } : {}),
      }}
      onClick={() => { if (!isEditing && !isDragOverlay) onEdit(stop) }}
    >
      {/* Drag handle — hidden when editing */}
      {!isEditing && (
        <button
          type="button"
          className={`flex-shrink-0 mt-0.5 touch-none transition-colors ${isDragOverlay ? "cursor-grabbing" : "cursor-grab"}`}
          style={{ color: "rgba(200,212,228,0.30)" }}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      {/* Role prefix */}
      <span className="text-[11px] font-bold font-mono flex-shrink-0 mt-0.5 w-6" style={{ color: ROLE_ROW_BG[stop.role].prefix }}>
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
        {stop.cruiseShipName && (
          <div className="text-[11px] opacity-70">
            Ship: {stop.cruiseShipName}
            {stop.cruiseLineName ? ` · ${stop.cruiseLineName}` : ""}
          </div>
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
            <Pencil className="w-3 h-3" style={{ color: "rgba(200,212,228,0.40)" }} />
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
            className="transition-colors disabled:pointer-events-none" style={{ color: "rgba(200,212,228,0.30)" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
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
  const [activeId, setActiveId] = useState<string | null>(null)
  const upsertAddress = useUpsertAddress()

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

  function handleAddressBookSelect(addr: CompanyAddress) {
    if (addr.name)     setLocationName(addr.name)
    if (addr.address1) { setAddress1(addr.address1); setAddError("") }
    if (addr.address2) setAddress2(addr.address2)
    if (addr.city)     setCity(addr.city)
    if (addr.state)    setStateVal(addr.state)
    if (addr.zip)      setZip(addr.zip)
  }

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
      formattedAddress = [address1, address2, city, stateVal ? `${stateVal}${zip ? " " + zip : ""}` : zip].filter(Boolean).join(", ")
    } else if (locType === "fbo") {
      formattedAddress = [locationName || address1, city, stateVal].filter(Boolean).join(", ")
    } else if (locType === "airport") {
      formattedAddress = [airportName || airportCode, airportCode && airportName ? `(${airportCode})` : ""].filter(Boolean).join(" ") || airportCode || airportName
    } else if (locType === "seaport") {
      formattedAddress = [portName || seaportCode, seaportCode && portName ? `(${seaportCode})` : ""].filter(Boolean).join(" ") || seaportCode || portName
    }

    // Auto-save address to address book for address-type stops
    if (locType === "address" && address1.trim()) {
      upsertAddress.mutate({
        name:     locationName || undefined,
        address1: address1.trim(),
        address2: address2 || undefined,
        city:     city || undefined,
        state:    stateVal || undefined,
        zip:      zip || undefined,
      })
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
      <style>{`.rb-input::placeholder{color:rgba(200,212,228,0.38)}`}</style>
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Tabs */}
        <div className="px-3 pt-3 pb-2.5">
          <div className="inline-flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {STOP_LOC_TABS.map(({ type: t, label, Icon }) => (
              <button key={t} type="button" onClick={() => { setLocType(t); resetForm() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={locType === t
                  ? { background: "#c9a87c", color: "#0d1526", boxShadow: "0 1px 6px rgba(201,168,124,0.35)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.75)" }
                }>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-3" style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

        {/* Fields */}
        <div className="p-3 pt-3.5 space-y-2.5">
          {locType === "address" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Location Name</Label>
                <AddressAutocomplete
                  value={locationName}
                  onChange={(v) => setLocationName(v)}
                  onSelect={handleAddressBookSelect}
                  placeholder="Hotel, office, venue name…"
                  inputClassName="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Address 1 *</Label>
                <AddressAutocomplete
                  value={address1}
                  onChange={(v) => { setAddress1(v); setAddError("") }}
                  onSelect={handleAddressBookSelect}
                  placeholder="123 Main St"
                  inputClassName="h-9 text-sm"
                  error={!!addError}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Address 2</Label>
                <input value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Suite, floor, apt…" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-[1fr_90px_90px_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>City</Label>
                  <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>State</Label>
                  <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="FL" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Zip</Label>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="33101" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Country</Label>
                  <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Phone</Label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(305) 555-0000" type="tel" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Time In</Label>
                  <input value={timeIn} onChange={(e) => setTimeIn(e.target.value)} placeholder="e.g. 3:00 PM" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={(e)=>{ setTimeIn(formatTime(e.target.value)); e.currentTarget.style.borderColor="rgba(255,255,255,0.12)" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Notes</Label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gate code, entrance, driver instructions…" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
              </div>
            </>
          )}
          {locType === "airport" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Airport Code *</Label>
                  <input value={airportCode} onChange={(e) => { setAirportCode(e.target.value); setAddError("") }} placeholder="MIA" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border: addError ? "1px solid rgba(248,113,113,0.60)" : "1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Airport Name</Label>
                  <input value={airportName} onChange={(e) => { setAirportName(e.target.value); setAddError("") }} placeholder="Miami International" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-[100px_1fr_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Airline Code</Label>
                  <input value={airlineCode} onChange={(e) => setAirlineCode(e.target.value)} placeholder="AA" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Airline Name</Label>
                  <input value={airlineName} onChange={(e) => setAirlineName(e.target.value)} placeholder="American Airlines" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Flight #</Label>
                  <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="AA 123" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-[120px_120px_1fr_120px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Arr/Dep</Label>
                  <div className="relative">
                    <select value={arrDep} onChange={(e) => setArrDep(e.target.value)} style={{ width:"100%", height:"36px", padding:"0 32px 0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)", appearance:"none", cursor:"pointer" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}>
                      <option value="" style={{ background:"#0d1526" }}>Select…</option>
                      <option value="Arrival" style={{ background:"#0d1526" }}>Arrival</option>
                      <option value="Departure" style={{ background:"#0d1526" }}>Departure</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color:"rgba(200,212,228,0.50)" }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Terminal/Gate</Label>
                  <input value={terminalGate} onChange={(e) => setTerminalGate(e.target.value)} placeholder="D22" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Airport Instructions</Label>
                  <input value={airportInstructions} onChange={(e) => setAirportInstructions(e.target.value)} placeholder="Meet at baggage claim…" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>ETA/ETD</Label>
                  <input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)} placeholder="3:00 PM" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={(e)=>{ setEtaEtd(formatTime(e.target.value)); e.currentTarget.style.borderColor="rgba(255,255,255,0.12)" }} />
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Meet Option</Label>
                  <div className="relative">
                    <select value={meetOption} onChange={(e) => setMeetOption(e.target.value)} style={{ width:"100%", height:"36px", padding:"0 32px 0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)", appearance:"none", cursor:"pointer" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}>
                      <option value="" style={{ background:"#0d1526" }}>Select…</option>
                      <option style={{ background:"#0d1526" }}>Curbside</option>
                      <option style={{ background:"#0d1526" }}>Inside</option>
                      <option style={{ background:"#0d1526" }}>Baggage Claim</option>
                      <option style={{ background:"#0d1526" }}>Gate</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color:"rgba(200,212,228,0.50)" }} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Notes</Label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Driver instructions…" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
            </>
          )}
          {locType === "seaport" && (
            <>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Seaport Code *</Label>
                  <input value={seaportCode} onChange={(e) => { setSeaportCode(e.target.value.toUpperCase()); setAddError("") }} placeholder="MIA" autoComplete="off" maxLength={6} className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border: addError ? "1px solid rgba(248,113,113,0.60)" : "1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Port Name</Label>
                  <input value={portName} onChange={(e) => { setPortName(e.target.value); setAddError("") }} placeholder="Port of Miami" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Cruise Ship</Label>
                  <input value={cruiseShipName} onChange={(e) => setCruiseShipName(e.target.value)} placeholder="Symphony of the Seas" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Cruise Line</Label>
                  <input value={cruiseLineName} onChange={(e) => setCruiseLineName(e.target.value)} placeholder="Royal Caribbean" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Arriving From / Departing To</Label>
                  <input value={arrivingDepartingTo} onChange={(e) => setArrivingDepartingTo(e.target.value)} placeholder="Nassau, Bahamas" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>ETA / ETD</Label>
                  <input value={etaEtd} onChange={(e) => setEtaEtd(e.target.value)} placeholder="9:00 AM" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={(e)=>{ setEtaEtd(formatTime(e.target.value)); e.currentTarget.style.borderColor="rgba(255,255,255,0.12)" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Seaport Instructions</label>
                <div className="relative">
                  <select value={seaportInstructions} onChange={(e) => setSeaportInstructions(e.target.value)}
                    style={{ width:"100%", height:"36px", padding:"0 32px 0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color: seaportInstructions ? "rgba(255,255,255,0.88)" : "rgba(200,212,228,0.38)", appearance:"none", cursor:"pointer" }}
                    onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"}
                    onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}>
                    <option value="" style={{ background:"#0d1526", color:"rgba(200,212,228,0.38)" }}>Select instructions…</option>
                    <option value="Meet at terminal entrance" style={{ background:"#0d1526", color:"rgba(255,255,255,0.88)" }}>Meet at terminal entrance</option>
                    <option value="Meet at baggage claim" style={{ background:"#0d1526", color:"rgba(255,255,255,0.88)" }}>Meet at baggage claim</option>
                    <option value="Meet at gangway" style={{ background:"#0d1526", color:"rgba(255,255,255,0.88)" }}>Meet at gangway</option>
                    <option value="Curbside pickup" style={{ background:"#0d1526", color:"rgba(255,255,255,0.88)" }}>Curbside pickup</option>
                    <option value="Meet inside terminal" style={{ background:"#0d1526", color:"rgba(255,255,255,0.88)" }}>Meet inside terminal</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color:"rgba(200,212,228,0.50)" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Notes</Label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Pier, terminal, additional instructions…" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
              </div>
            </>
          )}
          {locType === "fbo" && (
            <>
              <div className="grid grid-cols-[1fr_140px] gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>FBO Name *</Label>
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
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Tail #</Label>
                  <input value={tailNumber} onChange={(e) => setTailNumber(e.target.value)} placeholder="N12345" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Address 1</Label>
                  <input value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="123 Aviation Blvd" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>City / State</Label>
                  <div className="flex gap-2">
                    <CityAutocomplete value={city} onChange={setCity} onStateChange={setStateVal} placeholder="Miami" />
                    <input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="FL" autoComplete="off" className="rb-input" style={{ width:"64px", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Phone</Label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(305) 555-0000" type="tel" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Time In</Label>
                  <input value={timeIn} onChange={(e) => setTimeIn(e.target.value)} placeholder="3:00 PM" autoComplete="off" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={(e)=>{ setTimeIn(formatTime(e.target.value)); e.currentTarget.style.borderColor="rgba(255,255,255,0.12)" }} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color: "rgba(255,255,255,0.85)" }}>Notes</Label>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Driver instructions, access codes…" className="rb-input" style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }} onFocus={e=>e.currentTarget.style.borderColor="rgba(201,168,124,0.50)"} onBlur={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"} />
              </div>
            </>
          )}
          {addError && <p className="text-xs" style={{ color:"rgba(248,113,113,0.80)" }}>{addError}</p>}
        </div>

        {/* Role + Add */}
        <div className="px-3 py-3 flex items-center justify-between gap-2" style={{ background: "rgba(255,255,255,0.015)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-1 flex-wrap">
            {STOP_ROLES.map(({ value, label }) => (
              <label key={value}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all select-none ${
                  role === value ? STOP_ROLE_STYLE[value].pill : "border-transparent"
                }`}
                style={role !== value ? { color: "rgba(255,255,255,0.88)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" } : {}}>
                <input type="radio" name="edit-modal-role" value={value} checked={role === value} onChange={() => setRole(value)} className="sr-only" />
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  role === value
                    ? value === "pickup" ? "bg-emerald-400" : value === "drop" ? "bg-red-400"
                    : value === "wait" ? "bg-amber-400" : "bg-blue-400"
                    : "bg-white/15"
                }`} />
                {label}
              </label>
            ))}
          </div>
          <button type="button" onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all flex-shrink-0"
            style={{ background: "#c9a87c", color: "#0d1526", boxShadow: "0 2px 10px rgba(201,168,124,0.30)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b688" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}>
            <Plus className="w-3.5 h-3.5" />
            Add to Route
          </button>
        </div>
      </div>

      {/* Route list */}
      {stops.length > 0 ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="px-3 py-2 border-b" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.45)" }}>Routing Information</p>
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
        <div className="text-xs text-center py-6 rounded-xl" style={{ color: "rgba(200,212,228,0.40)", border: "1px dashed rgba(255,255,255,0.10)" }}>
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
        <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors" style={{ background: "rgba(99,102,241,0.10)", border: "1px solid rgba(99,102,241,0.22)" }}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden">
              {selected.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.avatarUrl} alt={selected.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(selected.name)
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400" style={{ border: "2px solid #0d1526" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.92)" }}>{selected.name}</div>
            {selected.phone && <div className="text-[11px] truncate" style={{ color: "rgba(165,180,252,0.70)" }}>{formatPhone(selected.phone)}</div>}
          </div>
          <button type="button" onClick={() => onChange("")}
            className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.25)", color: "rgba(248,113,113,0.90)" }}>
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.14)", color: "rgba(200,212,228,0.50)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.40)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)" }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
            <UserCheck className="w-4 h-4" style={{ color: "rgba(200,212,228,0.40)" }} />
          </div>
          <span className="flex-1 text-left text-sm">Assign driver…</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", open && "rotate-180")} style={{ color: "rgba(200,212,228,0.35)" }} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={{ ...dropStyle, background: "#0d1526", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "16px", boxShadow: "0 24px 60px rgba(0,0,0,0.65)", overflow: "hidden" }}>
          <div className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Active Drivers</div>
          <div className="max-h-48 overflow-y-auto">
            {drivers.length === 0
              ? <div className="px-4 py-4 text-xs text-center" style={{ color: "rgba(200,212,228,0.40)" }}>No active drivers</div>
              : drivers.map((d) => (
                <button key={d.id} type="button" onClick={() => { onChange(d.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                      {d.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.avatarUrl} alt={d.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(d.name)
                      )}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ border: "2px solid #0d1526" }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{d.name}</div>
                    {d.phone && <div className="text-[11px]" style={{ color: "rgba(200,212,228,0.50)" }}>{formatPhone(d.phone)}</div>}
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

// ── VehicleTypePickerCard ────────────────────────────────────────────────────

function VehicleTypePickerCard({ vehicleTypes, value, onChange }: { vehicleTypes: Array<{ value: string; label: string }>; value: string; onChange: (type: string) => void }) {
  const [open, setOpen] = useState(false)
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)
  const selected = vehicleTypes.find((t) => t.value === value) ?? null

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
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(200,212,228,0.45)" }}>Type</p>
      {selected ? (
        <div className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors" style={{ background: "rgba(59,130,246,0.10)", border: "1px solid rgba(59,130,246,0.22)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.15)" }}>
            <Car className="w-4 h-4" style={{ color: "rgba(147,197,253,0.85)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>{selected.label}</div>
            <div className="text-[11px]" style={{ color: "rgba(147,197,253,0.60)" }}>Booked category</div>
          </div>
          <button type="button" onClick={() => onChange("")} className="transition-colors flex-shrink-0" aria-label="Remove vehicle type"
            style={{ color: "rgba(200,212,228,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.80)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.35)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.14)", color: "rgba(200,212,228,0.50)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.40)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Car className="w-3.5 h-3.5" style={{ color: "rgba(200,212,228,0.40)" }} />
          </div>
          <span className="flex-1 text-left">Select type…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "rgba(200,212,228,0.35)" }} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={{ ...dropStyle, background: "#0d1526", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "14px", boxShadow: "0 24px 60px rgba(0,0,0,0.65)", overflow: "hidden" }}>
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Vehicle Categories</div>
          <div className="max-h-48 overflow-y-auto">
            {vehicleTypes.length === 0
              ? <div className="px-3 py-3 text-xs text-center" style={{ color: "rgba(200,212,228,0.40)" }}>No vehicle types</div>
              : vehicleTypes.map((t) => (
                <button key={t.value} type="button" onClick={() => { onChange(t.value); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
                    <Car className="w-3.5 h-3.5" style={{ color: "rgba(147,197,253,0.80)" }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{t.label}</div>
                  </div>
                </button>
              ))
            }
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
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(200,212,228,0.45)" }}>Vehicle</p>
      {selected ? (
        <div className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.12)" }}>
            <Car className="w-4 h-4" style={{ color: "#c9a87c" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.92)" }}>{selected.name}</div>
            <div className="flex items-center gap-1 text-[11px]" style={{ color: "rgba(200,212,228,0.55)" }}>
              <span>{VEHICLE_TYPE_LABEL[selected.type] ?? "Vehicle"}</span>
              <span style={{ color: "rgba(200,212,228,0.25)" }}>·</span>
              <span>{selected.capacity} pax</span>
              {selected.color && <><span style={{ color: "rgba(200,212,228,0.25)" }}>·</span><span>{selected.color}</span></>}
            </div>
          </div>
          <button type="button" onClick={() => onChange("")} className="transition-colors flex-shrink-0"
            style={{ color: "rgba(200,212,228,0.35)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "rgba(248,113,113,0.80)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.35)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => open ? setOpen(false) : openDropdown()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.14)", color: "rgba(200,212,228,0.50)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.40)" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
            <Car className="w-3.5 h-3.5" style={{ color: "rgba(200,212,228,0.40)" }} />
          </div>
          <span className="flex-1 text-left">Select vehicle…</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "rgba(200,212,228,0.35)" }} />
        </button>
      )}
      {open && !selected && createPortal(
        <div ref={dropRef} style={{ ...dropStyle, background: "#0d1526", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "14px", boxShadow: "0 24px 60px rgba(0,0,0,0.65)", overflow: "hidden" }}>
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>Available Vehicles</div>
          <div className="max-h-52 overflow-y-auto">
            {vehicles.length === 0
              ? <div className="px-3 py-3 text-xs text-center" style={{ color: "rgba(200,212,228,0.40)" }}>No active vehicles</div>
              : vehicles.map((v) => (
                <button key={v.id} type="button" onClick={() => { onChange(v.id); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.10)" }}>
                    <Car className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>{v.name}</div>
                    <div className="text-[11px]" style={{ color: "rgba(200,212,228,0.50)" }}>{VEHICLE_TYPE_LABEL[v.type] ?? v.type} · {v.capacity} pax{v.color ? ` · ${v.color}` : ""}</div>
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
  status:          z.string() as unknown as z.ZodType<TripStatus>,
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
  curbsidePickup:  z.boolean(),
  vip:             z.boolean(),
})
type FormData = z.infer<typeof schema>

// ── Main component ───────────────────────────────────────────────────────────

interface TripEditModalProps {
  trip: Trip | null
  open: boolean
  onClose: () => void
  defaultBillingOpen?: boolean
  onBillingChange?: (isOpen: boolean) => void
}

export function TripEditModal({ trip, open, onClose, defaultBillingOpen = false, onBillingChange }: TripEditModalProps) {
  const updateTrip = useUpdateTrip()
  const { data: freshTrip } = useTrip(trip?.id ?? "")
  // Use the fresh trip data if available (so attachments update), otherwise fall back to prop
  const currentTrip = freshTrip ?? trip
  const { data: allDrivers = [] } = useDrivers()
  const { data: allVehicles = [] } = useVehicles()
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const { data: serviceTypes = [] } = useServiceTypes()
  const enabledTypes = serviceTypes.filter((t) => t.isEnabled)
  const { actions: statusActions } = useStatusActionsStore()
  const { data: billingSettings } = useBillingSettings()

  const isFarmedIn = !!currentTrip?.farmedIn
  // Only show invoice directly linked to this trip (1:1 relationship)
  const tripInvoice = currentTrip?.invoice || null

  // Debug invoice lookup
  useEffect(() => {
    if (currentTrip?.id) {
      console.log('[TripEditModal] Trip ID:', currentTrip.id)
      console.log('[TripEditModal] Direct invoice (from trip.invoice):', currentTrip?.invoice)
      console.log('[TripEditModal] Final tripInvoice:', tripInvoice)
      console.log('[TripEditModal] Invoice total to pass:', tripInvoice?.total ? Number(tripInvoice.total) : null)
    }
  }, [currentTrip, tripInvoice])

  const [farmOutOpen, setFarmOutOpen]         = useState(false)
  const [sendEmailOpen, setSendEmailOpen]     = useState(false)
  const [copyOpen, setCopyOpen]               = useState(false)
  const [roundTripOpen, setRoundTripOpen]     = useState(false)
  const [billingOpen, setBillingOpen]         = useState(false)

  // When the trip modal opens (trip data loaded), auto-open billing if URL says so
  useEffect(() => {
    if (open && defaultBillingOpen) {
      setBillingOpen(true)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function openBilling() {
    setBillingOpen(true)
    onBillingChange?.(true)
  }

  function closeBilling() {
    setBillingOpen(false)
    onBillingChange?.(false)
  }
  const { data: farmOuts } = useTripFarmOuts(isFarmedIn ? null : (currentTrip?.id ?? null))
  const pendingFarmOut = farmOuts?.find((f) => f.status === "PENDING")
  const acceptedFarmOut = farmOuts?.find((f) => f.status === "ACCEPTED")
  const activeFarmOut = acceptedFarmOut || pendingFarmOut
  const cancelFarmOut = useCancelFarmOut(currentTrip?.id ?? "")

  const [copied, setCopied] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [statusValue, setStatusValue] = useState<TripStatus>("UNASSIGNED")
  const [driverIdValue, setDriverIdValue] = useState("")
  const [vehicleTypeValue, setVehicleTypeValue] = useState("")
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
  const [pobTime, setPobTime] = useState<string>("")
  const [pobEditing, setPobEditing] = useState(false)
  const [pobWasEdited, setPobWasEdited] = useState(false)

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

  // POB helpers — converts UTC ISO ↔ datetime-local string (local timezone)
  function toDatetimeLocal(iso: string | undefined | null): string {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function extractTimeFromDatetimeLocal(dtLocal: string): string {
    if (!dtLocal) return ""
    const match = dtLocal.match(/T(\d{2}:\d{2})/)
    return match ? match[1] : ""
  }

  function combineDatetimeLocal(dtLocal: string, timeStr: string): string {
    if (!dtLocal || !timeStr) return dtLocal
    return dtLocal.split("T")[0] + "T" + timeStr
  }

  function formatPobDisplay(dtLocal: string): string {
    if (!dtLocal) return ""
    const d = new Date(dtLocal)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleString("en-US", {
      hour: "numeric", minute: "2-digit", hour12: true,
    })
  }


  useEffect(() => {
    if (!currentTrip) return
    const displayDate = toDisplayDate(currentTrip.pickupDate ?? "")
    setStatusValue(currentTrip.status)
    setTripTypeValue(currentTrip.tripType ?? "ONE_WAY")
    setDriverIdValue(currentTrip.driverId ?? "")
    setVehicleTypeValue(currentTrip.vehicleType ?? "")
    setVehicleIdValue(currentTrip.vehicleId ?? "")
    setSecondaryDriverIdValue(currentTrip.secondaryDriverId ?? "")
    setSecondaryVehicleIdValue(currentTrip.secondaryVehicleId ?? "")
    setDispatchTab("primary")
    const existing = Array.isArray(currentTrip.additionalPassengers) ? currentTrip.additionalPassengers : []
    setAdditionalPassengers(existing.map((p: { firstName?: string; lastName?: string; phone?: string; email?: string }) => ({
      id: Math.random().toString(36).slice(2),
      firstName: p.firstName ?? "", lastName: p.lastName ?? "",
      phone: p.phone ?? "", email: p.email ?? "",
    })))
    setSaveError("")
    setSaveSuccess(false)
    setStopsError("")
    setChildSeatsOpen(false)
    setCustomerPickerOpen(false)
    setCustomerSearch("")
    setSelectedCustomer(currentTrip.customer ?? null)
    setPobTime(toDatetimeLocal(currentTrip.passengerOnBoardAt))
    setPobEditing(false)
    setPobWasEdited(false)

    // Parse existing child seat details
    const parsedSeats = { forward: 0, rear: 0, booster: 0 }
    if (currentTrip.childSeatDetails) {
      try {
        const details = JSON.parse(currentTrip.childSeatDetails) as Array<{ type: string; count: number }>
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

    // Add intermediate stops if they exist (from currentTrip.stops array)
    // Sort by order field to ensure correct sequence
    if (currentTrip.stops && Array.isArray(currentTrip.stops) && currentTrip.stops.length > 0) {
      const sortedStops = [...(currentTrip.stops as any[])].sort((a, b) => a.order - b.order)
      sortedStops.forEach((stop: any) => {
        // Use stored role, falling back to inference for legacy data
        let role: StopRole = "stop"
        if (stop.role && ["pickup", "drop", "stop", "wait"].includes(stop.role)) {
          role = stop.role as StopRole
        } else {
          // Legacy data: infer role by matching address to pickupAddress/dropoffAddress
          if (stop.address === currentTrip.pickupAddress) role = "pickup"
          else if (stop.address === currentTrip.dropoffAddress) role = "drop"
        }

        initialStops.push({
          id: stop.id,
          locType: "address",
          role,
          address: stop.address,
          locationName: stop.locationName ?? undefined,
          notes: stop.notes ?? "",
          flightNumber: "",
        })
      })
    } else {
      // Fallback to old pickup/dropoff if no stops array (for old data)
      if (currentTrip.pickupAddress) {
        initialStops.push({
          id: "init-pickup", locType: "address", role: "pickup",
          address: currentTrip.pickupAddress, notes: currentTrip.pickupNotes ?? "", flightNumber: currentTrip.flightNumber ?? "",
        })
      }
      if (currentTrip.dropoffAddress) {
        initialStops.push({
          id: "init-drop", locType: "address", role: "drop",
          address: currentTrip.dropoffAddress, notes: currentTrip.dropoffNotes ?? "", flightNumber: "",
        })
      }
    }
    setStops(initialStops)

    reset({
      status:          currentTrip.status,
      tripType:        currentTrip.tripType,
      pickupDate:      displayDate,
      pickupTime:      currentTrip.pickupTime,
      passengerName:   currentTrip.passengerName ?? "",
      passengerPhone:  currentTrip.passengerPhone ? formatPhone(currentTrip.passengerPhone) : "",
      passengerEmail:  currentTrip.passengerEmail ?? "",
      passengerCount:  currentTrip.passengerCount,
      luggageCount:    currentTrip.luggageCount ?? 0,
      price:           currentTrip.price ? parseFloat(String(currentTrip.price)) : undefined,
      gratuityPercent: currentTrip.price && currentTrip.gratuity
        ? Math.round((parseFloat(String(currentTrip.gratuity)) / parseFloat(String(currentTrip.price))) * 100)
        : 20,
      clientRef:       currentTrip.clientRef ?? "",
      notes:           currentTrip.notes ?? "",
      internalNotes:   currentTrip.internalNotes ?? "",
      meetAndGreet:    currentTrip.meetAndGreet,
      childSeat:       currentTrip.childSeat,
      curbsidePickup:  currentTrip.curbsidePickup,
      vip:             currentTrip.vip,
    })
  }, [trip, reset])

  // Reset save success state when modal closes
  useEffect(() => {
    if (!open) {
      setSaveSuccess(false)
    }
  }, [open])

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
    if (!currentTrip) return
    navigator.clipboard.writeText(currentTrip.tripNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentTrip?.tripNumber])

  if (!currentTrip) return null

  const price = watch("price") || 0
  const gratuityPercent = watch("gratuityPercent") || 0
  const gratuityAmt = price ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : 0
  const total = price ? price + gratuityAmt : 0


  function onSubmit(data: FormData) {
    console.log("onSubmit called with stops:", stops)
    if (!currentTrip) return
    const pickupStop = stops.find(s => s.role === "pickup")
    const dropStop = [...stops].reverse().find(s => s.role === "drop")
    console.log("pickupStop:", pickupStop, "dropStop:", dropStop)
    if (!pickupStop?.address.trim()) {
      console.log("ERROR: No pickup stop")
      setStopsError("A pickup location is required"); return
    }
    if (!dropStop?.address.trim()) {
      console.log("ERROR: No dropoff stop")
      setStopsError("A drop-off location is required"); return
    }
    setStopsError("")
    setSaveError("")

    const airportStop = stops.find(s => s.locType === "airport" && s.flightNumber)
    const gratuity = data.price ? Math.round(data.price * ((data.gratuityPercent || 0) / 100) * 100) / 100 : 0
    const totalPrice = data.price ? data.price + gratuity : undefined

    // Convert display date MM/DD/YYYY → ISO YYYY-MM-DD for the API
    let isoDate = data.pickupDate
    const parsed = parse(data.pickupDate, "MM/dd/yyyy", new Date())
    if (isValid(parsed)) isoDate = format(parsed, "yyyy-MM-dd")

    const stopsData = stops.map((stop, idx) => ({
      order: idx,
      address: stop.address,
      locationName: stop.locationName || null,
      role: stop.role || null,
      notes: stop.notes || null,
      arrivalTime: stop.timeIn || null,
    }))
    console.log("Saving trip with stops:", stopsData)

    updateTrip.mutate({
      id: currentTrip.id,
      status:           data.status,
      customerId:       selectedCustomer?.id ?? currentTrip.customerId,
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
      vehicleType:      (vehicleTypeValue || undefined) as never,
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
      curbsidePickup: data.curbsidePickup,
      vip:              data.vip,
      stops: stopsData as never,
      ...(pobWasEdited ? { passengerOnBoardAt: (pobTime ? new Date(pobTime).toISOString() : null) as never } : {}),
    }, {
      onSuccess: () => {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      },
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
      <DialogContent showCloseButton={false} className={cn("sm:max-w-[1180px] w-[96vw] p-0 flex flex-col overflow-hidden max-h-[92vh] gap-0 transition-all duration-200", billingOpen && "blur-md brightness-75")}>
        <style>{SAVE_BUTTON_STYLES}</style>

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0" style={{ background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          {/* Left: Confirmation # + Status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Confirmation # */}
            <button type="button" onClick={copyConfirmation} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group flex-shrink-0">
              <span className="text-xs sm:text-sm font-mono font-semibold" style={{ color:"#c9a87c" }}>{currentTrip.tripNumber}</span>
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" style={{ color:"rgba(200,212,228,0.45)" }} />}
            </button>

            {/* Status */}
            <StatusDropdown
              status={statusValue}
              onUpdate={(status) => { setStatusValue(status); setValue("status", status) }}
            />
          </div>

          {/* Right: Action buttons + Close button */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Secondary actions (wrap on mobile) */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Copy Reservation */}
              <button
                type="button"
                onClick={() => setCopyOpen(true)}
                className="inline-flex items-center justify-center h-9 gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-3.5 rounded-xl transition-colors duration-150 flex-shrink-0" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)", color:"rgba(200,212,228,0.80)" }}
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>

              {/* Round Trip */}
              <button
                type="button"
                onClick={() => setRoundTripOpen(true)}
                className="inline-flex items-center justify-center h-9 gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-3.5 rounded-xl transition-colors duration-150 flex-shrink-0" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)", color:"rgba(200,212,228,0.80)" }}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span className="hidden sm:inline">Round Trip</span>
              </button>

              {/* Send Email */}
              <button
                type="button"
                onClick={() => setSendEmailOpen(true)}
                className="inline-flex items-center justify-center h-9 gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-3.5 rounded-xl transition-colors duration-150 flex-shrink-0" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.10)", color:"rgba(200,212,228,0.80)" }}
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>

            {/* Primary action + Close button */}
            <div className="flex items-center gap-1 ml-1 sm:ml-1.5">
              {/* Save Changes */}
              <button
                form="trip-edit-form"
                type="submit"
                disabled={updateTrip.isPending || saveSuccess}
                className={cn(
                  "relative inline-flex items-center justify-center h-9 gap-2 px-4 sm:px-5 rounded-lg",
                  "text-xs sm:text-sm font-semibold transition-all duration-150 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-0",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "overflow-hidden flex-shrink-0",
                  saveSuccess && "save-button-success",
                  saveSuccess
                    ? "bg-emerald-600 text-white shadow-sm"
                    : updateTrip.isPending
                    ? "text-[#0d1526] shadow-sm"
                    : "text-[#0d1526] shadow-sm hover:brightness-110 active:scale-95"
                )}
                style={saveSuccess || updateTrip.isPending ? {} : { background: "#c9a87c" }}
              >
                {saveSuccess ? (
                  <div className="flex items-center justify-center gap-2 animate-none">
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    <span className="hidden sm:inline">Saved</span>
                  </div>
                ) : updateTrip.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Saving</span>
                  </div>
                ) : (
                  <span>Save</span>
                )}
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg transition-colors duration-150 flex-shrink-0" style={{ color:"rgba(255,255,255,0.70)" }}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Reservation Details (Compact) ── */}
        <div className="px-6 py-3 flex-shrink-0" style={{ background:"#0d1526", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-4 text-sm">
            {/* Created Date & Time */}
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-4 h-4 flex-shrink-0" style={{ color:"#c9a87c" }} />
              <span className="font-medium" style={{ color:"rgba(255,255,255,0.82)" }}>
                {currentTrip.createdAt ? format(new Date(currentTrip.createdAt), 'MMM d, yyyy') : '—'}
              </span>
              <span className="" style={{ color:"rgba(200,212,228,0.35)" }}>·</span>
              <span className="" style={{ color:"rgba(200,212,228,0.55)" }}>
                {currentTrip.createdAt ? format(new Date(currentTrip.createdAt), 'h:mm a') : '—'}
              </span>
            </div>

            {/* Divider */}
            <span className="" style={{ color:"rgba(255,255,255,0.15)" }}>|</span>

            {/* Created By User & Role */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-[10px] font-semibold" style={{ background:"rgba(201,168,124,0.14)", border:"1px solid rgba(201,168,124,0.22)", color:"#c9a87c" }}>
                {currentTrip.createdBy?.name
                  ? currentTrip.createdBy.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : '—'}
              </div>
              <span className="font-medium truncate" style={{ color:"rgba(255,255,255,0.85)" }}>{currentTrip.createdBy?.name || 'Unknown'}</span>
              {(currentTrip.createdBy?.role === 'ADMIN' || currentTrip.createdBy?.role === 'DISPATCHER') && (
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap",
                  currentTrip.createdBy.role === 'ADMIN'
                    ? ""
                    : ""
                )}>
                  {currentTrip.createdBy.role === 'ADMIN' ? 'Admin' : 'Dispatcher'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 min-h-0 relative" style={{ background:"#080c16" }}>
          <form id="trip-edit-form" onSubmit={handleSubmit(onSubmit, () => {
            setSaveError("Please check required fields")
          })}>
            <div className="flex flex-col lg:flex-row min-h-0 gap-0">

              {/* ── LEFT (scrollable main) ── */}
              <div className="flex-1 p-4 sm:p-6 space-y-5 min-w-0">

                {/* Schedule */}
                <div className="rounded-2xl px-6 py-5" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full inline-block flex-shrink-0" style={{ background:"#c9a87c" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color:"#c9a87c" }}>Schedule</span>
                  </div>
                  {/* Row 1: Date · Time · Service Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_180px_1fr] gap-4 mb-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.85)" }}>Pickup Date</Label>
                      <DatePickerInput
                        value={watch("pickupDate") || ""}
                        onChange={(v) => setValue("pickupDate", v, { shouldValidate: true })}
                        hasError={!!errors.pickupDate}
                      />
                      {errors.pickupDate && <p className="text-xs text-red-500">Required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color:"rgba(255,255,255,0.85)" }}>Pickup Time</label>
                      <input
                        type="text"
                        value={watch("pickupTime") || ""}
                        onChange={(e) => setValue("pickupTime", e.target.value)}
                        placeholder="e.g. 3:00 PM"
                        autoComplete="off"
                        className="pax-input"
                        style={{
                          width: "100%", height: "36px", padding: "0 12px", borderRadius: "10px", fontSize: "14px", outline: "none",
                          background: "rgba(255,255,255,0.05)",
                          border: errors.pickupTime ? "1px solid rgba(248,113,113,0.60)" : "1px solid rgba(255,255,255,0.12)",
                          color: "rgba(255,255,255,0.88)",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                        onBlur={(e) => {
                          setValue("pickupTime", formatTime(e.target.value), { shouldValidate: true })
                          e.currentTarget.style.borderColor = errors.pickupTime ? "rgba(248,113,113,0.60)" : "rgba(255,255,255,0.12)"
                        }}
                      />
                      {errors.pickupTime && <p className="text-xs" style={{ color:"rgba(248,113,113,0.80)" }}>Required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-semibold uppercase tracking-wider block" style={{ color:"rgba(255,255,255,0.85)" }}>Service Type</label>
                      <div className="relative">
                        <select
                          value={tripTypeValue}
                          onChange={(e) => { setTripTypeValue(e.target.value); setValue("tripType", e.target.value) }}
                          style={{
                            width: "100%", height: "36px", padding: "0 36px 0 12px", borderRadius: "10px", fontSize: "14px", outline: "none",
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "rgba(255,255,255,0.88)",
                            appearance: "none", cursor: "pointer",
                          }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                        >
                          {enabledTypes.map((t) => (
                            <option key={t.value} value={t.value} style={{ background: "#0d1526", color: "rgba(255,255,255,0.88)" }}>{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(200,212,228,0.50)" }} />
                      </div>
                    </div>
                  </div>
                  {/* Row 2: Pax & Bags with steppers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.85)" }}>Passengers</Label>
                      <div className="flex items-center gap-3 h-9 px-3 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)" }}>
                        <button type="button" onClick={() => { const curr = watch("passengerCount") || 1; if (curr > 1) setValue("passengerCount", curr - 1) }} className="font-semibold transition-colors" style={{ color:"rgba(200,212,228,0.55)" }}>−</button>
                        <span className="flex-1 text-center font-semibold" style={{ color:"rgba(255,255,255,0.90)" }}>{watch("passengerCount") || 1}</span>
                        <button type="button" onClick={() => { const curr = watch("passengerCount") || 1; setValue("passengerCount", curr + 1) }} className="font-semibold transition-colors" style={{ color:"rgba(200,212,228,0.55)" }}>+</button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:"rgba(255,255,255,0.85)" }}>Bags</Label>
                      <div className="flex items-center gap-3 h-9 px-3 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)" }}>
                        <button type="button" onClick={() => { const curr = watch("luggageCount") || 0; if (curr > 0) setValue("luggageCount", curr - 1) }} className="font-semibold transition-colors" style={{ color:"rgba(200,212,228,0.55)" }}>−</button>
                        <span className="flex-1 text-center font-semibold" style={{ color:"rgba(255,255,255,0.90)" }}>{watch("luggageCount") || 0}</span>
                        <button type="button" onClick={() => { const curr = watch("luggageCount") || 0; setValue("luggageCount", curr + 1) }} className="font-semibold transition-colors" style={{ color:"rgba(200,212,228,0.55)" }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passengers */}
                <div className="rounded-2xl px-6 py-5" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full inline-block flex-shrink-0" style={{ background:"#c9a87c" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color:"#c9a87c" }}>Passengers</span>
                  </div>
                  <div className="space-y-2.5">
                    <style>{`.pax-input::placeholder{color:rgba(200,212,228,0.38)}`}</style>
                    {/* Primary passenger */}
                    <div className="rounded-xl px-3.5 py-3" style={{ background:"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.18)" }}>
                      <div className="flex items-center gap-2 mb-2.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold" style={{ background:"rgba(99,102,241,0.80)", color:"#ffffff" }}>1</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(129,140,248,0.85)" }}>Primary</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Name</label>
                          <input
                            {...register("passengerName")}
                            placeholder="Full name"
                            className="pax-input"
                            style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Phone</label>
                          <input
                            {...register("passengerPhone")}
                            type="tel"
                            placeholder="(305) 555-1234"
                            className="pax-input"
                            style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                            onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                            onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
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
                        <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Email</label>
                        <input
                          {...register("passengerEmail")}
                          type="email"
                          placeholder="passenger@example.com"
                          className="pax-input"
                          style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                          onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                          onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                        />
                      </div>
                    </div>

                    {/* Additional passengers */}
                    {additionalPassengers.map((pax, idx) => (
                      <div key={pax.id} className="relative rounded-xl px-3.5 py-3" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}>
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold" style={{ background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.70)" }}>{idx + 2}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"rgba(200,212,228,0.50)" }}>Additional</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAdditionalPassenger(pax.id)}
                            className="w-5 h-5 rounded-full flex items-center justify-center transition-all" style={{ color:"rgba(200,212,228,0.35)" }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>First Name</label>
                            <input
                              value={pax.firstName}
                              onChange={(e) => updateAdditionalPassenger(pax.id, "firstName", e.target.value)}
                              placeholder="John"
                              className="pax-input"
                              style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                              onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Last Name</label>
                            <input
                              value={pax.lastName}
                              onChange={(e) => updateAdditionalPassenger(pax.id, "lastName", e.target.value)}
                              placeholder="Smith"
                              className="pax-input"
                              style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                              onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Phone</label>
                            <input
                              type="tel"
                              value={pax.phone}
                              placeholder="(305) 555-1234"
                              className="pax-input"
                              style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                              onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                                let formatted = digits
                                if (digits.length > 6) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                                else if (digits.length > 3) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                                else if (digits.length > 0) formatted = `(${digits}`
                                updateAdditionalPassenger(pax.id, "phone", formatted)
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-medium block" style={{ color:"rgba(255,255,255,0.80)" }}>Email</label>
                            <input
                              value={pax.email}
                              type="email"
                              placeholder="passenger@example.com"
                              onChange={(e) => updateAdditionalPassenger(pax.id, "email", e.target.value)}
                              className="pax-input"
                              style={{ width:"100%", height:"36px", padding:"0 12px", borderRadius:"10px", fontSize:"14px", outline:"none", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                              onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)"}
                              onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add passenger */}
                    <button
                      type="button"
                      onClick={addAdditionalPassenger}
                      className="w-full h-8 flex items-center justify-center gap-1.5 rounded-xl text-[11.5px] font-medium transition-all" style={{ border:"1px dashed rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.50)" }}
                    >
                      <Plus className="w-3 h-3" />
                      Add passenger
                    </button>
                  </div>
                </div>

                {/* Route */}
                <div className="rounded-2xl px-6 py-5" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-0.5 h-4 rounded-full inline-block flex-shrink-0" style={{ background:"#c9a87c" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color:"#c9a87c" }}>Route</span>
                  </div>
                  <RouteBuilder stops={stops} setStops={setStops} stopsError={stopsError} />
                </div>

                {/* Client Ref + Notes */}
                <div className="space-y-4">
                  {/* Trip Notes */}
                  <div className="rounded-2xl px-6 py-5" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <Label className="text-[11px] font-semibold uppercase tracking-wider block mb-3" style={{ color:"rgba(255,255,255,0.85)" }}>Trip Notes</Label>
                    <p className="text-xs mb-3" style={{ color:"rgba(200,212,228,0.50)" }}>Visible to driver and client</p>
                    <textarea {...register("notes")} rows={3}
                      className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                      placeholder="Add any trip-specific notes here…" />
                  </div>

                  {/* Internal Notes */}
                  <div className="rounded-2xl px-6 py-5" style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.20)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color:"rgba(251,191,36,0.85)" }}>Internal Notes</Label>
                      <span className="text-xs flex items-center gap-1" style={{ color:"rgba(251,191,36,0.60)" }}>🔒 Dispatcher only</span>
                    </div>
                    <textarea {...register("internalNotes")} rows={3}
                      className="w-full rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none" style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.18)", color:"rgba(255,255,255,0.88)" }}
                      placeholder="Private notes, reminders, internal instructions…" />
                  </div>
                </div>

                {/* Attachments */}
                <TripAttachmentsSection
                  mode="edit"
                  tripId={currentTrip.id}
                  existingAttachments={currentTrip.attachments ?? []}
                />

                {saveError && (
                  <div className="rounded-xl px-4 py-3 text-sm flex items-start gap-2" style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"rgba(248,113,113,0.85)" }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{saveError}</span>
                  </div>
                )}
              </div>

              {/* ── RIGHT SIDEBAR ── */}
              <div className="w-full lg:w-[320px] lg:flex-shrink-0 flex flex-col" style={{ borderLeft:"1px solid rgba(255,255,255,0.06)", background:"#0d1526" }}>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Account / Billing Contact */}
                <div className="rounded-xl px-4 py-3.5" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }}>
                  <Label className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 block" style={{ color:"#c9a87c" }}>Billing Contact</Label>
                  <div ref={customerPickerRef} className="relative">
                    {selectedCustomer ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background:"linear-gradient(135deg,rgba(99,102,241,0.30),rgba(139,92,246,0.30))", color:"rgba(167,139,250,0.85)" }}>
                            {getInitials(selectedCustomer.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color:"rgba(255,255,255,0.88)" }}>{selectedCustomer.name}</div>
                            {selectedCustomer.phone && <div className="text-[10px]" style={{ color:"rgba(200,212,228,0.55)" }}>{formatPhone(selectedCustomer.phone)}</div>}
                          </div>
                        </div>
                        <button type="button"
                          onClick={() => { setCustomerPickerOpen(true); setCustomerSearch("") }}
                          className="text-[11px] font-semibold" style={{ color:"#c9a87c" }}>
                          Change
                        </button>
                      </div>
                    ) : (
                      <button type="button"
                        onClick={() => { setCustomerPickerOpen(true); setCustomerSearch("") }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] transition-colors" style={{ border:"1px dashed rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.50)" }}>
                        <User className="w-3.5 h-3.5" />
                        Select account
                      </button>
                    )}

                    {/* Search dropdown */}
                    {customerPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden" style={{ background:"#0d1526", border:"1px solid rgba(255,255,255,0.12)", boxShadow:"0 8px 32px rgba(0,0,0,0.65)" }}>
                        <div className="p-2" style={{ borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                          <input autoFocus type="text" value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)} placeholder="Search…"
                            className="w-full text-sm px-2 py-1.5 rounded-lg outline-none" style={{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {allCustomers.length === 0 ? (
                            <p className="text-[11px] text-center py-3" style={{ color:"rgba(200,212,228,0.45)" }}>No accounts</p>
                          ) : (
                            allCustomers.map((c) => (
                              <button key={c.id} type="button"
                                onClick={() => { setSelectedCustomer(c); setCustomerPickerOpen(false); setCustomerSearch("") }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background:"rgba(99,102,241,0.20)", color:"rgba(167,139,250,0.90)" }}>
                                  {getInitials(c.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium truncate" style={{ color:"rgba(255,255,255,0.85)" }}>{c.name}</div>
                                  {c.phone && <div className="text-[10px]" style={{ color:"rgba(200,212,228,0.45)" }}>{formatPhone(c.phone)}</div>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── POB (Passenger On Board) Time ── */}
                <div className="rounded-xl border overflow-hidden transition-all duration-200"
                  style={{ borderRadius:"12px", overflow:"hidden", border: pobTime ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.09)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5"
                    style={{ background: pobTime ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)", padding:"10px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div className="flex items-center gap-2"
                      title="Passenger On Board (POB): The exact moment the passenger enters the vehicle. Auto-recorded when status changes to POB, or set manually.">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${pobTime ? "bg-emerald-400" : "bg-white/20"}`} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200" style={{ color: pobTime ? "rgba(52,211,153,0.90)" : "rgba(200,212,228,0.55)" }}>
                        Passenger On Board
                      </span>
                    </div>
                    {pobTime && !pobEditing && (
                      <button
                        type="button"
                        onClick={() => setPobEditing(true)}
                        className="flex items-center gap-1 text-[11px] font-semibold active:scale-95 transition-all duration-150" style={{ color:"#c9a87c" }}
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3" style={{ background:"rgba(255,255,255,0.02)" }}>
                    {!pobEditing ? (
                      pobTime ? (
                        <div className="flex items-start gap-2.5">
                          <Clock className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[13px] font-semibold leading-snug" style={{ color:"rgba(255,255,255,0.88)" }}>
                              {formatPobDisplay(pobTime)}
                            </p>
                            {pobWasEdited && (
                              <span className="inline-flex items-center mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color:"rgba(251,191,36,0.85)", background:"rgba(245,158,11,0.10)", border:"1px solid rgba(245,158,11,0.25)" }}>
                                Edited
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-[12px]" style={{ color:"rgba(200,212,228,0.45)" }}>Not yet recorded</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const now = toDatetimeLocal(new Date().toISOString())
                                setPobTime(now)
                                setPobWasEdited(true)
                              }}
                              className="flex-1 text-[11px] font-semibold rounded-lg px-3 py-1.5 active:scale-95 transition-all duration-150" style={{ background:"rgba(16,185,129,0.10)", border:"1px solid rgba(16,185,129,0.22)", color:"rgba(52,211,153,0.90)" }}
                            >
                              Set Now
                            </button>
                            <button
                              type="button"
                              onClick={() => setPobEditing(true)}
                              className="flex-1 text-[11px] font-semibold rounded-lg px-3 py-1.5 active:scale-95 transition-all duration-150" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.70)" }}
                            >
                              Pick Time
                            </button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="space-y-2.5">
                        <input
                          type="time"
                          value={extractTimeFromDatetimeLocal(pobTime)}
                          onChange={(e) => {
                            const newDatetime = combineDatetimeLocal(pobTime, e.target.value)
                            setPobTime(newDatetime)
                            setPobWasEdited(true)
                          }}
                          className="w-full h-9 px-3 text-sm rounded-lg outline-none transition-all duration-150" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.88)" }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPobEditing(false)}
                            className="flex-1 text-[11px] font-semibold rounded-lg px-3 py-1.5 active:scale-95 transition-all duration-150" style={{ background:"rgba(201,168,124,0.12)", border:"1px solid rgba(201,168,124,0.25)", color:"#c9a87c" }}
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPobTime("")
                              setPobWasEdited(true)
                              setPobEditing(false)
                            }}
                            className="text-[11px] font-semibold px-2 py-1.5 active:scale-95 transition-all duration-150" style={{ color:"rgba(248,113,113,0.75)" }}
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Farm-In banner */}
                {isFarmedIn && currentTrip.farmedIn && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background:"rgba(99,102,241,0.08)", border:"1px solid rgba(99,102,241,0.22)" }}>
                    <ArrowRightLeft className="w-4 h-4 flex-shrink-0" style={{ color:"rgba(129,140,248,0.80)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color:"rgba(167,139,250,0.90)" }}>Farm-In</p>
                      <p className="text-xs truncate" style={{ color:"rgba(129,140,248,0.65)" }}>{currentTrip.farmedIn.name}</p>
                    </div>
                    {currentTrip.agreedPrice && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] font-medium" style={{ color:"rgba(129,140,248,0.60)" }}>Agreed Rate</p>
                        <p className="text-sm font-bold" style={{ color:"rgba(167,139,250,0.90)" }}>{formatCurrency(currentTrip.agreedPrice)}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Dispatch */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-0.5 h-3 rounded-full inline-block flex-shrink-0" style={{ background:"#c9a87c" }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color:"#c9a87c" }}>Dispatch</span>
                  </div>

                  {/* Driver label row with inline Primary/Secondary toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color:"rgba(255,255,255,0.85)" }}>Driver</p>
                    <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background:"rgba(255,255,255,0.07)" }}>
                      <button
                        type="button"
                        onClick={() => setDispatchTab("primary")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150",
                          dispatchTab === "primary"
                            ? "bg-white/10 text-white shadow-sm"
                            : "" 
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
                            ? "bg-white/10 text-white shadow-sm"
                            : "" 
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
                      <VehicleTypePickerCard vehicleTypes={vehicleTypes} value={vehicleTypeValue} onChange={setVehicleTypeValue} />
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
                  <div className="rounded-xl px-3.5 py-3" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                    <Label className="text-[10px] font-semibold uppercase tracking-wider mb-2.5 block" style={{ color:"#c9a87c" }}>Client Reference</Label>
                    <Input {...register("clientRef")} className="h-8 text-xs font-mono" placeholder="e.g. 14547002*1" />
                    <p className="text-xs mt-1.5" style={{ color:"rgba(200,212,228,0.45)" }}>Affiliate or external system reference</p>
                  </div>
                </section>

                {/* Farm-Out status — shown inline after Dispatch */}
                {!isFarmedIn && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(currentTrip.status) && (
                  <div className="space-y-1.5">
                    {acceptedFarmOut ? (
                      <>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.22)" }}>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold" style={{ color:"rgba(52,211,153,0.90)" }}>Farmed Out</p>
                            <p className="text-xs truncate" style={{ color:"rgba(52,211,153,0.65)" }}>{acceptedFarmOut.toCompany?.name}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm"
                          className="w-full text-xs h-7 rounded-lg transition-colors" style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.22)", color:"rgba(251,146,60,0.85)" }}
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
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.22)" }}>
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold" style={{ color:"rgba(251,191,36,0.90)" }}>Awaiting Response</p>
                            <p className="text-xs truncate" style={{ color:"rgba(251,191,36,0.65)" }}>{pendingFarmOut.toCompany?.name}</p>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm"
                          className="w-full text-xs h-7 rounded-lg transition-colors" style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.22)", color:"rgba(251,146,60,0.85)" }}
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
                        className="w-full text-sm h-9 gap-2 rounded-xl transition-all" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.80)" }}
                        onClick={() => setFarmOutOpen(true)}
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        Farm Out to Affiliate
                      </Button>
                    )}
                  </div>
                )}

                {!isFarmedIn && <div className="border-t" style={{ borderColor:"rgba(255,255,255,0.07)" }} />}

                {/* Billing Modal Trigger */}
                {!isFarmedIn && (
                  <>
                    <BillingTriggerButton
                      billingData={currentTrip?.billingData}
                      payments={currentTrip?.payments}
                      invoiceTotal={tripInvoice?.total ? Number(tripInvoice.total) : null}
                      onClick={openBilling}
                    />
                    <BillingModal
                      open={billingOpen}
                      onClose={closeBilling}
                      mode="edit"
                      tripId={currentTrip?.id}
                      trip={currentTrip}
                      company={
                        billingSettings
                          ? {
                              name: billingSettings.companyName,
                              address: billingSettings.address,
                              phone: billingSettings.phone,
                              email: billingSettings.billingEmail,
                              logoUrl: billingSettings.logoUrl,
                            }
                          : undefined
                      }
                      initialData={currentTrip?.billingData as any}
                    />
                  </>
                )}

                <div className="border-t" style={{ borderColor:"rgba(255,255,255,0.07)" }} />

                {/* ADD-ONS — Refined Modern Design */}
                <section className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-4 rounded-full" style={{ background:"#c9a87c" }} />
                      <h3 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color:"#c9a87c" }}>ADD-ONS</h3>
                    </div>
                  </div>

                  {/* Main Add-ons — 3-Column Symmetric Grid */}
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { name: "vip" as const, label: "VIP", icon: Star },
                      { name: "meetAndGreet" as const, label: "Meet & Greet", icon: UserCheck },
                      { name: "curbsidePickup" as const, label: "Curbside Pickup", icon: MapPin },
                    ].map(({ name, label, icon: Icon }) => {
                      const val = watch(name)
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setValue(name, !val)}
                          className="flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all duration-150 group"
                          style={val
                            ? { background:"rgba(201,168,124,0.12)", border:"1px solid rgba(201,168,124,0.30)" }
                            : { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)" }
                          }
                        >
                          <Icon className="w-5 h-5 transition-colors" style={{ color: val ? "#c9a87c" : "rgba(200,212,228,0.45)" }} />
                          <span className="text-[11px] font-semibold text-center leading-tight transition-colors" style={{ color: val ? "#c9a87c" : "rgba(200,212,228,0.60)" }}>
                            {label}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Child Seats — Integrated Cohesively */}
                  <div className="rounded-xl overflow-hidden" style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)" }}>
                    <button
                      type="button"
                      onClick={() => setChildSeatsOpen((o) => !o)}
                      className="w-full flex items-center justify-between px-4 py-3 transition-all"
                      style={totalChildSeats > 0
                        ? { background:"rgba(201,168,124,0.08)", borderBottom:"1px solid rgba(201,168,124,0.20)" }
                        : {}}
                    >
                      <div className="flex items-center gap-3">
                        <Baby className="w-5 h-5 flex-shrink-0 transition-colors" style={{ color: totalChildSeats > 0 ? "#c9a87c" : "rgba(200,212,228,0.45)" }} />
                        <span className="text-sm font-semibold transition-colors" style={{ color: totalChildSeats > 0 ? "#c9a87c" : "rgba(255,255,255,0.80)" }}>
                          Child Seats
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        {totalChildSeats > 0 && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background:"rgba(201,168,124,0.15)", color:"#c9a87c" }}>
                            {totalChildSeats}
                          </span>
                        )}
                        <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${childSeatsOpen ? "rotate-180" : ""}`} style={{ color:"rgba(200,212,228,0.40)" }} />
                      </div>
                    </button>

                    {childSeatsOpen && (
                      <div className="divide-y" style={{ borderColor:"rgba(255,255,255,0.06)" }}>
                        {CHILD_SEAT_TYPES.map(({ key, label }) => (
                          <div key={key} className="flex items-center justify-between px-4 py-3 transition-colors" style={{ background:"rgba(255,255,255,0.02)" }}>
                            <span className="text-sm font-medium" style={{ color:"rgba(255,255,255,0.82)" }}>{label}</span>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: Math.max(0, s[key] - 1) }))}
                                disabled={childSeats[key] === 0}
                                className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base leading-none font-light" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.70)" }}
                              >
                                −
                              </button>
                              <span className="w-6 text-center text-sm font-bold tabular-nums" style={{ color: childSeats[key] > 0 ? "#c9a87c" : "rgba(200,212,228,0.40)" }}>
                                {childSeats[key]}
                              </span>
                              <button
                                type="button"
                                onClick={() => setChildSeats((s) => ({ ...s, [key]: s[key] + 1 }))}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-base leading-none" style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(200,212,228,0.70)" }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>


                {/* Destructive Action — Cancel Trip */}
                {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(currentTrip.status) && (
                  <section className="pt-2">
                    <div className="border-t mb-4" style={{ borderColor:"rgba(255,255,255,0.07)" }} />
                    <Button
                      type="button"
                      onClick={() => {
                        if (trip && window.confirm("Cancel this trip?")) {
                          updateTrip.mutate({ id: currentTrip.id, status: "CANCELLED" }, { onSuccess: onClose })
                        }
                      }}
                      className="w-full text-sm font-semibold h-10 rounded-xl transition-all" style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", color:"rgba(248,113,113,0.85)" }}
                    >
                      Cancel Trip
                    </Button>
                  </section>
                )}

              </div>{/* end scrollable */}
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
    {currentTrip && (
      <SendEmailModal
        trip={currentTrip}
        open={sendEmailOpen}
        onOpenChange={setSendEmailOpen}
      />
    )}
    {currentTrip && (
      <CopyReservationModal
        trip={currentTrip}
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
      />
    )}
    {currentTrip && (
      <RoundTripModal
        trip={currentTrip}
        open={roundTripOpen}
        onClose={() => setRoundTripOpen(false)}
      />
    )}
    </>
  )
}
