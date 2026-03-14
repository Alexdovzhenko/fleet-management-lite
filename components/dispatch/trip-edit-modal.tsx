"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Plane, Phone, Copy, Check } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useServiceTypes } from "@/lib/hooks/use-service-types"
import { formatCurrency, getTripStatusLabel, cn } from "@/lib/utils"
import type { Trip, TripStatus } from "@/types"

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

const STATUS_ACTIONS: Partial<Record<TripStatus, { label: string; next: TripStatus; cls: string }>> = {
  QUOTE:           { label: "Confirm",      next: "CONFIRMED",       cls: "bg-blue-600 hover:bg-blue-700" },
  CONFIRMED:       { label: "Dispatch",     next: "DISPATCHED",      cls: "bg-violet-600 hover:bg-violet-700" },
  DISPATCHED:      { label: "En Route",     next: "DRIVER_EN_ROUTE", cls: "bg-amber-500 hover:bg-amber-600" },
  DRIVER_EN_ROUTE: { label: "Arrived",      next: "DRIVER_ARRIVED",  cls: "bg-yellow-500 hover:bg-yellow-600" },
  DRIVER_ARRIVED:  { label: "Start Trip",   next: "IN_PROGRESS",     cls: "bg-emerald-600 hover:bg-emerald-700" },
  IN_PROGRESS:     { label: "Complete",     next: "COMPLETED",       cls: "bg-emerald-700 hover:bg-emerald-800" },
}


const schema = z.object({
  tripType:        z.string(),
  pickupDate:      z.string().min(1, "Required"),
  pickupTime:      z.string().min(1, "Required"),
  pickupAddress:   z.string().min(1, "Required"),
  pickupNotes:     z.string().optional(),
  dropoffAddress:  z.string().min(1, "Required"),
  dropoffNotes:    z.string().optional(),
  flightNumber:    z.string().optional(),
  passengerName:   z.string().optional(),
  passengerPhone:  z.string().optional(),
  passengerCount:  z.number().int().min(1),
  driverId:        z.string().optional(),
  vehicleId:       z.string().optional(),
  price:           z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().optional()),
  gratuityPercent: z.preprocess((v) => (typeof v === "number" && isNaN(v) ? 0 : v), z.number().min(0).max(100)),
  clientRef:       z.string().optional(),
  internalNotes:   z.string().optional(),
  meetAndGreet:    z.boolean(),
  childSeat:       z.boolean(),
  wheelchairAccess:z.boolean(),
  vip:             z.boolean(),
})

type FormData = z.infer<typeof schema>

interface TripEditModalProps {
  trip: Trip | null
  open: boolean
  onClose: () => void
}

export function TripEditModal({ trip, open, onClose }: TripEditModalProps) {
  const updateTrip = useUpdateTrip()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()
  const { data: serviceTypes = [] } = useServiceTypes()
  const enabledTypes = serviceTypes.filter((t) => t.isEnabled)
  const [copied, setCopied] = useState(false)
  const copyConfirmation = useCallback(() => {
    if (!trip) return
    navigator.clipboard.writeText(trip.tripNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [trip])

  const { register, handleSubmit, reset, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  useEffect(() => {
    if (!trip) return
    reset({
      tripType:        trip.tripType,
      pickupDate:      trip.pickupDate?.split("T")[0] ?? "",
      pickupTime:      trip.pickupTime,
      pickupAddress:   trip.pickupAddress,
      pickupNotes:     trip.pickupNotes ?? "",
      dropoffAddress:  trip.dropoffAddress,
      dropoffNotes:    trip.dropoffNotes ?? "",
      flightNumber:    trip.flightNumber ?? "",
      passengerName:   trip.passengerName ?? "",
      passengerPhone:  trip.passengerPhone ?? "",
      passengerCount:  trip.passengerCount,
      driverId:        trip.driverId ?? "",
      vehicleId:       trip.vehicleId ?? "",
      price:           trip.price ? parseFloat(trip.price) : undefined,
      gratuityPercent: trip.price && trip.gratuity
        ? Math.round((parseFloat(trip.gratuity) / parseFloat(trip.price)) * 100)
        : 20,
      clientRef:       trip.clientRef ?? "",
      internalNotes:   trip.internalNotes ?? "",
      meetAndGreet:    trip.meetAndGreet,
      childSeat:       trip.childSeat,
      wheelchairAccess:trip.wheelchairAccess,
      vip:             trip.vip,
    })
  }, [trip, reset])

  if (!trip) return null

  const price = watch("price") || 0
  const gratuityPercent = watch("gratuityPercent") || 0
  const tripTypeValue = watch("tripType")
  const driverIdValue = watch("driverId")
  const vehicleIdValue = watch("vehicleId")
  const gratuityAmt = price ? Math.round(price * (gratuityPercent / 100) * 100) / 100 : 0
  const total = price ? price + gratuityAmt : 0

  const statusAction = STATUS_ACTIONS[trip.status]
  const isFinished = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status)

  function onSubmit(data: FormData) {
    if (!trip) return
    const gratuity = data.price ? Math.round(data.price * ((data.gratuityPercent || 0) / 100) * 100) / 100 : 0
    const totalPrice = data.price ? data.price + gratuity : undefined
    updateTrip.mutate({
      id: trip.id,
      tripType:        data.tripType as never,
      pickupDate:      data.pickupDate,
      pickupTime:      data.pickupTime,
      pickupAddress:   data.pickupAddress,
      pickupNotes:     data.pickupNotes || undefined,
      dropoffAddress:  data.dropoffAddress,
      dropoffNotes:    data.dropoffNotes || undefined,
      flightNumber:    data.flightNumber || undefined,
      passengerName:   data.passengerName || undefined,
      passengerPhone:  data.passengerPhone || undefined,
      passengerCount:  data.passengerCount,
      driverId:        data.driverId || undefined,
      vehicleId:       data.vehicleId || undefined,
      price:           data.price as never,
      gratuity:        gratuity as never,
      totalPrice:      totalPrice as never,
      clientRef:       data.clientRef || undefined,
      internalNotes:   data.internalNotes || undefined,
      meetAndGreet:    data.meetAndGreet,
      childSeat:       data.childSeat,
      wheelchairAccess:data.wheelchairAccess,
      vip:             data.vip,
    }, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[1200px] w-[95vw] p-0 flex flex-col overflow-hidden max-h-[90vh] gap-0">

        {/* ── Header ── */}
        <div className="flex items-center gap-4 px-6 py-4 border-b bg-white flex-shrink-0">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>

          {/* Confirmation number — primary identifier */}
          <button
            type="button"
            onClick={copyConfirmation}
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-3 py-1.5 transition-colors group flex-shrink-0"
            title="Click to copy confirmation number"
          >
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400 mb-0.5">Confirmation #</span>
              <span className="text-sm font-mono font-bold text-blue-700 tracking-wide">{trip.tripNumber}</span>
            </div>
            {copied
              ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              : <Copy className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            }
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0", STATUS_BADGE[trip.status])}>
              {getTripStatusLabel(trip.status)}
            </span>
            {trip.customer && (
              <span className="text-sm text-gray-400 truncate">— {trip.customer.name}</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {statusAction && !isFinished && (
              <Button
                type="button"
                size="sm"
                onClick={() => updateTrip.mutate({ id: trip.id, status: statusAction.next })}
                disabled={updateTrip.isPending}
                className={cn("text-white h-9 text-sm px-4 font-medium", statusAction.cls)}
              >
                {statusAction.label}
              </Button>
            )}
            <Button
              form="trip-edit-form"
              type="submit"
              size="sm"
              disabled={updateTrip.isPending}
              className="bg-[#2563EB] hover:bg-blue-700 text-white h-9 text-sm px-5 font-medium"
            >
              {updateTrip.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <form id="trip-edit-form" onSubmit={handleSubmit(onSubmit)}>
            {/* Main 2-col: wide form left, sidebar right */}
            <div className="flex min-h-0">

              {/* ── MAIN FORM (left, scrolls) ── */}
              <div className="flex-1 p-6 space-y-6 min-w-0 border-r">

                {/* ── Row 1: Passenger ── */}
                <section>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Passenger</h4>
                  <div className="grid grid-cols-[1fr_200px] gap-4 max-w-xl">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Passenger Name</Label>
                      <Input {...register("passengerName")} className="h-10 text-sm" placeholder="Full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Phone</Label>
                      <Input {...register("passengerPhone")} type="tel" className="h-10 text-sm" placeholder="(305) 555-1234" />
                    </div>
                  </div>
                  {trip.customer && (
                    <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-blue-400 font-medium">Account</span>
                      <span className="w-px h-4 bg-blue-200" />
                      <span className="font-semibold text-gray-800">{trip.customer.name}</span>
                      {trip.customer.phone && (
                        <a href={`tel:${trip.customer.phone}`} className="flex items-center gap-1.5 text-blue-600 hover:underline ml-auto text-xs">
                          <Phone className="w-3.5 h-3.5" />{trip.customer.phone}
                        </a>
                      )}
                    </div>
                  )}
                </section>

                {/* ── Row 2: Trip Details ── */}
                <section>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Trip Details</h4>
                  <div className="grid grid-cols-[160px_140px_1fr_90px] gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Pickup Date</Label>
                      <Input type="date" {...register("pickupDate")} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Pickup Time</Label>
                      <Input type="time" {...register("pickupTime")} className="h-10 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Service Type</Label>
                      <Select
                        defaultValue={trip.tripType}
                        onValueChange={(v) => { if (typeof v === "string") setValue("tripType", v) }}
                      >
                        <SelectTrigger className="h-10 text-sm w-full">
                          <SelectValue>{enabledTypes.find(t => t.value === (tripTypeValue || trip.tripType))?.label ?? tripTypeValue ?? trip.tripType}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {enabledTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Pax</Label>
                      <Input type="number" min={1} {...register("passengerCount", { valueAsNumber: true })} className="h-10 text-sm" />
                    </div>
                  </div>
                </section>

                {/* ── Row 3: Pickup ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pickup</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Address</Label>
                      <Input {...register("pickupAddress")} className="h-10 text-sm" placeholder="Full pickup address" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500">Notes / Gate Code</Label>
                        <Input {...register("pickupNotes")} className="h-10 text-sm" placeholder="Terminal, gate code…" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5" /> Flight Number
                        </Label>
                        <Input {...register("flightNumber")} className="h-10 text-sm" placeholder="AA 123" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* ── Row 4: Dropoff ── */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-400 flex-shrink-0" />
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dropoff</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Address</Label>
                      <Input {...register("dropoffAddress")} className="h-10 text-sm" placeholder="Full dropoff address" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Notes</Label>
                      <Input {...register("dropoffNotes")} className="h-10 text-sm" placeholder="Instructions for driver…" />
                    </div>
                  </div>
                </section>

                {/* ── Row 5: Client Reference + Notes ── */}
                <section className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Client Reference #</h4>
                    <Input
                      {...register("clientRef")}
                      className="text-sm font-mono h-9"
                      placeholder="Affiliate's confirmation number for this job"
                    />
                    <p className="text-[10px] text-gray-400">Paste the affiliate&apos;s own reservation number here for cross-referencing</p>
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Internal Notes</h4>
                    <Textarea
                      {...register("internalNotes")}
                      rows={3}
                      className="text-sm resize-none"
                      placeholder="Dispatch notes, special instructions, reminders…"
                    />
                  </div>
                </section>
              </div>

              {/* ── SIDEBAR (right, fixed 300px) ── */}
              <div className="w-[300px] flex-shrink-0 bg-gray-50 p-5 space-y-5 flex flex-col">

                {/* Driver & Vehicle */}
                <section className="space-y-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Dispatch</h4>
                  <div className="space-y-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Driver</Label>
                      <Select
                        defaultValue={trip.driverId ?? "none"}
                        onValueChange={(v) => { if (typeof v === "string") setValue("driverId", v === "none" ? "" : v) }}
                      >
                        <SelectTrigger className="h-10 text-sm bg-white w-full">
                          <SelectValue>
                            {driverIdValue
                              ? (drivers?.find(d => d.id === driverIdValue)?.name ?? "Unassigned")
                              : (trip.driverId ? (drivers?.find(d => d.id === trip.driverId)?.name ?? "Unassigned") : "Unassigned")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {drivers?.filter((d) => d.status === "ACTIVE").map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Vehicle</Label>
                      <Select
                        defaultValue={trip.vehicleId ?? "none"}
                        onValueChange={(v) => { if (typeof v === "string") setValue("vehicleId", v === "none" ? "" : v) }}
                      >
                        <SelectTrigger className="h-10 text-sm bg-white w-full">
                          <SelectValue>
                            {vehicleIdValue
                              ? (vehicles?.find(v => v.id === vehicleIdValue)?.name ?? "None")
                              : (trip.vehicleId ? (vehicles?.find(v => v.id === trip.vehicleId)?.name ?? "None") : "None")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {vehicles?.filter((v) => v.status === "ACTIVE").map((v) => (
                            <SelectItem key={v.id} value={v.id}>{v.name} · {v.capacity} pax</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                <div className="border-t" />

                {/* Pricing */}
                <section className="space-y-3">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pricing</h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Base Fare</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <Input
                          type="number" step="0.01"
                          {...register("price", { valueAsNumber: true })}
                          className="pl-6 h-10 text-sm bg-white"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-500">Gratuity %</Label>
                      <Input
                        type="number" min={0} max={100}
                        {...register("gratuityPercent", { valueAsNumber: true })}
                        className="h-10 text-sm bg-white"
                      />
                    </div>
                  </div>
                  {price > 0 && (
                    <div className="bg-white rounded-lg border px-3 py-2.5 space-y-1.5 mt-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Gratuity ({gratuityPercent}%)</span>
                        <span>{formatCurrency(gratuityAmt)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-1.5">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}
                </section>

                <div className="border-t" />

                {/* Extras */}
                <section className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Extras</h4>
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                    {([
                      { name: "vip",             label: "VIP" },
                      { name: "meetAndGreet",    label: "Meet & Greet" },
                      { name: "childSeat",       label: "Child Seat" },
                      { name: "wheelchairAccess",label: "Wheelchair" },
                    ] as const).map(({ name, label }) => (
                      <div key={name} className="flex items-center gap-2">
                        <Checkbox
                          id={`chk-${name}`}
                          defaultChecked={trip[name]}
                          onCheckedChange={(v) => setValue(name, Boolean(v))}
                        />
                        <Label htmlFor={`chk-${name}`} className="text-sm font-normal cursor-pointer leading-tight">{label}</Label>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Push cancel to bottom */}
                <div className="flex-1" />

                {!isFinished && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 text-sm h-9 border border-red-200"
                    onClick={() => {
                      if (window.confirm("Cancel this trip?")) {
                        updateTrip.mutate({ id: trip.id, status: "CANCELLED" }, { onSuccess: onClose })
                      }
                    }}
                  >
                    Cancel Trip
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
