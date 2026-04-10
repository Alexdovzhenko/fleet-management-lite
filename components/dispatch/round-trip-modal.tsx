"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2, ChevronDown, AlertCircle, ArrowLeftRight, ImageIcon, FileText, FileCode, File } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePickerInput } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { formatPhone, formatTime, cn } from "@/lib/utils"
import { format, parse, isValid } from "date-fns"
import type { Trip, TripType } from "@/types"

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

interface RoundTripModalProps {
  trip: Trip
  open: boolean
  onClose: () => void
}

const SERVICE_TYPES: TripType[] = ["ONE_WAY", "ROUND_TRIP", "HOURLY", "AIRPORT_PICKUP", "AIRPORT_DROPOFF", "MULTI_STOP", "SHUTTLE"]

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

  // Reset state when modal opens
  useEffect(() => {
    if (open && trip) {
      setPickupDate("")
      setPickupTime("")
      // Reverse the routing
      setPickupAddress(trip.dropoffAddress)
      setPickupNotes(trip.dropoffNotes ?? "")
      setDropoffAddress(trip.pickupAddress)
      setDropoffNotes(trip.pickupNotes ?? "")
      setServiceType(trip.tripType)
      setVehicleId(trip.vehicleId || "")
      setNotes(trip.notes ?? "")
      setCopyNotes(true)
      // Initialize all attachments as selected by default
      setSelectedAttachmentIds(new Set(trip.attachments?.map(a => a.id) ?? []))
      setTimeError("")
      setSuccess(null)
    }
  }, [open, trip])

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

    if (!pickupDate.trim()) {
      setTimeError("Please select a return date")
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

    createTrip.mutate(
      {
        customerId: trip.customerId,
        tripType: serviceType,
        pickupDate: pickupDateStr,
        pickupTime: pickupTime.trim(),
        pickupAddress: pickupAddress,
        pickupNotes: pickupNotes || undefined,
        dropoffAddress: dropoffAddress,
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
        wheelchairAccess: trip.wheelchairAccess,
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
          let errorMsg = "Failed to create return trip. Please try again."
          if (error?.message) {
            errorMsg = error.message
          } else if (typeof error === 'string') {
            errorMsg = error
          }
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
      <DialogContent className="w-full max-w-2xl rounded-2xl shadow-2xl p-0 overflow-hidden" showCloseButton={false}>
        {/* PREMIUM HEADER */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-2xl font-semibold text-gray-950">Round Trip</h2>
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
          /* SUCCESS STATE */
          <div className="flex flex-col items-center justify-center gap-6 py-16 px-8 bg-gradient-to-br from-emerald-50 to-white">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
              <Check className="w-10 h-10 text-emerald-600" strokeWidth={2} />
            </div>
            <div className="text-center max-w-sm">
              <h3 className="text-2xl font-semibold text-gray-950">Return Trip Created</h3>
              <p className="text-sm text-gray-600 mt-2">Your return reservation has been successfully created with the reversed routing.</p>
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

              {/* ROUTE REVERSAL SECTION */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Reversed Route</h3>
                <div className="border border-blue-100 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-white space-y-5">
                  {/* New Pickup (was dropoff) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                      </div>
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">New Pickup (was dropoff)</p>
                    </div>
                    <Input
                      type="text"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      className="w-full text-sm font-medium text-gray-900 mb-2"
                      placeholder="Pickup address"
                    />
                    {pickupNotes && (
                      <p className="text-xs text-gray-500 italic">Notes: {pickupNotes}</p>
                    )}
                  </div>

                  {/* Center divider with swap indicator */}
                  <div className="flex justify-center py-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" strokeWidth={2} />
                      <span className="text-xs font-semibold text-blue-700">Reversed</span>
                    </div>
                  </div>

                  {/* New Dropoff (was pickup) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" strokeWidth={3} />
                      </div>
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">New Dropoff (was pickup)</p>
                    </div>
                    <Input
                      type="text"
                      value={dropoffAddress}
                      onChange={(e) => setDropoffAddress(e.target.value)}
                      className="w-full text-sm font-medium text-gray-900 mb-2"
                      placeholder="Dropoff address"
                    />
                    {dropoffNotes && (
                      <p className="text-xs text-gray-500 italic">Notes: {dropoffNotes}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* RESERVATION DETAILS */}
              <div className="grid grid-cols-2 gap-6">
                {/* Service Type */}
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

                {/* Vehicle */}
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

              {/* ADJUSTMENTS SECTION */}
              <div className="space-y-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Return Trip Details</h3>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2.5">Return Date <span className="text-red-500">*</span></label>
                    <DatePickerInput
                      value={pickupDate}
                      onChange={setPickupDate}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2.5">Return Time</label>
                    <Input
                      type="text"
                      value={pickupTime}
                      onChange={(e) => {
                        setPickupTime(e.target.value)
                        if (timeError) setTimeError("")
                      }}
                      onBlur={(e) => setPickupTime(formatTime(e.target.value))}
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

                {/* Notes Section */}
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
                        {notes
                          ? `"${notes.substring(0, 100)}${notes.length > 100 ? "…" : ""}"`
                          : "No notes on original reservation"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Attached Files Section */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Attached Files</h3>
                  {trip.attachments && trip.attachments.length > 0 ? (
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
                  ) : (
                    <p className="text-xs text-gray-500 italic">No attachments on original reservation</p>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER */}
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
                {createTrip.isPending ? "Creating..." : "Create Return Trip"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
