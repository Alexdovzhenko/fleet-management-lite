"use client"

import { useState, useEffect } from "react"
import { format, parse, isValid } from "date-fns"
import { X, Check, MapPin, ChevronDown, AlertCircle, ImageIcon, FileText, FileCode, File } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DatePickerInput } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { formatPhone, cn } from "@/lib/utils"
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

interface CopyReservationModalProps {
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
  width: "100%",
  padding: "0 36px 0 12px",
  fontSize: "13px",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  cursor: "pointer",
}

export function CopyReservationModal({ trip, open, onClose }: CopyReservationModalProps) {
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [serviceType, setServiceType] = useState<TripType>(trip?.tripType || "ONE_WAY")
  const [vehicleId, setVehicleId] = useState("")
  const [copyNotes, setCopyNotes] = useState(true)
  const [selectedAttachmentIds, setSelectedAttachmentIds] = useState<Set<string>>(new Set())
  const [timeError, setTimeError] = useState("")
  const [success, setSuccess] = useState<{ tripNumber: string } | null>(null)

  const createTrip = useCreateTrip()
  const { data: vehicles = [] } = useVehicles()

  useEffect(() => {
    if (open && trip) {
      const dateObj = new Date(trip.pickupDate)
      setPickupDate(format(dateObj, "MM/dd/yyyy"))
      setPickupTime(trip.pickupTime)
      setServiceType(trip.tripType)
      setVehicleId(trip.vehicleId || vehicles[0]?.id || "")
      setCopyNotes(true)
      if (trip.attachments && trip.attachments.length > 0) {
        setSelectedAttachmentIds(new Set(trip.attachments.map((a) => a.id)))
      } else {
        setSelectedAttachmentIds(new Set())
      }
      setTimeError("")
      setSuccess(null)
    }
  }, [open, trip, vehicles])

  function validateTime(time: string): boolean {
    const trimmed = time.trim()
    if (!trimmed) return false
    return /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/.test(trimmed)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vehicleId) { setTimeError("Please select a vehicle"); return }
    if (!validateTime(pickupTime)) { setTimeError("Please enter time in format: HH:MM AM/PM"); return }
    setTimeError("")
    const parsed = parse(pickupDate, "MM/dd/yyyy", new Date())
    if (!isValid(parsed)) { setTimeError("Invalid date format"); return }
    const pickupDateStr = format(parsed, "yyyy-MM-dd")
    const attachmentsToCopy = trip.attachments
      ? trip.attachments.filter((a) => selectedAttachmentIds.has(a.id)).map((a) => ({
          url: a.url, storagePath: a.storagePath, name: a.name, mimeType: a.mimeType, size: a.size,
        }))
      : undefined
    createTrip.mutate({
      customerId: trip.customerId, tripType: serviceType, pickupDate: pickupDateStr,
      pickupTime: pickupTime.trim(), pickupAddress: trip.pickupAddress,
      pickupNotes: trip.pickupNotes ?? undefined, dropoffAddress: trip.dropoffAddress,
      dropoffNotes: trip.dropoffNotes ?? undefined, passengerCount: trip.passengerCount,
      vehicleId: vehicleId || undefined, luggageCount: trip.luggageCount ?? undefined,
      passengerName: trip.passengerName ?? undefined, passengerPhone: trip.passengerPhone ?? undefined,
      passengerEmail: trip.passengerEmail ?? undefined,
      additionalPassengers: trip.additionalPassengers ? trip.additionalPassengers.map(p => ({
        firstName: p.firstName, lastName: p.lastName, phone: p.phone ?? undefined, email: p.email ?? undefined,
      })) : undefined,
      price: trip.price ? parseFloat(trip.price) : undefined,
      gratuity: trip.gratuity ? parseFloat(trip.gratuity) : undefined,
      totalPrice: trip.totalPrice ? parseFloat(trip.totalPrice) : undefined,
      pricingNotes: trip.pricingNotes ?? undefined, flightNumber: trip.flightNumber ?? undefined,
      airportCode: trip.airportCode ?? undefined, meetAndGreet: trip.meetAndGreet,
      childSeat: trip.childSeat, childSeatDetails: trip.childSeatDetails ?? undefined,
      curbsidePickup: trip.curbsidePickup, vip: trip.vip, clientRef: trip.clientRef ?? undefined,
      notes: copyNotes ? (trip.notes ?? undefined) : undefined,
      internalNotes: trip.internalNotes ?? undefined, attachments: attachmentsToCopy,
    } as never, {
      onSuccess: (newTrip) => setSuccess({ tripNumber: newTrip.tripNumber }),
      onError: (error: unknown) => {
        const e = error as { message?: string }
        setTimeError(e?.message || "Failed to copy reservation. Please try again.")
      },
    })
  }

  if (!trip) return null

  const customerName = trip.customer?.name || "Unknown Customer"
  const customerPhone = trip.customer?.phone || "-"
  const passengerLabel = `${trip.passengerName || "Not specified"} (${trip.passengerCount} pax)`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-xl rounded-2xl p-0 overflow-hidden gap-0"
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-hover)", boxShadow: "0 32px 80px rgba(0,0,0,0.70)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 flex-shrink-0" style={{ borderBottom: "1px solid var(--lc-bg-glass-mid)" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "var(--lc-text-primary)" }}>Copy Reservation</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--lc-text-label)" }}>
              Confirmation{" "}
              <span className="font-mono font-semibold" style={{ color: "#c9a87c" }}>{trip.tripNumber}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors flex-shrink-0"
            style={{ color: "var(--lc-text-label)", background: "var(--lc-bg-glass)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center gap-5 py-14 px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)" }}>
              <Check className="w-8 h-8" style={{ color: "#34d399" }} strokeWidth={2.5} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold" style={{ color: "var(--lc-text-primary)" }}>Reservation Copied</h3>
              <p className="text-sm mt-1" style={{ color: "var(--lc-text-dim)" }}>New reservation created with all original details.</p>
            </div>
            <div className="px-6 py-3 rounded-xl" style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center mb-1" style={{ color: "var(--lc-text-muted)" }}>New Confirmation</p>
              <p className="text-lg font-mono font-bold text-center" style={{ color: "#c9a87c" }}>{success.tripNumber}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-xs py-2.5 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b688" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 160px)" }}>
            <div className="overflow-y-auto px-6 py-5 space-y-6">

              {/* Route */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-muted)" }}>Route</p>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--lc-bg-glass-hover)" }}>
                  {/* Pickup */}
                  <div className="flex items-start gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--lc-bg-glass)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.20)" }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: "#34d399" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(52,211,153,0.70)" }}>Pickup</p>
                      <p className="text-sm leading-snug" style={{ color: "var(--lc-text-primary)" }}>{trip.pickupAddress}</p>
                    </div>
                  </div>
                  {/* Drop-off */}
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.18)" }}>
                      <MapPin className="w-3.5 h-3.5" style={{ color: "rgba(248,113,113,0.85)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "rgba(248,113,113,0.65)" }}>Destination</p>
                      <p className="text-sm leading-snug" style={{ color: "var(--lc-text-primary)" }}>{trip.dropoffAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Type + Vehicle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-muted)" }}>Service Type</p>
                  <div className="relative">
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as TripType)}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)" }}
                      onBlur={e => { e.currentTarget.style.borderColor = "var(--lc-border)" }}
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
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-muted)" }}>
                    Vehicle <span style={{ color: "rgba(248,113,113,0.80)" }}>*</span>
                  </p>
                  <div className="relative">
                    <select
                      value={vehicleId}
                      onChange={(e) => { setVehicleId(e.target.value); if (timeError === "Please select a vehicle") setTimeError("") }}
                      style={{ ...inputStyle, borderColor: timeError === "Please select a vehicle" ? "rgba(248,113,113,0.50)" : "var(--lc-border)" }}
                      onFocus={e => { e.currentTarget.style.borderColor = timeError === "Please select a vehicle" ? "rgba(248,113,113,0.60)" : "rgba(201,168,124,0.50)" }}
                      onBlur={e => { e.currentTarget.style.borderColor = timeError === "Please select a vehicle" ? "rgba(248,113,113,0.50)" : "var(--lc-border)" }}
                    >
                      <option value="" style={{ background: "var(--lc-bg-surface)", color: "var(--lc-text-label)" }}>Select a vehicle</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id} style={{ background: "var(--lc-bg-surface)", color: "var(--lc-text-primary)" }}>
                          {v.name} ({v.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                  </div>
                </div>
              </div>

              {/* Billing Contact + Passenger */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-muted)" }}>Billing Contact</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>{customerName}</p>
                  {customerPhone !== "-" && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--lc-text-label)" }}>{formatPhone(customerPhone)}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--lc-text-muted)" }}>Passenger</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>{passengerLabel}</p>
                </div>
              </div>

              {/* Adjustments */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-muted)" }}>Adjustments</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--lc-text-dim)" }}>Pickup Date</p>
                    <DatePickerInput value={pickupDate} onChange={setPickupDate} className="w-full" />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--lc-text-dim)" }}>Pickup Time</p>
                    <input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => { setPickupTime(e.target.value); if (timeError) setTimeError("") }}
                      placeholder="HH:MM AM/PM"
                      autoComplete="off"
                      className="outline-none transition-colors"
                      style={{
                        ...inputStyle,
                        padding: "0 12px",
                        borderColor: timeError && timeError !== "Please select a vehicle" ? "rgba(248,113,113,0.50)" : "var(--lc-border)",
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)" }}
                      onBlur={e => { e.currentTarget.style.borderColor = timeError && timeError !== "Please select a vehicle" ? "rgba(248,113,113,0.50)" : "var(--lc-border)" }}
                    />
                  </div>
                </div>
                {timeError && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(248,113,113,0.80)" }} />
                    <p className="text-xs" style={{ color: "rgba(248,113,113,0.80)" }}>{timeError}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors"
                style={{ background: "var(--lc-bg-card)", border: "1px solid var(--lc-bg-glass-hover)" }}
                onClick={() => setCopyNotes(v => !v)}
              >
                <Checkbox
                  checked={copyNotes}
                  onCheckedChange={(checked) => setCopyNotes(checked === true)}
                  className="mt-0.5 flex-shrink-0"
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>Include notes</p>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--lc-text-label)" }}>
                    {trip.notes
                      ? `"${trip.notes.substring(0, 100)}${trip.notes.length > 100 ? "…" : ""}"`
                      : "No notes on original reservation"}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {trip.attachments && trip.attachments.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--lc-text-muted)" }}>Attached Files</p>
                  <div className="space-y-2">
                    {trip.attachments.map((attachment) => {
                      const Icon = getFileIcon(attachment.mimeType)
                      const isSelected = selectedAttachmentIds.has(attachment.id)
                      return (
                        <label
                          key={attachment.id}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors"
                          style={{
                            background: isSelected ? "rgba(201,168,124,0.08)" : "var(--lc-bg-card)",
                            border: `1px solid ${isSelected ? "rgba(201,168,124,0.20)" : "var(--lc-bg-glass-hover)"}`,
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelectedAttachmentIds((prev) => {
                                const next = new Set(prev)
                                if (checked) next.add(attachment.id)
                                else next.delete(attachment.id)
                                return next
                              })
                            }}
                          />
                          <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass-hover)" }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: "var(--lc-text-dim)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>{attachment.name}</p>
                            <p className="text-[11px]" style={{ color: "var(--lc-text-muted)" }}>{formatFileSize(attachment.size)}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--lc-bg-glass-mid)", background: "var(--lc-bg-card)" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={createTrip.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-secondary)", border: "1px solid var(--lc-border)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-border)" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createTrip.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
                onMouseEnter={e => { if (!createTrip.isPending) (e.currentTarget as HTMLElement).style.background = "#d4b688" }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
              >
                {createTrip.isPending ? "Creating…" : "Copy Reservation"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
