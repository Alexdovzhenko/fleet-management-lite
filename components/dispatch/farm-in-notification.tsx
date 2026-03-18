"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Building2,
  MapPin,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Bell,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIncomingFarmOuts, useRespondToFarmOut } from "@/lib/hooks/use-farm-outs"
import { formatDate, formatTime } from "@/lib/utils"
import type { FarmOut } from "@/types"

function FarmInCard({ farmOut, onRespond }: { farmOut: FarmOut; onRespond: (id: string, action: "ACCEPT" | "DECLINE") => void }) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing] = useState<"ACCEPT" | "DECLINE" | null>(null)
  const respond = useRespondToFarmOut()

  const trip = farmOut.trip
  const from = farmOut.fromCompany

  async function handle(action: "ACCEPT" | "DECLINE") {
    setActing(action)
    try {
      await respond.mutateAsync({ farmOutId: farmOut.id, action })
      onRespond(farmOut.id, action)
    } catch {
      setActing(null)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden w-[360px]">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex items-center gap-2">
        <Bell className="w-3.5 h-3.5 text-white/80" />
        <span className="text-xs font-semibold text-white tracking-wide uppercase">Incoming Farm-In Request</span>
      </div>

      {/* From company */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        {from?.logo ? (
          <img src={from.logo} alt={from.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4.5 h-4.5 text-blue-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{from?.name}</p>
          {(from?.city || from?.state) && (
            <p className="text-xs text-gray-500">
              {[from?.city, from?.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Trip summary */}
      {trip && (
        <div className="px-4 pb-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-700 font-medium">
              {formatDate(trip.pickupDate)} at {formatTime(trip.pickupTime)}
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-600 leading-tight">{trip.pickupAddress}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-600 leading-tight">{trip.dropoffAddress}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-600">{trip.passengerCount} passenger{trip.passengerCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
      )}

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-center gap-1 px-4 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Less details" : "More details"}
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && trip && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2 border-t border-gray-100 pt-2">
              {farmOut.agreedPrice && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Agreed Price</span>
                  <span className="font-semibold text-gray-900">${farmOut.agreedPrice}</span>
                </div>
              )}
              {trip.flightNumber && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Flight</span>
                  <span className="font-medium text-gray-900">{trip.flightNumber}</span>
                </div>
              )}
              {trip.passengerName && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Passenger</span>
                  <span className="font-medium text-gray-900">{trip.passengerName}</span>
                </div>
              )}
              {trip.notes && (
                <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 italic">
                  &quot;{trip.notes}&quot;
                </div>
              )}
              {farmOut.message && (
                <div className="text-xs text-blue-700 bg-blue-50 rounded-lg p-2 italic">
                  &quot;{farmOut.message}&quot;
                </div>
              )}
              <div className="flex flex-wrap gap-1 pt-1">
                {trip.vip && <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">VIP</span>}
                {trip.meetAndGreet && <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Meet & Greet</span>}
                {trip.childSeat && <span className="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">Child Seat</span>}
                {trip.wheelchairAccess && <span className="text-[10px] font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Wheelchair</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          onClick={() => handle("DECLINE")}
          disabled={respond.isPending}
        >
          {acting === "DECLINE" && respond.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline</>
          )}
        </Button>
        <Button
          size="sm"
          className="flex-1 text-white"
          style={{ backgroundColor: "#2563EB" }}
          onClick={() => handle("ACCEPT")}
          disabled={respond.isPending}
        >
          {acting === "ACCEPT" && respond.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Accept</>
          )}
        </Button>
      </div>
    </div>
  )
}

export function FarmInNotification() {
  const { data: incoming } = useIncomingFarmOuts()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  function handleRespond(id: string) {
    setDismissed((prev) => new Set([...prev, id]))
  }

  const visible = (incoming ?? []).filter((f) => !dismissed.has(f.id))

  if (visible.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {visible.map((farmOut) => (
          <motion.div
            key={farmOut.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <FarmInCard farmOut={farmOut} onRespond={handleRespond} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
