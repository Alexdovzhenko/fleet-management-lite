"use client"

import { useState, useEffect } from "react"
import { format, parse, isValid } from "date-fns"
import { ClipboardCopy, X, Check, Calendar, MapPin, User, FileText, Car, Tag } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DatePickerInput } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateTrip } from "@/lib/hooks/use-trips"
import { formatPhone, truncateAddress, cn } from "@/lib/utils"
import type { Trip } from "@/types"

interface CopyReservationModalProps {
  trip: Trip
  open: boolean
  onClose: () => void
}

export function CopyReservationModal({ trip, open, onClose }: CopyReservationModalProps) {
  const [pickupDate, setPickupDate] = useState("")
  const [pickupTime, setPickupTime] = useState("")
  const [copyNotes, setCopyNotes] = useState(true)
  const [timeError, setTimeError] = useState("")
  const [success, setSuccess] = useState<{ tripNumber: string } | null>(null)

  const createTrip = useCreateTrip()

  // Reset state when modal opens
  useEffect(() => {
    if (open && trip) {
      const dateObj = new Date(trip.pickupDate)
      const formattedDate = format(dateObj, "MM/dd/yyyy")
      setPickupDate(formattedDate)
      setPickupTime(trip.pickupTime)
      setCopyNotes(true)
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

    createTrip.mutate({
      customerId: trip.customerId,
      tripType: trip.tripType,
      pickupDate: pickupDateStr,
      pickupTime: pickupTime.trim(),
      pickupAddress: trip.pickupAddress,
      pickupNotes: trip.pickupNotes,
      dropoffAddress: trip.dropoffAddress,
      dropoffNotes: trip.dropoffNotes,
      passengerCount: trip.passengerCount,
      luggageCount: trip.luggageCount ?? undefined,
      passengerName: trip.passengerName ?? undefined,
      passengerPhone: trip.passengerPhone ?? undefined,
      passengerEmail: trip.passengerEmail ?? undefined,
      additionalPassengers: trip.additionalPassengers ?? undefined,
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
      notes: copyNotes ? trip.notes : undefined,
      internalNotes: trip.internalNotes ?? undefined,
    } as never, {
      onSuccess: (newTrip) => {
        setSuccess({ tripNumber: newTrip.tripNumber })
      },
    })
  }

  if (!trip) return null

  const vehicleLabel = trip.vehicle?.name || trip.vehicle?.type || "Unassigned"
  const routingLabel = `${truncateAddress(trip.pickupAddress)} → ${truncateAddress(trip.dropoffAddress)}`
  const customerName = trip.customer?.name || "Unknown Customer"
  const customerPhone = trip.customer?.phone || "-"
  const passengerLabel = `${trip.passengerName || "Not specified"} (${trip.passengerCount} pax)`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[520px] rounded-2xl shadow-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <ClipboardCopy className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Copy Reservation</h2>
            <p className="text-xs text-gray-500 mt-0.5">From {trip.tripNumber}</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          /* Success State */
          <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Reservation Copied!</h3>
              <p className="text-sm text-gray-500 mt-1">A new reservation has been created.</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-1">New Confirmation Number</p>
              <p className="text-base font-mono font-bold text-blue-600 text-center">{success.tripNumber}</p>
            </div>
            <Button
              type="button"
              onClick={onClose}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            {/* Body - Summary Grid */}
            <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(92vh-200px)]">
              <div className="px-6 py-5 space-y-6">
                {/* Read-Only Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Service Type</p>
                    <p className="text-sm font-medium text-gray-900">{trip.tripType}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Vehicle
                    </p>
                    <p className="text-sm font-medium text-gray-900">{vehicleLabel}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Routing
                    </p>
                    <p className="text-sm font-medium text-gray-900">{routingLabel}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Billing Contact
                    </p>
                    <p className="text-sm font-medium text-gray-900">{customerName}</p>
                    {customerPhone !== "-" && (
                      <p className="text-xs text-gray-500 mt-1">{formatPhone(customerPhone)}</p>
                    )}
                  </div>
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Passenger
                    </p>
                    <p className="text-sm font-medium text-gray-900">{passengerLabel}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Editable Adjustments */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Adjustments</h3>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Pickup Date</label>
                      <DatePickerInput
                        value={pickupDate}
                        onChange={setPickupDate}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Pickup Time</label>
                      <Input
                        type="text"
                        value={pickupTime}
                        onChange={(e) => {
                          setPickupTime(e.target.value)
                          if (timeError) setTimeError("")
                        }}
                        placeholder="HH:MM AM/PM"
                        className={cn(
                          "h-9 text-sm",
                          timeError && "border-red-400 focus:ring-red-300/30 focus:border-red-400"
                        )}
                      />
                      {timeError && (
                        <p className="text-xs text-red-600 mt-1">{timeError}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={copyNotes}
                        onCheckedChange={(checked) => setCopyNotes(checked === true)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Include notes in copied reservation</p>
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {trip.notes ? `"${trip.notes.substring(0, 80)}${trip.notes.length > 80 ? "..." : ""}"` : "No notes on original reservation"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center gap-2.5 px-6 py-4 border-t bg-gray-50">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  disabled={createTrip.isPending}
                >
                  {createTrip.isPending ? "Copying..." : "Copy Reservation"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
