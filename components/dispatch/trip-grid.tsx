"use client"

import { useRef, useState } from "react"
import { Plane, Star, Baby, MapPin, Bell, Phone, GripVertical } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatTime, formatCurrency, formatPhone, getInitials, cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import type { Trip, TripStatus, TripType } from "@/types"
import { useColumnOrderStore } from "@/lib/stores/column-order-store"
import { useStatusConfig } from "@/lib/hooks/use-status-config"

interface TripGridProps {
  trips: Trip[]
  selectedTripId?: string | null
  onSelect: (trip: Trip) => void
  onDoubleClick?: (trip: Trip, position: { x: number; y: number }) => void
  showDate?: boolean
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

const ALL_COLUMNS = [
  { key: "status",    label: "Status",    width: "w-32" },
  { key: "time",      label: "PU Time",   width: "w-20" },
  { key: "conf",      label: "Conf #",    width: "w-24" },
  { key: "company",   label: "Company",   width: "w-36" },
  { key: "passenger", label: "Passenger", width: "w-40" },
  { key: "phone",     label: "Phone",     width: "w-32" },
  { key: "type",      label: "Service",   width: "w-28" },
  { key: "pickup",    label: "Pickup",    width: "w-48" },
  { key: "dropoff",   label: "Dropoff",   width: "w-48" },
  { key: "driver",    label: "Driver",    width: "w-36" },
  { key: "vehicle-type", label: "Type", width: "w-24" },
  { key: "vehicle",   label: "Vehicle",   width: "w-32" },
  { key: "affiliate", label: "Affiliate", width: "w-36" },
  { key: "pax",       label: "Pax",       width: "w-12" },
  { key: "price",     label: "Price",     width: "w-24" },
  { key: "flags",     label: "",          width: "w-20" },
]


export function TripGrid({ trips, selectedTripId, onSelect, onDoubleClick, showDate }: TripGridProps) {
  const clickRef = useRef<{ timer: ReturnType<typeof setTimeout>; trip: Trip } | null>(null)
  const { columnOrder, hiddenColumns, setColumnOrder } = useColumnOrderStore()
  const { getStatusBadgeClasses, getStatusDotClass, getStatusRowClass, getStatusLabel } = useStatusConfig()

  // Drag-and-drop state
  // dragKeyRef holds the active drag key without causing re-renders (prevents drag cancellation)
  const dragKeyRef = useRef<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)   // visual only
  const [overKey, setOverKey] = useState<string | null>(null)
  const [dropSide, setDropSide] = useState<"left" | "right">("left")

  // Merge stored order with ALL_COLUMNS — ensures new columns always appear
  // Then filter out hidden columns
  const orderedColumns = [
    ...columnOrder
      .map((key) => ALL_COLUMNS.find((c) => c.key === key))
      .filter(Boolean),
    ...ALL_COLUMNS.filter((c) => !columnOrder.includes(c.key)),
  ].filter((c) => c && !hiddenColumns.includes(c.key)) as typeof ALL_COLUMNS

  // ── Click / double-click handlers ──────────────────────────────────────────

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

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  function handleDragStart(e: React.DragEvent, key: string) {
    dragKeyRef.current = key
    // Required for Firefox — must set data for drag to work
    e.dataTransfer.setData("text/plain", key)
    e.dataTransfer.effectAllowed = "move"
    // Delay visual state so the browser captures the drag image before opacity changes
    requestAnimationFrame(() => setDragKey(key))
  }

  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key === dragKeyRef.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const side = e.clientX < rect.left + rect.width / 2 ? "left" : "right"
    setOverKey(key)
    setDropSide(side)
  }

  function handleDrop(e: React.DragEvent, targetKey: string) {
    e.preventDefault()
    const fromKey = dragKeyRef.current
    if (!fromKey || fromKey === targetKey) { reset(); return }
    const order = [...orderedColumns.map((c) => c.key)]
    const fromIdx = order.indexOf(fromKey)
    if (fromIdx === -1) { reset(); return }

    order.splice(fromIdx, 1)
    const toIdx = order.indexOf(targetKey)
    if (toIdx === -1) { reset(); return }
    const insertAt = dropSide === "left" ? toIdx : toIdx + 1
    order.splice(insertAt, 0, fromKey)
    setColumnOrder(order)
    reset()
  }

  function reset() {
    dragKeyRef.current = null
    setDragKey(null)
    setOverKey(null)
  }

  // ── Cell renderer ──────────────────────────────────────────────────────────

  function renderCell(key: string, trip: Trip) {
    const passengerDisplay = trip.passengerName || trip.customer?.name || "—"
    const phone = trip.passengerPhone || trip.customer?.phone
    const activeFarmOut = trip.farmOuts?.[0]
    const isFarmedOut = !trip.farmedIn && activeFarmOut?.status === "ACCEPTED"

    switch (key) {
      case "status":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {isFarmedOut ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-500" />
                Farmed Out
              </span>
            ) : (
              <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full", getStatusBadgeClasses(trip.status))}>
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", getStatusDotClass(trip.status))} />
                {getStatusLabel(trip.status)}
              </span>
            )}
          </td>
        )
      case "time":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            <span className="text-sm font-bold text-gray-900">{formatTime(trip.pickupTime)}</span>
          </td>
        )
      case "conf":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            <span className="text-xs font-mono font-semibold text-blue-600">{trip.tripNumber}</span>
          </td>
        )
      case "company": {
        const companyDisplay = trip.customer?.company || trip.customer?.name
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {companyDisplay ? (
              <span className="text-xs text-gray-700 truncate max-w-[130px] block">{companyDisplay}</span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      }
      case "passenger":
        return (
          <td key={key} className="px-3 py-2.5">
            <span className="text-sm font-medium text-gray-900 truncate max-w-[150px] block">{passengerDisplay}</span>
          </td>
        )
      case "phone":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {phone ? (
              <a href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                <Phone className="w-3 h-3" />{formatPhone(phone)}
              </a>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      case "type":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", TYPE_STYLE[trip.tripType])}>
              {TYPE_LABELS[trip.tripType]}
            </span>
          </td>
        )
      case "pickup":
        return (
          <td key={key} className="px-3 py-2.5">
            <div className="flex items-start gap-1.5 max-w-[180px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-1" />
              <span className="text-xs text-gray-700 leading-tight line-clamp-2">{trip.pickupAddress}</span>
            </div>
          </td>
        )
      case "dropoff":
        return (
          <td key={key} className="px-3 py-2.5">
            <div className="flex items-start gap-1.5 max-w-[180px]">
              <span className="w-2 h-2 rounded-sm bg-red-400 flex-shrink-0 mt-1" />
              <span className="text-xs text-gray-700 leading-tight line-clamp-2">{trip.dropoffAddress}</span>
            </div>
          </td>
        )
      case "driver":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {trip.driver ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-[#2E4369] flex items-center justify-center">
                  {trip.driver.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trip.driver.avatarUrl} alt={trip.driver.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-white">{getInitials(trip.driver.name)}</span>
                  )}
                </div>
                <span className="text-xs text-gray-700 truncate max-w-[90px]">{trip.driver.name}</span>
              </div>
            ) : (
              <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Unassigned</span>
            )}
          </td>
        )
      case "vehicle-type":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {trip.vehicleType ? (
              <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                {trip.vehicleType.replace(/_/g, " ")}
              </span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      case "vehicle":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {trip.vehicle ? (
              <span className="text-xs text-gray-600 truncate max-w-[110px] block">{trip.vehicle.name}</span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      case "affiliate": {
        const affiliateName = trip.farmedIn?.name || (isFarmedOut ? activeFarmOut?.toCompany?.name : null)
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {affiliateName ? (
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[130px] block">
                {affiliateName}
              </span>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </td>
        )
      }
      case "pax":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap text-center">
            <span className="text-sm font-medium text-gray-700">{trip.passengerCount}</span>
          </td>
        )
      case "price":
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            {trip.farmedIn ? (
              trip.agreedPrice ? (
                <div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(trip.agreedPrice)}</span>
                  <span className="block text-[10px] text-indigo-500 font-medium">Agreed Rate</span>
                </div>
              ) : (
                <span className="text-gray-300 font-normal text-xs">—</span>
              )
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {trip.totalPrice ? formatCurrency(trip.totalPrice) : trip.price ? formatCurrency(trip.price) : <span className="text-gray-300 font-normal text-xs">—</span>}
              </span>
            )}
          </td>
        )
      case "flags": {
        return (
          <td key={key} className="px-3 py-2.5 whitespace-nowrap">
            <div className="flex items-center gap-1">
              {trip.flightNumber && <Plane className="w-3.5 h-3.5 text-sky-500" />}
              {trip.vip && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              {trip.meetAndGreet && <Bell className="w-3.5 h-3.5 text-purple-400" />}
              {trip.childSeat && <Baby className="w-3.5 h-3.5 text-pink-400" />}
              {trip.curbsidePickup && <MapPin className="w-3.5 h-3.5 text-blue-400" />}
            </div>
          </td>
        )
      }
      default:
        return <td key={key} />
    }
  }

  if (!trips.length) return null

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="border-b bg-gray-50">
              {orderedColumns.map((col) => {
                const isDragging = col.key === dragKey
                const isOver = col.key === overKey && !isDragging
                return (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.key)}
                    onDragOver={(e) => handleDragOver(e, col.key)}
                    onDrop={(e) => handleDrop(e, col.key)}
                    onDragEnd={reset}
                    className={cn(
                      "text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2.5 whitespace-nowrap",
                      "select-none transition-all duration-100",
                      col.width,
                      isDragging && "opacity-30",
                      isOver && dropSide === "left"  && "border-l-2 border-l-blue-500 bg-blue-50/40",
                      isOver && dropSide === "right" && "border-r-2 border-r-blue-500 bg-blue-50/40",
                    )}
                    style={{ cursor: isDragging ? "grabbing" : "grab" }}
                  >
                    <div className="flex items-center gap-1 group">
                      <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -ml-1" />
                      {col.label}
                    </div>
                  </th>
                )
              })}
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

              return (
                <tr
                  key={trip.id}
                  onClick={() => handleRowClick(trip)}
                  onDoubleClick={(e) => handleRowDoubleClick(trip, e)}
                  className={cn(
                    "border-b last:border-0 cursor-pointer transition-all select-none",
                    getStatusRowClass(trip.status),
                    isSelected
                      ? "ring-2 ring-inset ring-blue-500 bg-blue-50/80"
                      : "hover:brightness-95",
                    isUnassigned && !isSelected && "border-l-2 border-l-amber-400",
                    idx % 2 === 1 && !isSelected ? "brightness-[0.98]" : ""
                  )}
                >
                  {orderedColumns.map((col) => renderCell(col.key, trip))}
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
