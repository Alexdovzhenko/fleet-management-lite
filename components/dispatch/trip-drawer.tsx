"use client"

import { useState } from "react"
import { Phone, MapPin, Clock, User, Car, DollarSign, FileText, X, Plane } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { TripStatusBadge } from "@/components/trips/trip-status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateTrip } from "@/lib/hooks/use-trips"
import { useDrivers } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { formatDate, formatTime, formatCurrency, formatPhone } from "@/lib/utils"
import type { Trip, TripStatus } from "@/types"

const STATUS_ACTIONS: Record<string, { label: string; nextStatus: TripStatus }> = {
  QUOTE: { label: "Confirm Booking", nextStatus: "CONFIRMED" },
  CONFIRMED: { label: "Dispatch to Driver", nextStatus: "DISPATCHED" },
  DISPATCHED: { label: "Mark En Route", nextStatus: "DRIVER_EN_ROUTE" },
  DRIVER_EN_ROUTE: { label: "Mark Arrived", nextStatus: "DRIVER_ARRIVED" },
  DRIVER_ARRIVED: { label: "Start Trip", nextStatus: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Complete Trip", nextStatus: "COMPLETED" },
}

interface TripDrawerProps {
  trip: Trip | null
  open: boolean
  onClose: () => void
}

export function TripDrawer({ trip, open, onClose }: TripDrawerProps) {
  const [assigningDriver, setAssigningDriver] = useState(false)
  const updateTrip = useUpdateTrip()
  const { data: drivers } = useDrivers()
  const { data: vehicles } = useVehicles()

  if (!trip) return null

  const statusAction = STATUS_ACTIONS[trip.status]
  const canAdvance = !!statusAction && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status)

  function handleStatusAdvance() {
    if (!statusAction || !trip) return
    updateTrip.mutate({ id: trip.id, status: statusAction.nextStatus })
  }

  function handleAssignDriver(driverId: string) {
    if (!trip) return
    updateTrip.mutate({ id: trip.id, driverId, status: trip.status === "QUOTE" ? "CONFIRMED" : trip.status })
    setAssigningDriver(false)
  }

  function handleAssignVehicle(vehicleId: string) {
    if (!trip) return
    updateTrip.mutate({ id: trip.id, vehicleId })
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-gray-400">{trip.tripNumber}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <TripStatusBadge status={trip.status} />
        </div>

        <div className="p-5 space-y-5">
          {/* Primary Action Button */}
          {canAdvance && (
            <Button
              onClick={handleStatusAdvance}
              disabled={updateTrip.isPending}
              className="w-full text-white py-3 text-sm font-semibold"
              style={{ backgroundColor: "#2563EB" }}
            >
              {updateTrip.isPending ? "Updating..." : statusAction.label}
            </Button>
          )}

          {/* Driver & Vehicle */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {trip.driver?.name || <span className="text-gray-400 italic">No driver</span>}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 text-xs h-7"
                onClick={() => setAssigningDriver(!assigningDriver)}
              >
                Reassign
              </Button>
            </div>

            {assigningDriver && (
              <div className="space-y-2">
                <Select onValueChange={(v) => { if (typeof v === "string") handleAssignDriver(v) }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select driver..." />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.filter((d) => d.status === "ACTIVE").map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-400" />
              <Select
                defaultValue={trip.vehicleId || ""}
                onValueChange={(v) => { if (typeof v === "string") handleAssignVehicle(v) }}
              >
                <SelectTrigger className="text-sm border-0 bg-transparent p-0 h-auto shadow-none focus:ring-0">
                  <SelectValue placeholder="Assign vehicle..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.filter((v) => v.status === "ACTIVE").map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name} ({v.capacity} pax)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pickup */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pickup</h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{trip.pickupAddress}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                {formatDate(trip.pickupDate)} at {formatTime(trip.pickupTime)}
              </span>
            </div>
            {trip.flightNumber && (
              <div className="flex items-center gap-2.5">
                <Plane className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">Flight {trip.flightNumber}</span>
                {trip.flightStatus && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                    {trip.flightStatus}
                  </span>
                )}
              </div>
            )}
            {trip.pickupNotes && (
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-500 italic">&quot;{trip.pickupNotes}&quot;</span>
              </div>
            )}
          </div>

          {/* Dropoff */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dropoff</h4>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{trip.dropoffAddress}</span>
            </div>
          </div>

          {/* Passenger */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Passenger</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {trip.passengerName || trip.customer?.name}
                  {trip.passengerCount > 1 && ` (${trip.passengerCount} passengers)`}
                </span>
              </div>
            </div>
            {(trip.passengerPhone || trip.customer?.phone) && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a
                  href={`tel:${trip.passengerPhone || trip.customer?.phone}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {formatPhone(trip.passengerPhone || trip.customer?.phone || "")}
                </a>
                <a
                  href={`sms:${trip.passengerPhone || trip.customer?.phone}`}
                  className="text-xs text-gray-500 hover:text-blue-600 border rounded px-2 py-0.5"
                >
                  Text
                </a>
              </div>
            )}
          </div>

          {/* Pricing */}
          {trip.price && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pricing</h4>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div className="text-sm space-y-0.5">
                  <div className="text-gray-600">Base: {formatCurrency(trip.price)}</div>
                  {trip.gratuity && <div className="text-gray-600">Gratuity: {formatCurrency(trip.gratuity)}</div>}
                  <div className="font-semibold text-gray-900">Total: {formatCurrency(trip.totalPrice || trip.price)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Internal Notes */}
          {trip.internalNotes && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notes</h4>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{trip.internalNotes}</p>
            </div>
          )}

          {/* Cancel */}
          {!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status) && (
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => updateTrip.mutate({ id: trip.id, status: "CANCELLED" })}
            >
              Cancel Trip
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
