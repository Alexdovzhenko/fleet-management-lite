"use client"

import { useState, useEffect } from "react"
import { format, parse, isValid } from "date-fns"
import { ClipboardCopy, X, Check, Calendar, MapPin, User, Car, ChevronDown, AlertCircle, ImageIcon, FileText, FileCode, File } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePickerInput } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { formatPhone, cn } from "@/lib/utils"
import type { Trip, TripType, TripAttachment } from "@/types"

// ── File icon helper ──────────────────────────────────────────────────────

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

  // Reset state when modal opens
  useEffect(() => {
    if (open && trip) {
      const dateObj = new Date(trip.pickupDate)
      const formattedDate = format(dateObj, "MM/dd/yyyy")
      setPickupDate(formattedDate)
      setPickupTime(trip.pickupTime)
      setServiceType(trip.tripType)
      // Set vehicle ID from trip, or use first available vehicle
      setVehicleId(trip.vehicleId || vehicles[0]?.id || "")
      setCopyNotes(true)
      // Initialize all attachments as selected by default
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
    const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/
    return timeRegex.test(trimmed)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate vehicle selection
    if (!vehicleId) {
      setTimeError("Please select a vehicle")
      return
    }

    if (!validateTime(pickupTime)) {
      setTimeError("Please enter time in format: HH:MM AM/PM")
      return
    }

    setTimeError("")

    // Parse MM/DD/YYYY format to YYYY-MM-DD format
    const parsed = parse(pickupDate, "MM/dd/yyyy", new Date())
    if (!isValid(parsed)) {
      setTimeError("Invalid date format")
      return
    }
    const pickupDateStr = format(parsed, "yyyy-MM-dd")

    // Build attachments array from selected attachments
    const attachmentsToCopy = trip.attachments
      ? trip.attachments
          .filter((a) => selectedAttachmentIds.has(a.id))
          .map((a) => ({
            url: a.url,
            storagePath: a.storagePath,
            name: a.name,
            mimeType: a.mimeType,
            size: a.size,
          }))
      : undefined

    createTrip.mutate({
      customerId: trip.customerId,
      tripType: serviceType,
      pickupDate: pickupDateStr,
      pickupTime: pickupTime.trim(),
      pickupAddress: trip.pickupAddress,
      pickupNotes: trip.pickupNotes ?? undefined,
      dropoffAddress: trip.dropoffAddress,
      dropoffNotes: trip.dropoffNotes ?? undefined,
      passengerCount: trip.passengerCount,
      vehicleId: vehicleId || undefined,
      luggageCount: trip.luggageCount ?? undefined,
      passengerName: trip.passengerName ?? undefined,
      passengerPhone: trip.passengerPhone ?? undefined,
      passengerEmail: trip.passengerEmail ?? undefined,
      additionalPassengers: trip.additionalPassengers ? trip.additionalPassengers.map(p => ({
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone ?? undefined,
        email: p.email ?? undefined,
      })) : undefined,
      price: trip.price ? parseFloat(trip.price) : undefined,
      gratuity: trip.gratuity ? parseFloat(trip.gratuity) : undefined,
      totalPrice: trip.totalPrice ? parseFloat(trip.totalPrice) : undefined,
      pricingNotes: trip.pricingNotes ?? undefined,
      flightNumber: trip.flightNumber ?? undefined,
      airportCode: trip.airportCode ?? undefined,
      meetAndGreet: trip.meetAndGreet,
      childSeat: trip.childSeat,
      childSeatDetails: trip.childSeatDetails ?? undefined,
      wheelchairAccess: trip.wheelchairAccess,
      vip: trip.vip,
      clientRef: trip.clientRef ?? undefined,
      notes: copyNotes ? (trip.notes ?? undefined) : undefined,
      internalNotes: trip.internalNotes ?? undefined,
      attachments: attachmentsToCopy,
    } as never, {
      onSuccess: (newTrip) => {
        setSuccess({ tripNumber: newTrip.tripNumber })
      },
      onError: (error: any) => {
        // Extract detailed error message
        let errorMsg = "Failed to copy reservation. Please try again."

        if (error?.message) {
          errorMsg = error.message
        } else if (typeof error === 'string') {
          errorMsg = error
        }

        setTimeError(errorMsg)
      },
    })
  }

  if (!trip) return null

  const customerName = trip.customer?.name || "Unknown Customer"
  const customerPhone = trip.customer?.phone || "-"
  const passengerLabel = `${trip.passengerName || "Not specified"} (${trip.passengerCount} pax)`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl rounded-2xl shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
        {/* PREMIUM HEADER - Single close button, elegant layout */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-2xl font-semibold text-gray-950">Copy Reservation</h2>
            <p className="text-sm text-gray-500 mt-1">Confirmation <span className="font-medium text-gray-700">{trip.tripNumber}</span></p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          /* SUCCESS STATE - Premium celebration design */
          <div className="flex flex-col items-center justify-center gap-6 py-16 px-8 bg-gradient-to-br from-emerald-50 to-white">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
              <Check className="w-10 h-10 text-emerald-600" strokeWidth={2} />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-2xl font-semibold text-gray-950">Reservation Copied</h3>
              <p className="text-sm text-gray-600 mt-2">Your new reservation has been successfully created with all original details.</p>
            </div>
            <div className="bg-white rounded-xl px-6 py-4 border border-emerald-100 shadow-sm w-full max-w-xs">
              <p className="text-xs font-medium text-gray-500 text-center mb-2">New Confirmation Number</p>
              <p className="text-xl font-mono font-bold text-emerald-600 text-center tracking-wide">{success.tripNumber}</p>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="mt-4 w-full max-w-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(100vh-240px)]">
            {/* MAIN CONTENT */}
            <div className="px-8 py-8 space-y-8 bg-white">

              {/* ROUTING SECTION - Redesigned premium routing visualization */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Route</h3>
                <div className="space-y-3">
                  {/* Pickup */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Pickup</p>
                      <p className="text-sm font-medium text-gray-900 break-words leading-snug">{trip.pickupAddress}</p>
                    </div>
                  </div>

                  {/* Arrow divider */}
                  <div className="flex justify-center py-1">
                    <div className="w-0.5 h-3 bg-gradient-to-b from-blue-200 to-transparent" />
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500">Destination</p>
                      <p className="text-sm font-medium text-gray-900 break-words leading-snug">{trip.dropoffAddress}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RESERVATION DETAILS - Clean grid with better structure */}
              <div className="grid grid-cols-2 gap-6">
                {/* Service Type - Now editable */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Service Type</label>
                  <div className="relative">
                    <select
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value as TripType)}
                      className="w-full h-10 px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer"
                    >
                      {SERVICE_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Vehicle - Now shows actual vehicles from fleet */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Vehicle <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={vehicleId}
                      onChange={(e) => {
                        setVehicleId(e.target.value)
                        if (timeError === "Please select a vehicle") setTimeError("")
                      }}
                      className={cn(
                        "w-full h-10 px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none cursor-pointer",
                        timeError === "Please select a vehicle" && "border-red-400 focus:ring-red-300/30 focus:border-red-400"
                      )}
                    >
                      <option value="">Select a vehicle</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.name} ({vehicle.type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Billing Contact */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Billing Contact</label>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customerName}</p>
                    {customerPhone !== "-" && (
                      <p className="text-xs text-gray-500 mt-1">{formatPhone(customerPhone)}</p>
                    )}
                  </div>
                </div>

                {/* Passenger */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 block">Passenger</label>
                  <p className="text-sm font-medium text-gray-900">{passengerLabel}</p>
                </div>
              </div>

              {/* ADJUSTMENTS SECTION - Refined spacing and hierarchy */}
              <div className="space-y-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adjustments</h3>

                {/* Date and Time - Better layout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2.5">Pickup Date</label>
                    <DatePickerInput
                      value={pickupDate}
                      onChange={setPickupDate}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2.5">Pickup Time</label>
                    <Input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => {
                        setPickupTime(e.target.value)
                        if (timeError) setTimeError("")
                      }}
                      placeholder="HH:MM AM/PM"
                      className={cn(
                        "h-10 text-sm",
                        timeError && "border-red-400 focus:ring-red-300/30 focus:border-red-400"
                      )}
                    />
                    {timeError && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-red-600">{timeError}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section - Premium redesign */}
                <div className="border border-gray-200 rounded-xl p-4 bg-white hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={copyNotes}
                      onCheckedChange={(checked) => setCopyNotes(checked === true)}
                      className="mt-1.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">Include notes</p>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {trip.notes
                          ? `"${trip.notes.substring(0, 100)}${trip.notes.length > 100 ? "…" : ""}"`
                          : "No notes on original reservation"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attached Files Section */}
                {trip.attachments && trip.attachments.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attached Files</h3>
                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      {trip.attachments.map((attachment) => {
                        const Icon = getFileIcon(attachment.mimeType)
                        const isSelected = selectedAttachmentIds.has(attachment.id)
                        return (
                          <label
                            key={attachment.id}
                            className={cn(
                              "flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer",
                              isSelected
                                ? "bg-blue-50/50 border-blue-100 hover:bg-blue-50"
                                : "bg-gray-50 border-gray-100 hover:bg-gray-75"
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedAttachmentIds((prev) => {
                                  const next = new Set(prev)
                                  if (checked) {
                                    next.add(attachment.id)
                                  } else {
                                    next.delete(attachment.id)
                                  }
                                  return next
                                })
                              }}
                            />
                            <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{attachment.name}</p>
                              <p className="text-[11px] text-gray-400">{formatFileSize(attachment.size)}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER - Clean action buttons */}
            <div className="flex items-center gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={createTrip.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createTrip.isPending}
              >
                {createTrip.isPending ? "Creating..." : "Copy Reservation"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
