"use client"

import { useRef, useState } from "react"
import { Plane, Star, Baby, MapPin, Bell, Phone, GripVertical } from "lucide-react"
import { formatTime, formatCurrency, formatPhone, getInitials, cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import type { Trip, TripType } from "@/types"
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
  ONE_WAY:         "One Way",
  ROUND_TRIP:      "Round Trip",
  HOURLY:          "Hourly",
  AIRPORT_PICKUP:  "Arrival",
  AIRPORT_DROPOFF: "Departure",
  MULTI_STOP:      "Multi-Stop",
  SHUTTLE:         "Shuttle",
}

const TYPE_STYLE: Record<TripType, string> = {
  ONE_WAY:         "bg-white/[0.08] text-white/55",
  ROUND_TRIP:      "bg-indigo-500/15 text-indigo-300",
  HOURLY:          "bg-teal-500/15 text-teal-300",
  AIRPORT_PICKUP:  "bg-sky-500/15 text-sky-300",
  AIRPORT_DROPOFF: "bg-sky-500/15 text-sky-300",
  MULTI_STOP:      "bg-orange-500/15 text-orange-300",
  SHUTTLE:         "bg-purple-500/15 text-purple-300",
}

const TYPE_DOT: Record<TripType, string> = {
  ONE_WAY:         "bg-white/40",
  ROUND_TRIP:      "bg-indigo-400",
  HOURLY:          "bg-teal-400",
  AIRPORT_PICKUP:  "bg-sky-400",
  AIRPORT_DROPOFF: "bg-sky-400",
  MULTI_STOP:      "bg-orange-400",
  SHUTTLE:         "bg-purple-400",
}

const ALL_COLUMNS = [
  { key: "status",       label: "Status",    width: "w-32" },
  { key: "time",         label: "PU Time",   width: "w-20" },
  { key: "conf",         label: "Conf #",    width: "w-24" },
  { key: "company",      label: "Company",   width: "w-36" },
  { key: "passenger",    label: "Passenger", width: "w-40" },
  { key: "phone",        label: "Phone",     width: "w-32" },
  { key: "type",         label: "Service",   width: "w-28" },
  { key: "pickup",       label: "Pickup",    width: "w-48" },
  { key: "dropoff",      label: "Dropoff",   width: "w-48" },
  { key: "driver",       label: "Driver",    width: "w-36" },
  { key: "vehicle-type", label: "Veh Type",  width: "w-24" },
  { key: "vehicle",      label: "Vehicle",   width: "w-32" },
  { key: "affiliate",    label: "Affiliate", width: "w-36" },
  { key: "pax",          label: "Pax",       width: "w-12" },
  { key: "price",        label: "Price",     width: "w-24" },
  { key: "flags",        label: "",          width: "w-20" },
]

export function TripGrid({ trips, selectedTripId, onSelect, onDoubleClick, showDate }: TripGridProps) {
  const clickRef = useRef<{ timer: ReturnType<typeof setTimeout>; trip: Trip } | null>(null)
  const { columnOrder, hiddenColumns, setColumnOrder } = useColumnOrderStore()
  const { getStatusDarkBadge, getStatusDotClass, getStatusLabel } = useStatusConfig()

  const dragKeyRef = useRef<string | null>(null)
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [overKey, setOverKey] = useState<string | null>(null)
  const [dropSide, setDropSide] = useState<"left" | "right">("left")

  const orderedColumns = [
    ...columnOrder.map(key => ALL_COLUMNS.find(c => c.key === key)).filter(Boolean),
    ...ALL_COLUMNS.filter(c => !columnOrder.includes(c.key)),
  ].filter(c => c && !hiddenColumns.includes(c.key)) as typeof ALL_COLUMNS

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

  function handleDragStart(e: React.DragEvent, key: string) {
    dragKeyRef.current = key
    e.dataTransfer.setData("text/plain", key)
    e.dataTransfer.effectAllowed = "move"
    requestAnimationFrame(() => setDragKey(key))
  }

  function handleDragOver(e: React.DragEvent, key: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (key === dragKeyRef.current) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setOverKey(key)
    setDropSide(e.clientX < rect.left + rect.width / 2 ? "left" : "right")
  }

  function handleDrop(e: React.DragEvent, targetKey: string) {
    e.preventDefault()
    const fromKey = dragKeyRef.current
    if (!fromKey || fromKey === targetKey) { reset(); return }
    const order = [...orderedColumns.map(c => c.key)]
    const fromIdx = order.indexOf(fromKey)
    if (fromIdx === -1) { reset(); return }
    order.splice(fromIdx, 1)
    const toIdx = order.indexOf(targetKey)
    if (toIdx === -1) { reset(); return }
    order.splice(dropSide === "left" ? toIdx : toIdx + 1, 0, fromKey)
    setColumnOrder(order)
    reset()
  }

  function reset() {
    dragKeyRef.current = null
    setDragKey(null)
    setOverKey(null)
  }

  function renderCell(key: string, trip: Trip) {
    const passengerDisplay = trip.passengerName || trip.customer?.name || "—"
    const phone = trip.passengerPhone || trip.customer?.phone
    const activeFarmOut = trip.farmOuts?.[0]
    const isFarmedOut = !trip.farmedIn && activeFarmOut?.status === "ACCEPTED"
    const darkBadge = getStatusDarkBadge(trip.status)

    switch (key) {
      case "status":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {isFarmedOut ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-400" />
                Farmed Out
              </span>
            ) : (
              <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", darkBadge.bg, darkBadge.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", darkBadge.dot)} />
                {getStatusLabel(trip.status)}
              </span>
            )}
          </td>
        )

      case "time":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            <span className="text-[13px] font-bold tabular-nums tracking-[-0.01em]" style={{ color: "rgba(255,255,255,0.90)" }}>
              {formatTime(trip.pickupTime)}
            </span>
          </td>
        )

      case "conf":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md">
              {trip.tripNumber}
            </span>
          </td>
        )

      case "company": {
        const companyDisplay = trip.customer?.company || trip.customer?.name
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {companyDisplay ? (
              <span className="text-[12px] font-medium truncate max-w-[130px] block" style={{ color: "rgba(200,212,228,0.70)" }}>{companyDisplay}</span>
            ) : (
              <span className="text-[12px] text-white/20">—</span>
            )}
          </td>
        )
      }

      case "passenger":
        return (
          <td key={key} className="px-3 py-3">
            <span className="text-[13px] font-semibold truncate max-w-[150px] block" style={{ color: "rgba(255,255,255,0.90)" }}>{passengerDisplay}</span>
          </td>
        )

      case "phone":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {phone ? (
              <a
                href={`tel:${phone}`}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 px-2 py-1 rounded-lg transition-colors"
              >
                <Phone className="w-3 h-3 flex-shrink-0" />
                {formatPhone(phone)}
              </a>
            ) : (
              <span className="text-[12px] text-white/20">—</span>
            )}
          </td>
        )

      case "type":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", TYPE_STYLE[trip.tripType])}>
              {trip.tripType.startsWith("AIRPORT") && <Plane className="w-3 h-3 flex-shrink-0" />}
              {TYPE_LABELS[trip.tripType]}
            </span>
          </td>
        )

      case "pickup":
        return (
          <td key={key} className="px-3 py-3">
            <div className="flex items-start gap-1.5 max-w-[180px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-[3px] shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
              <span className="text-[12px] font-medium leading-snug line-clamp-2" style={{ color: "rgba(200,212,228,0.70)" }}>{trip.pickupAddress}</span>
            </div>
          </td>
        )

      case "dropoff":
        return (
          <td key={key} className="px-3 py-3">
            <div className="flex items-start gap-1.5 max-w-[180px]">
              <span className="w-2 h-2 rounded-[3px] bg-rose-500 flex-shrink-0 mt-[3px] shadow-[0_0_0_3px_rgba(244,63,94,0.15)]" />
              <span className="text-[12px] font-medium leading-snug line-clamp-2" style={{ color: "rgba(200,212,228,0.70)" }}>{trip.dropoffAddress}</span>
            </div>
          </td>
        )

      case "driver":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {trip.driver ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1a3a6b 0%, #2563eb 100%)", boxShadow: "0 1px 4px rgba(37,99,235,0.35)" }}
                >
                  {trip.driver.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={trip.driver.avatarUrl} alt={trip.driver.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] font-bold text-white tracking-wide">{getInitials(trip.driver.name)}</span>
                  )}
                </div>
                <span className="text-[12px] font-medium truncate max-w-[90px]" style={{ color: "rgba(255,255,255,0.85)" }}>{trip.driver.name}</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                Unassigned
              </span>
            )}
          </td>
        )

      case "vehicle-type":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {trip.vehicleType ? (
              <span className="text-[11px] font-medium bg-white/[0.07] px-2.5 py-1 rounded-full capitalize" style={{ color: "rgba(200,212,228,0.60)" }}>
                {trip.vehicleType.replace(/_/g, " ").toLowerCase()}
              </span>
            ) : (
              <span className="text-[12px] text-white/20">—</span>
            )}
          </td>
        )

      case "vehicle":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {trip.vehicle ? (
              <span className="text-[12px] font-medium truncate max-w-[110px] block" style={{ color: "rgba(200,212,228,0.75)" }}>{trip.vehicle.name}</span>
            ) : (
              <span className="text-[12px] text-white/20">—</span>
            )}
          </td>
        )

      case "affiliate": {
        const affiliateName = trip.farmedIn?.name || (isFarmedOut ? activeFarmOut?.toCompany?.name : null)
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {affiliateName ? (
              <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-full truncate max-w-[130px] block">
                {affiliateName}
              </span>
            ) : (
              <span className="text-[12px] text-white/20">—</span>
            )}
          </td>
        )
      }

      case "pax":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap text-center">
            <span className="text-[13px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.80)" }}>{trip.passengerCount}</span>
          </td>
        )

      case "price":
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {trip.farmedIn ? (
              trip.agreedPrice ? (
                <div>
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: "#c9a87c" }}>{formatCurrency(trip.agreedPrice)}</span>
                  <span className="block text-[10px] text-indigo-400 font-semibold mt-0.5">Agreed Rate</span>
                </div>
              ) : (
                <span className="text-[12px] text-white/20">—</span>
              )
            ) : (
              <span className="text-[13px] font-bold tabular-nums" style={{ color: "#c9a87c" }}>
                {trip.totalPrice ? formatCurrency(trip.totalPrice) : trip.price ? formatCurrency(trip.price) : <span className="text-[12px] text-white/20 font-normal">—</span>}
              </span>
            )}
          </td>
        )

      case "flags": {
        const hasFlags = trip.flightNumber || trip.vip || trip.meetAndGreet || trip.childSeat || trip.curbsidePickup
        return (
          <td key={key} className="px-3 py-3 whitespace-nowrap">
            {hasFlags ? (
              <div className="flex items-center gap-1.5">
                {trip.vip          && <Star   className="w-3.5 h-3.5 text-amber-400 fill-amber-400"  />}
                {trip.flightNumber && <Plane  className="w-3.5 h-3.5 text-sky-400"                   />}
                {trip.meetAndGreet && <Bell   className="w-3.5 h-3.5 text-violet-400"                />}
                {trip.childSeat    && <Baby   className="w-3.5 h-3.5 text-pink-400"                  />}
                {trip.curbsidePickup && <MapPin className="w-3.5 h-3.5 text-blue-400"               />}
              </div>
            ) : null}
          </td>
        )
      }

      default:
        return <td key={key} />
    }
  }

  if (!trips.length) return null

  return (
    <div
      className="rounded-2xl overflow-hidden flex-1"
      style={{
        background: "#0d1526",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div className="overflow-x-auto h-full">
        <table className="w-full text-sm border-collapse">

          {/* ── Table Header ── */}
          <thead className="sticky top-0 z-10">
            <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {orderedColumns.map(col => {
                const isDragging = col.key === dragKey
                const isOver = col.key === overKey && !isDragging
                return (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={e => handleDragStart(e, col.key)}
                    onDragOver={e => handleDragOver(e, col.key)}
                    onDrop={e => handleDrop(e, col.key)}
                    onDragEnd={reset}
                    className={cn(
                      "text-left text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap select-none transition-all duration-100",
                      col.width,
                      isDragging && "opacity-30",
                      isOver && dropSide === "left"  && "border-l-2 border-l-[#c9a87c] bg-[#c9a87c]/5",
                      isOver && dropSide === "right" && "border-r-2 border-r-[#c9a87c] bg-[#c9a87c]/5",
                    )}
                    style={{ color: "rgba(200,212,228,0.40)", cursor: isDragging ? "grabbing" : "grab" }}
                  >
                    <div className="flex items-center gap-1 group">
                      <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -ml-0.5" style={{ color: "rgba(255,255,255,0.20)" }} />
                      {col.label}
                    </div>
                  </th>
                )
              })}
              {showDate && (
                <th className="text-left text-[10px] font-bold uppercase tracking-[0.06em] px-3 py-2.5 whitespace-nowrap w-28" style={{ color: "rgba(200,212,228,0.40)" }}>
                  Date
                </th>
              )}
            </tr>
          </thead>

          {/* ── Rows ── */}
          <tbody>
            {trips.map((trip) => {
              const isSelected = trip.id === selectedTripId
              const isUnassigned = !trip.driverId && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(trip.status)

              return (
                <tr
                  key={trip.id}
                  onClick={() => handleRowClick(trip)}
                  onDoubleClick={e => handleRowDoubleClick(trip, e)}
                  className={cn(
                    "last:border-0 cursor-pointer transition-colors duration-100 select-none relative",
                    !isSelected && "hover:bg-white/[0.03]",
                  )}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: isSelected ? "rgba(201,168,124,0.08)" : undefined,
                  }}
                >
                  {/* Gold selection indicator */}
                  {isSelected && (
                    <td className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ padding: 0, border: "none", background: "#c9a87c" }} />
                  )}
                  {orderedColumns.map(col => renderCell(col.key, trip))}
                  {showDate && (
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-[11px] font-semibold" style={{ color: "rgba(200,212,228,0.50)" }}>
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
