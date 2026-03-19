"use client"

import { Plane, Star, Baby, Accessibility, Bell, Phone, ChevronRight } from "lucide-react"
import { TripStatusDot } from "@/components/trips/trip-status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTime, truncateAddress, getInitials, cn } from "@/lib/utils"
import type { Trip } from "@/types"

interface TripCardProps {
  trip: Trip
  isSelected?: boolean
  onClick?: () => void
}

export function TripCard({ trip, isSelected, onClick }: TripCardProps) {
  const isUnassigned = !trip.driverId
  const isUrgent = isUnassigned && ["CONFIRMED", "DISPATCHED"].includes(trip.status)

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border p-4 cursor-pointer transition-all",
        isSelected ? "border-blue-500 shadow-md" : "hover:border-gray-300 hover:shadow-sm",
        isUrgent && !isSelected ? "border-amber-300 bg-amber-50/30" : ""
      )}
    >
      {/* Header Row */}
      <div className="flex items-start gap-2 mb-2">
        <TripStatusDot status={trip.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">{formatTime(trip.pickupTime)}</span>
            <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
              <span className="text-[8px] font-semibold uppercase tracking-wider text-blue-400">Conf#</span>
              <span className="text-[10px] font-mono font-bold text-blue-700">{trip.tripNumber}</span>
            </span>
          </div>
        </div>
        {/* Flags */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {trip.flightNumber && <Plane className="w-3.5 h-3.5 text-blue-400" />}
          {trip.meetAndGreet && <Bell className="w-3.5 h-3.5 text-purple-400" />}
          {trip.vip && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
          {trip.childSeat && <Baby className="w-3.5 h-3.5 text-pink-400" />}
          {trip.wheelchairAccess && <Accessibility className="w-3.5 h-3.5 text-blue-400" />}
          {isUrgent && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">UNASSIGNED</span>}
        </div>
      </div>

      {/* Route */}
      <div className="text-sm text-gray-700 mb-2 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="truncate">{truncateAddress(trip.pickupAddress)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-2 h-2 rounded-sm bg-red-400 flex-shrink-0" />
          <span className="truncate">{truncateAddress(trip.dropoffAddress)}</span>
        </div>
      </div>

      {/* Driver / Customer Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {trip.driver ? (
            <>
              <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-700 flex items-center justify-center flex-shrink-0">
                {trip.driver.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={trip.driver.avatarUrl} alt={trip.driver.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-white">{getInitials(trip.driver.name)}</span>
                )}
              </div>
              <span className="text-xs text-gray-600">{trip.driver.name}</span>
              {trip.vehicle && (
                <span className="text-xs text-gray-400">· {trip.vehicle.name}</span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-400 italic">No driver assigned</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trip.customer?.phone && (
            <a
              href={`tel:${trip.customer.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
            >
              <Phone className="w-3 h-3 text-gray-500" />
            </a>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </div>
  )
}
