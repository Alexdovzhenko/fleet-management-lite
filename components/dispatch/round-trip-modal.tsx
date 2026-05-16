"use client"

import { useEffect, useState } from "react"
import { X, Check, Loader2, ChevronDown, AlertCircle, ArrowLeftRight, MapPin, ImageIcon, FileText, FileCode, File } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DatePickerInput } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { formatPhone, formatTime } from "@/lib/utils"
import { format, parse, isValid } from "date-fns"
import type { Trip, TripType } from "@/types"

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon
  if (mimeType === "application/pdf") return FileText
  if (mimeType === "text/plain") return FileCode
  if (mimeType.includes("word")) return FileText
  return File
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface RoundTripModalProps {
  trip: Trip
  open: boolean
  onClose: () => void
}

const SERVICE_TYPES: TripType[] = ["ONE_WAY", "ROUND_TRIP", "HOURLY", "AIRPORT_PICKUP", "AIRPORT_DROPOFF", "MULTI_STOP", "SHUTTLE"]

const inputStyle: React.CSSProperties = {
  background: "var(--lc-bg-glass)",
  border: "1px solid var(--lc-border)",
  color: "var(--lc-text-primary)",
  borderRadius: "10px",
  height: "40px",
  padding: "0 12px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
}

const selectStyle: React.CSSProperties = {
  background: "var(--lc-bg-glass)",
  border: "1px solid var(--lc-border)",
  color: "var(--lc-text-primary)",
  borderRadius: "10px",
  height: "40px",
  padding: "0 36px 0 12px",
  width: "100%",
  fontSize: "14px",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
}

export function RoundTripModal({ trip, open, onClose }: RoundTripModalProps) {
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [pickupAddress, setPickupAddress] = useState("")
  const [pickupNotes, setPickupNotes] = useState("")
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [dropoffNotes, setDropoffNotes] = useState("")
  const [serviceType, setServiceType] = useState<TripType>("ONE_WAY")
  const [vehicleId, setVehicleId] = useState("")
  const [notes, setNotes] = useState("")
  const [copyNotes, setCopyNotes] = useState(true)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set())
  const [timeError, setTimeError] = useState("")
  const [success, setSuccess] = useState<{ tripNumber: string } | null>(null)

  const createTrip = useCreateTrip()
  const { data: vehicles = [] } = useVehicles()

  useEffect(() => {
    if (open && trip) {
      setPickupDate("")
      setPickupTime("")
      setPickupAddress(trip.dropoffAddress)
      setPickupNotes(trip.dropoffNotes ?? "")
      setDropoffAddress(trip.pickupAddress)
      setDropoffNotes(trip.pickupNotes ?? "")
      setServiceType(trip.tripType)
      setVehicleId(trip.vehicleId || "")
      setNotes(trip.notes ?? "")
      setCopyNotes(true)
      setSelectedAttachmentIds(new Set(trip.attachments?.map(a => a.id) ?? []))
      setTimeError("")
      setSuccess(null)
    }
  }, [open, trip])

  function validateTime(time: string): boolean {
    const trimmed = time.trim()
    if (!trimmed) return false
    return /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/.test(trimmed)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!vehicleId) {
      setTimeError("Please select a vehicle")
      return
    }
    if (!validateTime(pickupTime)) {
      setTimeError("Please enter time in format: HH:MM AM/PM")
      return
    }
    if (!pickupDate.trim()) {
      setTimeError("Please select a return date")
      return
    }

    setTimeError("")

    const parsed = parse(pickupDate, "MM/dd/yyyy", new Date())
    if (!isValid(parsed)) {
      setTimeError("Invalid date format")
      return
    }
    const pickupDateStr = format(parsed, "yyyy-MM-dd")

    const attachmentsToCopy = trip.attachments
      ? trip.attachments
          .filter(a => selectedAttachmentIds.has(a.id))
          .map(a => ({ url: a.url, storagePath: a.storagePath, name: a.name, mimeType: a.mimeType, size: a.size }))
      : undefined

    createTrip.mutate(
      {
        customerId: trip.customerId,
        tripType: serviceType,
        pickupDate: pickupDateStr,
        pickupTime: pickupTime.trim(),
        pickupAddress,
        pickupNotes: pickupNotes || undefined,
        dropoffAddress,
        dropoffNotes: dropoffNotes || undefined,
        passengerCount: trip.passengerCount,
        vehicleId: vehicleId || undefined,
        luggageCount: trip.luggageCount ?? undefined,
        passengerName: trip.passengerName ?? undefined,
        passengerPhone: trip.passengerPhone ?? undefined,
        passengerEmail: trip.passengerEmail ?? undefined,
        additionalPassengers: trip.additionalPassengers
          ? trip.additionalPassengers.map(p => ({
              firstName: p.firstName,
              lastName: p.lastName,
              phone: p.phone ?? undefined,
              email: p.email ?? undefined,
            }))
          : undefined,
        price: trip.price ? parseFloat(trip.price) : undefined,
        gratuity: trip.gratuity ? parseFloat(trip.gratuity) : undefined,
        totalPrice: trip.totalPrice ? parseFloat(trip.totalPrice) : undefined,
        pricingNotes: trip.pricingNotes ?? undefined,
        flightNumber: trip.flightNumber ?? undefined,
        airportCode: trip.airportCode ?? undefined,
        meetAndGreet: trip.meetAndGreet,
        childSeat: trip.childSeat,
        childSeatDetails: trip.childSeatDetails ?? undefined,
        curbsidePickup: trip.curbsidePickup,
        vip: trip.vip,
        clientRef: trip.clientRef ?? undefined,
        notes: copyNotes ? (notes || undefined) : undefined,
        internalNotes: trip.internalNotes ?? undefined,
        attachments: attachmentsToCopy,
      } as never,
      {
        onSuccess: (newTrip) => {
          setSuccess({ tripNumber: newTrip.tripNumber })
        },
        onError: (error: any) => {
          const errorMsg = error?.message ?? (typeof error === "string" ? error : "Failed to create return trip. Please try again.")
          setTimeError(errorMsg)
        },
      }
    )
  }

  if (!trip) return null

  const customerName = trip.customer?.name || "Unknown Customer"
  const customerPhone = trip.customer?.phone || "-"
  const passengerLabel = `${trip.passengerName || "Not specified"} (${trip.passengerCount} pax)`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-2xl p-0 overflow-hidden"
        showCloseButton={false}
        style={{
          background: "var(--lc-bg-surface)",
          border: "1px solid var(--lc-bg-glass-hover)",
          borderRadius: "20px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.70)",
        }}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between px-8 py-6" style={{ borderBottom: "1px solid var(--lc-bg-glass-hover)" }}>
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--lc-text-primary)" }}>Round Trip</h2>
            <p className="text-sm mt-1" style={{ color: "var(--lc-text-dim)" }}>
              Confirmation{" "}
              <span className="font-mono font-semibold" style={{ color: "#c9a87c" }}>{trip.tripNumber}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "var(--lc-text-label)" }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)"
              ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)"
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)"
            }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* SUCCESS STATE */
          <div className="flex flex-col items-center justify-center gap-6 py-16 px-8">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <Check className="w-10 h-10" style={{ color: "#34d399" }} strokeWidth={2} />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-2xl font-semibold" style={{ color: "var(--lc-text-primary)" }}>Return Trip Created</h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--lc-text-dim)" }}>
                Your return reservation has been successfully created with the reversed routing.
              </p>
            </div>
            <div
              className="rounded-xl px-6 py-4 w-full max-w-xs text-center"
              style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-label)" }}>
                New Confirmation Number
              </p>
              <p className="text-xl font-mono font-bold tracking-wide" style={{ color: "#c9a87c" }}>{success.tripNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full max-w-xs py-2.5 rounded-xl text-sm font-semibold transition-opacity"
              style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(100vh-240px)]">
            <div className="px-8 py-8 space-y-8">

              {/* REVERSED ROUTE */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--lc-text-label)" }}>
                  Reversed Route
                </p>
                <div
                  className="rounded-xl p-5 space-y-4"
                  style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
                >
                  {/* New Pickup (was dropoff) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.20)" }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: "#34d399" }} strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.80)" }}>
                        New Pickup (was dropoff)
                      </p>
                    </div>
                    <input
                      type="text"
                      value={pickupAddress}
                      onChange={e => setPickupAddress(e.target.value)}
                      placeholder="Pickup address"
                      style={inputStyle}
                    />
                    {pickupNotes && (
                      <p className="text-xs italic mt-1.5" style={{ color: "var(--lc-text-label)" }}>Notes: {pickupNotes}</p>
                    )}
                  </div>

                  {/* Reversed pill */}
                  <div className="flex justify-center py-1">
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
                      style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
                    >
                      <ArrowLeftRight className="w-3 h-3" style={{ color: "#c9a87c" }} strokeWidth={2} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--lc-text-dim)" }}>
                        Reversed
                      </span>
                    </div>
                  </div>

                  {/* New Dropoff (was pickup) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.20)" }}
                      >
                        <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(248,113,113,0.85)" }} strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(248,113,113,0.75)" }}>
                        New Dropoff (was pickup)
                      </p>
                    </div>
                    <input
                      type="text"
                      value={dropoffAddress}
                      onChange={e => setDropoffAddress(e.target.value)}
                      placeholder="Dropoff address"
                      style={inputStyle}
                    />
                    {dropoffNotes && (
                      <p className="text-xs italic mt-1.5" style={{ color: "var(--lc-text-label)" }}>Notes: {dropoffNotes}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RESERVATION DETAILS */}
              <div className="grid grid-cols-2 gap-6">
                {/* Service Type */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-label)" }}>
                    Service Type
                  </p>
                  <div className="relative">
                    <select
                      value={serviceType}
                      onChange={e => setServiceType(e.target.value as TripType)}
                      style={selectStyle}
                    >
                      {SERVICE_TYPES.map(type => (
                        <option key={type} value={type} style={{ background: "var(--lc-bg-surface)", color: "var(--lc-text-primary)" }}>
                          {type.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                  </div>
                </div>

                {/* Vehicle */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-label)" }}>
                    Vehicle <span style={{ color: "rgba(248,113,113,0.85)" }}>*</span>
                  </p>
                  <div className="relative">
                    <select
                      value={vehicleId}
                      onChange={e => {
                        setVehicleId(e.target.value)
                        if (timeError === "Please select a vehicle") setTimeError("")
                      }}
                      style={{
                        ...selectStyle,
                        borderColor: timeError === "Please select a vehicle" ? "rgba(248,113,113,0.50)" : "var(--lc-border)",
                      }}
                    >
                      <option value="" style={{ background: "var(--lc-bg-surface)", color: "var(--lc-text-label)" }}>Select a vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id} style={{ background: "var(--lc-bg-surface)", color: "var(--lc-text-primary)" }}>
                          {vehicle.name} ({vehicle.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                  </div>
                </div>

                {/* Billing Contact */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-label)" }}>
                    Billing Contact
                  </p>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--lc-text-primary)" }}>{customerName}</p>
                    {customerPhone !== "-" && (
                      <p className="text-xs mt-1" style={{ color: "var(--lc-text-dim)" }}>{formatPhone(customerPhone)}</p>
                    )}
                  </div>
                </div>

                {/* Passenger */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-label)" }}>
                    Passenger
                  </p>
                  <p className="text-sm font-medium" style={{ color: "var(--lc-text-primary)" }}>{passengerLabel}</p>
                </div>
              </div>

              {/* RETURN TRIP DETAILS */}
              <div className="space-y-5">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--lc-text-label)" }}>
                  Return Trip Details
                </p>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-2.5" style={{ color: "var(--lc-text-dim)" }}>
                      Return Date <span style={{ color: "rgba(248,113,113,0.85)" }}>*</span>
                    </label>
                    <DatePickerInput value={pickupDate} onChange={setPickupDate} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-2.5" style={{ color: "var(--lc-text-dim)" }}>
                      Return Time
                    </label>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={e => {
                        setPickupTime(e.target.value)
                        if (timeError) setTimeError("")
                      }}
                      onBlur={e => setPickupTime(formatTime(e.target.value))}
                      placeholder="HH:MM AM/PM"
                      style={{
                        ...inputStyle,
                        borderColor: timeError ? "rgba(248,113,113,0.50)" : "var(--lc-border)",
                      }}
                    />
                    {timeError && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(248,113,113,0.85)" }} />
                        <p className="text-xs" style={{ color: "rgba(248,113,113,0.85)" }}>{timeError}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div
                  className="rounded-xl p-4 cursor-pointer transition-colors"
                  style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
                  onClick={() => setCopyNotes(!copyNotes)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={copyNotes}
                      onCheckedChange={checked => setCopyNotes(checked === true)}
                      className="mt-1.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--lc-text-primary)" }}>Include notes</p>
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--lc-text-label)" }}>
                        {notes
                          ? `"${notes.substring(0, 100)}${notes.length > 100 ? "…" : ""}"`
                          : "No notes on original reservation"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attached Files */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-label)" }}>
                    Attached Files
                  </p>
                  {trip?.attachments && trip.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {trip.attachments.map(attachment => {
                        const Icon = getFileIcon(attachment.mimeType)
                        const isSelected = selectedAttachmentIds.has(attachment.id)
                        return (
                          <label
                            key={attachment.id}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg cursor-pointer transition-colors"
                            style={{
                              background: isSelected ? "rgba(201,168,124,0.08)" : "var(--lc-bg-card)",
                              border: `1px solid ${isSelected ? "rgba(201,168,124,0.20)" : "var(--lc-bg-glass-mid)"}`,
                            }}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={checked => {
                                setSelectedAttachmentIds(prev => {
                                  const next = new Set(prev)
                                  if (checked) next.add(attachment.id)
                                  else next.delete(attachment.id)
                                  return next
                                })
                              }}
                            />
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                              style={{ background: "var(--lc-bg-glass-mid)" }}
                            >
                              <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? "#c9a87c" : "var(--lc-text-label)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate" style={{ color: isSelected ? "var(--lc-text-primary)" : "var(--lc-text-dim)" }}>
                                {attachment.name}
                              </p>
                              <p className="text-[11px]" style={{ color: "var(--lc-text-muted)" }}>{formatFileSize(attachment.size)}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs italic" style={{ color: "var(--lc-text-muted)" }}>No attachments on original reservation</p>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="flex items-center gap-3 px-8 py-5 sticky bottom-0"
              style={{
                borderTop: "1px solid var(--lc-bg-glass-hover)",
                background: "rgba(13,21,38,0.97)",
                backdropFilter: "blur(8px)",
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={createTrip.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)", color: "var(--lc-text-secondary)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTrip.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
                onMouseEnter={e => { if (!createTrip.isPending) (e.currentTarget as HTMLElement).style.opacity = "0.85" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
              >
                {createTrip.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {createTrip.isPending ? "Creating..." : "Create Return Trip"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
