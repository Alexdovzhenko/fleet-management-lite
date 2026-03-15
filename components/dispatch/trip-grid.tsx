"use client"

import { useRef } from "react"
import { Plane, Star, Baby, Accessibility, Bell, Phone, ArrowRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTime, formatCurrency, getInitials, getTripStatusLabel, cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import type { Trip, TripStatus, TripType } from "@/types"

interface TripGridProps {
  trips: Trip[]
  selectedTripId?: string | null
  onSelect: (trip: Trip) => void
  onDoubleClick?: (trip: Trip, position: { x: number; y: number }) => void
  showDate?: boolean
}

const STATUS_ROW: Record<TripStatus, string> = {
  QUOTE:            "bg-white",
  CONFIRMED:        "bg-blue-50/60",
  DISPATCHED:       "bg-violet-50/60",
  DRIVER_EN_ROUTE:  "bg-amber-50/70",
  DRIVER_ARRIVED:   "bg-yellow-50/70",
  IN_PROGRESS:      "bg-emerald-50/70",
  COMPLETED:        "bg-gray-50",
  CANCELLED:        "bg-red-50/40 opacity-70",
  NO_SHOW:          "bg-red-50/40 opacity-70",
}

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

const STATUS_DOT: Record<TripStatus, string> = {
  QUOTE:            "bg-slate-400",
  CONFIRMED:        "bg-blue-500",
  DISPATCHED:       "bg-violet-500",
  DRIVER_EN_ROUTE:  "bg-amber-500",
  DRIVER_ARRIVED:   "bg-yellow-500",
  IN_PROGRESS:      "bg-emerald-500",
  COMPLETED:        "bg-gray-400",
  CANCELLED:        "bg-red-500",
  NO_SHOW:          "bg-red-400",
}

const TYPE_LABELS: Record<TripType, string> = {
  ONE_WAY:        "One Way",
  ROUND_TRIP:     "Round Trip",
  HOURLY:         "Hourly",
  AIRPORT_PICKUP: "✈ Arrival",
  AIRPORT_DROPOFF:"✈ Departure",
  MULTI_STOP:     "Multi-Stop",
  SHUTTLE:        "Shuttle",
}

const TYPE_STYLE: Record<TripType, string> = {
  ONE_WAY:        "bg-gray-100 text-gray-600",
  ROUND_TRIP:     "bg-indigo-100 text-indigo-700",
  HOURLY:         "bg-teal-100 text-teal-700",
  AIRPORT_PICKUP: "bg-sky-100 text-sky-700",
  AIRPORT_DROPOFF:"bg-sky-100 text-sky-700",
  MULTI_STOP:     "bg-orange-100 text-orange-700",
  SHUTTLE:        "bg-purple-100 text-purple-700",
}

const COLUMNS = [
  { key: "status",   label: "Status",   width: "w-32"  },
  { key: "time",     label: "PU Time",  width: "w-20"  },
  { key: "conf",     label: "Conf #",   width: "w-24"  },
  { key: "passenger",label: "Passenger",width: "w-40"  },
  { key: "phone",    label: "Phone",    width: "w-32"  },
  { key: "type",     label: "Service",  width: "w-28"  },
  { key: "pickup",   label: "Pickup",   width: "w-48"  },
  { key: "dropoff",  label: "Dropoff",  width: "w-48"  },
  { key: "driver",   label: "Driver",   width: "w-36"  },
  { key: "vehicle",  label: "Vehicle",  width: "w-32"  },
  { key: "pax",      label: "Pax",      width: "w-12"  },
  { key: "price",    label: "Price",    width: "w-24"  },
  { key: "flags",    label: "",         width: "w-20"  },
]

export function TripGrid({ trips, selectedTripId, onSelect, onDoubleClick, showDate }: TripGridProps) {
  const clickRef = useRef<{ timer: ReturnType<typeof setTimeout>; trip: Trip } | null>(null)

  function handleRowClick(trip: Trip) {
    if (!onDoubleClick) { onSelect(trip); return }
    if (clickRef.current) return
    clickRef.current = {
      timer: setTimeout(() => {
        clickRef.current = null
        onSelect(trip)
      }, 230),
      trip,
    }
  }

  function handleRowDoubleClick(trip: Trip, e: React.MouseEvent) {
    if (clickRef.current) {
      clearTimeout(clickRef.current.timer)
      clickRef.current = null
    }
    onDoubleClick?.(trip, { x: e.clientX, y: e.clientY })
  }

  if (!trips.length) return null

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b bg-gray-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap",
                    col.width
                  )}
                >
                  {col.label}
                </th>
              ))}
              {showDate && (
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap w-28">
                  Date
                </th>
              )}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {trips.map((trip, idx) => {
              const isSelected = trip.id === selectedTripId
              const isUnassigned = !trip.driverId && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status)
              const passengerDisplay = trip.passengerName || trip.customer?.name || "—"
              const phone = trip.passengerPhone || trip.customer?.phone

              return (
                <tr
                  key={trip.id}
                  onClick={() => handleRowClick(trip)}
                  onDoubleClick={(e) => handleRowDoubleClick(trip, e)}
                  className={cn(
                    "border-b last:border-0 cursor-pointer transition-all select-none",
                    STATUS_ROW[trip.status],
                    isSelected
                      ? "ring-2 ring-inset ring-blue-500 bg-blue-50/80"
                      : "hover:brightness-95",
                    isUnassigned && !isSelected && "border-l-2 border-l-amber-400",
                    idx % 2 === 1 && !isSelected ? "brightness-[0.98]" : ""
                  )}
                >
                  {/* Status */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full", STATUS_BADGE[trip.status])}>
                      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[trip.status])} />
                      {getTripStatusLabel(trip.status)}
                    </span>
                  </td>

                  {/* PU Time */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">{formatTime(trip.pickupTime)}</span>
                  </td>

                  {/* Conf # */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs font-mono text-gray-500">{trip.tripNumber}</span>
                  </td>

                  {/* Passenger */}
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{passengerDisplay}</span>
                      {trip.passengerName && trip.customer?.name && trip.passengerName !== trip.customer.name && (
                        <span className="text-xs text-gray-400 truncate max-w-[150px]">{trip.customer.name}</span>
                      )}
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Phone className="w-3 h-3" />
                        {phone}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Service type */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", TYPE_STYLE[trip.tripType])}>
                      {TYPE_LABELS[trip.tripType]}
                    </span>
                  </td>

                  {/* Pickup */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5 max-w-[180px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
                      <span className="text-xs text-gray-700 leading-tight line-clamp-2">{trip.pickupAddress}</span>
                    </div>
                  </td>

                  {/* Dropoff */}
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5 max-w-[180px]">
                      <span className="w-2 h-2 rounded-sm bg-red-400 flex-shrink-0 mt-1" />
                      <span className="text-xs text-gray-700 leading-tight line-clamp-2">{trip.dropoffAddress}</span>
                    </div>
                  </td>

                  {/* Driver */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {trip.driver ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6 flex-shrink-0">
                          <AvatarFallback className="text-[9px] font-bold text-white bg-[#2E4369]">
                            {getInitials(trip.driver.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-gray-700 truncate max-w-[90px]">{trip.driver.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Unassigned</span>
                    )}
                  </td>

                  {/* Vehicle */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {trip.vehicle ? (
                      <span className="text-xs text-gray-600 truncate max-w-[110px] block">{trip.vehicle.name}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Pax */}
                  <td className="px-3 py-2.5 whitespace-nowrap text-center">
                    <span className="text-sm font-medium text-gray-700">{trip.passengerCount}</span>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {trip.totalPrice ? formatCurrency(trip.totalPrice) : trip.price ? formatCurrency(trip.price) : <span className="text-gray-300 font-normal text-xs">—</span>}
                    </span>
                  </td>

                  {/* Flags */}
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {trip.flightNumber && <Plane className="w-3.5 h-3.5 text-sky-500" />}
                      {trip.vip && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      {trip.meetAndGreet && <Bell className="w-3.5 h-3.5 text-purple-400" />}
                      {trip.childSeat && <Baby className="w-3.5 h-3.5 text-pink-400" />}
                      {trip.wheelchairAccess && <Accessibility className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                  </td>

                  {/* Date (search mode only) */}
                  {showDate && (
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-xs font-medium text-gray-600">
                        {format(parseISO(trip.pickupDate), "MMM d, yyyy")}
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
