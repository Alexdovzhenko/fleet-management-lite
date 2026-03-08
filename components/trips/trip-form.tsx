"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Sparkles, Loader2, ChevronDown, ChevronUp, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCustomers } from "@/lib/hooks/use-customers"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { calculateTotal, formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

const tripSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  pickupDate: z.string().min(1, "Pickup date is required"),
  pickupTime: z.string().min(1, "Pickup time is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  pickupNotes: z.string().optional(),
  dropoffAddress: z.string().min(1, "Dropoff address is required"),
  dropoffNotes: z.string().optional(),
  tripType: z.enum(["ONE_WAY", "ROUND_TRIP", "HOURLY", "AIRPORT_PICKUP", "AIRPORT_DROPOFF", "MULTI_STOP", "SHUTTLE"]),
  passengerCount: z.number().int().min(1),
  passengerName: z.string().optional(),
  passengerPhone: z.string().optional(),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  price: z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().optional()),
  gratuityPercent: z.number().min(0).max(100),
  pricingNotes: z.string().optional(),
  flightNumber: z.string().optional(),
  meetAndGreet: z.boolean(),
  childSeat: z.boolean(),
  wheelchairAccess: z.boolean(),
  vip: z.boolean(),
  internalNotes: z.string().optional(),
})

type TripFormData = z.infer<typeof tripSchema>

interface TripFormProps {
  onSubmit: (data: TripFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

const tripTypes = [
  { value: "ONE_WAY", label: "One-Way" },
  { value: "ROUND_TRIP", label: "Round-Trip" },
  { value: "HOURLY", label: "Hourly" },
  { value: "AIRPORT_PICKUP", label: "Airport Pickup" },
  { value: "AIRPORT_DROPOFF", label: "Airport Drop-Off" },
  { value: "MULTI_STOP", label: "Multi-Stop" },
  { value: "SHUTTLE", label: "Shuttle" },
]

function CustomerCombobox({
  customers,
  value,
  onChange,
  hasError,
}: {
  customers: { id: string; name: string; phone?: string | null; email?: string | null; company?: string | null; customerNumber?: string | null }[]
  value: string
  onChange: (id: string) => void
  hasError?: boolean
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = customers.find((c) => c.id === value)
  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center h-10 w-full rounded-md border bg-background px-3 text-sm cursor-pointer ${
          hasError ? "border-red-300" : "border-input"
        } ${open ? "ring-2 ring-ring ring-offset-background" : ""}`}
        onClick={() => { setOpen(true) }}
      >
        {open ? (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or company..."
            className="flex-1 outline-none bg-transparent"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={selected ? "text-foreground flex-1 truncate" : "text-muted-foreground flex-1"}>
            {selected ? `${selected.name}${selected.phone ? ` — ${selected.phone}` : ""}` : "Select customer..."}
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto bg-white border rounded-xl shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">No customers found</div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch("") }}
                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  c.id === value ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{c.name}</span>
                  {c.customerNumber && (
                    <span className="text-xs font-mono text-gray-400">#{c.customerNumber}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {[c.phone, c.company].filter(Boolean).join(" · ")}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function TripForm({ onSubmit, onCancel, isLoading }: TripFormProps) {
  const [aiText, setAiText] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [showSpecial, setShowSpecial] = useState(false)
  const [showFlight, setShowFlight] = useState(false)

  const { data: customers } = useCustomers()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TripFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tripSchema) as Resolver<TripFormData>,
    defaultValues: {
      tripType: "ONE_WAY",
      passengerCount: 1,
      gratuityPercent: 20,
      meetAndGreet: false,
      childSeat: false,
      wheelchairAccess: false,
      vip: false,
      pickupDate: "",
      pickupTime: "",
    },
  })

  const price = watch("price") || 0
  const gratuityPercent = watch("gratuityPercent") || 20
  const tripType = watch("tripType")
  const { gratuity, total } = calculateTotal(Number(price), Number(gratuityPercent))

  const isAirport = tripType === "AIRPORT_PICKUP" || tripType === "AIRPORT_DROPOFF"

  const handleAiParse = useCallback(async () => {
    if (!aiText.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/parse-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      })
      const { parsed } = await res.json()

      if (parsed.pickupDate) setValue("pickupDate", String(parsed.pickupDate))
      if (parsed.pickupTime) setValue("pickupTime", String(parsed.pickupTime))
      if (parsed.pickupAddress) setValue("pickupAddress", String(parsed.pickupAddress))
      if (parsed.dropoffAddress) setValue("dropoffAddress", String(parsed.dropoffAddress))
      if (parsed.passengerCount) setValue("passengerCount", Number(parsed.passengerCount))
      if (parsed.passengerName) setValue("passengerName", String(parsed.passengerName))
      if (parsed.flightNumber) {
        setValue("flightNumber", String(parsed.flightNumber))
        setShowFlight(true)
      }
      if (parsed.tripType) setValue("tripType", parsed.tripType as TripFormData["tripType"])
      if (parsed.meetAndGreet) setValue("meetAndGreet", Boolean(parsed.meetAndGreet))
      if (parsed.vip) setValue("vip", Boolean(parsed.vip))
      if (parsed.internalNotes) setValue("internalNotes", String(parsed.internalNotes))
      if (["AIRPORT_PICKUP", "AIRPORT_DROPOFF"].includes(String(parsed.tripType))) setShowFlight(true)
    } catch (err) {
      console.error("AI parse error:", err)
    } finally {
      setAiLoading(false)
    }
  }, [aiText, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* AI Smart Field */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <Label className="text-sm font-semibold text-blue-900">AI Quick Entry</Label>
        </div>
        <div className="flex gap-2">
          <Input
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder='e.g. "JFK pickup tomorrow 3pm for John, 2 passengers, flight AA1234"'
            className="bg-white border-blue-200 text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAiParse())}
          />
          <Button
            type="button"
            onClick={handleAiParse}
            disabled={aiLoading || !aiText.trim()}
            className="text-white flex-shrink-0"
            style={{ backgroundColor: "#2563EB" }}
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fill"}
          </Button>
        </div>
        <p className="text-[11px] text-blue-600 mt-1.5">Press Enter or click Fill to auto-populate the form</p>
      </div>

      {/* Customer */}
      <div className="space-y-1.5">
        <Label>Customer *</Label>
        <CustomerCombobox
          customers={customers || []}
          value={watch("customerId") || ""}
          onChange={(id) => setValue("customerId", id)}
          hasError={!!errors.customerId}
        />
        {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
      </div>

      {/* Trip Type */}
      <div className="space-y-1.5">
        <Label>Trip Type</Label>
        <Select defaultValue="ONE_WAY" onValueChange={(v) => {
          if (typeof v !== "string") return
          setValue("tripType", v as TripFormData["tripType"])
          if (v === "AIRPORT_PICKUP" || v === "AIRPORT_DROPOFF") setShowFlight(true)
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tripTypes.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Pickup Date *</Label>
          <Input type="date" {...register("pickupDate")} />
          {errors.pickupDate && <p className="text-xs text-red-500">{errors.pickupDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Pickup Time *</Label>
          <Input type="time" {...register("pickupTime")} />
          {errors.pickupTime && <p className="text-xs text-red-500">{errors.pickupTime.message}</p>}
        </div>
      </div>

      {/* Passengers */}
      <div className="space-y-1.5">
        <Label>Passengers</Label>
        <div className="flex items-center gap-3">
          <Input type="number" min={1} {...register("passengerCount", { valueAsNumber: true })} className="w-24" />
          <Input {...register("passengerName")} placeholder="Passenger name (if different from customer)" className="flex-1" />
        </div>
      </div>

      {/* Pickup */}
      <div className="space-y-1.5">
        <Label>Pickup Address *</Label>
        <Input {...register("pickupAddress")} placeholder="123 Main St, Miami FL 33101" />
        {errors.pickupAddress && <p className="text-xs text-red-500">{errors.pickupAddress.message}</p>}
        <Input {...register("pickupNotes")} placeholder="Notes (optional): Meet at baggage claim..." className="text-sm" />
      </div>

      {/* Dropoff */}
      <div className="space-y-1.5">
        <Label>Dropoff Address *</Label>
        <Input {...register("dropoffAddress")} placeholder="456 Ocean Drive, Miami Beach FL" />
        {errors.dropoffAddress && <p className="text-xs text-red-500">{errors.dropoffAddress.message}</p>}
        <Input {...register("dropoffNotes")} placeholder="Notes (optional)" className="text-sm" />
      </div>

      {/* Flight Info (toggled) */}
      {(isAirport || showFlight) && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
            <Plane className="w-4 h-4" />
            Flight Tracking
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Flight Number</Label>
              <Input {...register("flightNumber")} placeholder="AA1234" className="bg-white" />
            </div>
          </div>
        </div>
      )}

      {!isAirport && !showFlight && (
        <button
          type="button"
          onClick={() => setShowFlight(true)}
          className="text-xs text-blue-600 hover:underline"
        >
          + Add flight tracking
        </button>
      )}

      {/* Assignment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Driver</Label>
          <Select onValueChange={(v) => { if (typeof v === "string") setValue("driverId", v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Assign driver..." />
            </SelectTrigger>
            <SelectContent>
              {drivers?.filter((d) => d.status === "ACTIVE").map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Vehicle</Label>
          <Select onValueChange={(v) => { if (typeof v === "string") setValue("vehicleId", v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle..." />
            </SelectTrigger>
            <SelectContent>
              {vehicles?.filter((v) => v.status === "ACTIVE").map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name} ({v.capacity} pax)</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3 bg-gray-50 rounded-xl p-4">
        <Label className="text-sm font-semibold">Pricing</Label>
        <div className="flex items-center gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-gray-500">Base Fare</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className="pl-7 bg-white" placeholder="0.00" />
            </div>
          </div>
          <div className="w-24 space-y-1">
            <Label className="text-xs text-gray-500">Gratuity %</Label>
            <Input type="number" min={0} max={100} {...register("gratuityPercent", { valueAsNumber: true })} className="bg-white" />
          </div>
        </div>
        {price > 0 && (
          <div className="text-sm space-y-1 pt-1 border-t">
            <div className="flex justify-between text-gray-500">
              <span>Gratuity ({gratuityPercent}%)</span>
              <span>{formatCurrency(gratuity)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Special Requirements (collapsible) */}
      <div className="border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSpecial(!showSpecial)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Special Requirements
          {showSpecial ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSpecial && (
          <div className="px-4 pb-4 space-y-3 border-t">
            <div className="grid grid-cols-2 gap-3 pt-3">
              {[
                { name: "meetAndGreet" as const, label: "Meet & Greet (driver holds sign)" },
                { name: "childSeat" as const, label: "Child seat needed" },
                { name: "wheelchairAccess" as const, label: "Wheelchair accessible" },
                { name: "vip" as const, label: "VIP — priority handling" },
              ].map(({ name, label }) => (
                <div key={name} className="flex items-center gap-2">
                  <Checkbox
                    id={name}
                    onCheckedChange={(v) => setValue(name, Boolean(v))}
                  />
                  <Label htmlFor={name} className="text-sm font-normal cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Internal Notes</Label>
              <Textarea {...register("internalNotes")} rows={2} placeholder="Not visible to customer..." />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 text-white"
          style={{ backgroundColor: "#2563EB" }}
        >
          {isLoading ? "Creating..." : "Create Trip"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
