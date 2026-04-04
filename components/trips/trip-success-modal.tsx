"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, ArrowUpRight, Calendar, Car, Check, CheckCircle2, Clock, Copy, FileText, Navigation, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Trip } from "@/types"

export function TripSuccessModal({
  trip,
  confirmationNumber,
  open,
  onClose,
  onNewReservation,
  onGoToDispatch,
  onSendEmail,
}: {
  trip: Trip
  confirmationNumber: string
  open: boolean
  onClose: () => void
  onNewReservation: () => void
  onGoToDispatch: () => void
  onSendEmail: (recipient: "driver" | "client" | "affiliate") => void
}) {
  const router = useRouter()
  const [confirmCopied, setConfirmCopied] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Reservation Created</h2>
              <p className="text-[11px] text-gray-400 font-mono">{confirmationNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-gray-100">

          {/* Left: Trip Details */}
          <div className="px-6 py-5 space-y-5">
            {/* Confirmation Number */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Confirmation #</p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between group">
                <p className="text-lg font-mono font-bold text-blue-700">{confirmationNumber}</p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(confirmationNumber)
                    setConfirmCopied(true)
                    setTimeout(() => setConfirmCopied(false), 2000)
                  }}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                  aria-label="Copy confirmation number to clipboard"
                >
                  {confirmCopied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Trip Info */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Trip Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="font-medium">{trip.pickupDate}</span>
                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
                  <span className="font-medium">{trip.pickupTime}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Badge variant="secondary">{trip.tripType}</Badge>
                </div>
              </div>
            </div>

            {/* Route */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Route</p>
              <div className="space-y-2">
                <div className="flex gap-2 text-sm">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 line-clamp-1" title={trip.pickupAddress}>
                    {trip.pickupAddress}
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <Navigation className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5 -rotate-180" />
                  <span className="text-gray-700 line-clamp-1" title={trip.dropoffAddress}>
                    {trip.dropoffAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Passenger */}
            {trip.passengerName && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Passenger</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold">{trip.passengerName}</p>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    {trip.passengerPhone && <p>📞 {trip.passengerPhone}</p>}
                    {trip.passengerEmail && <p>📧 {trip.passengerEmail}</p>}
                    <p>👥 {trip.passengerCount} {trip.passengerCount === 1 ? "passenger" : "passengers"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment */}
            {(trip.driver || trip.vehicle) && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Assignment</p>
                <div className="text-sm text-gray-700 space-y-1">
                  {trip.driver && <p className="font-semibold">🚗 {trip.driver.name}</p>}
                  {trip.vehicle && <p className="text-xs text-gray-600">{trip.vehicle.name}</p>}
                </div>
              </div>
            )}

            {/* Pricing */}
            {trip.price && (() => {
              const basePrice = parseFloat(trip.price as string)
              const gratuity = trip.gratuity ? parseFloat(trip.gratuity as string) : 0
              const total = trip.totalPrice ? parseFloat(trip.totalPrice as string) : basePrice + gratuity
              return (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Pricing</p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>Base Price</span>
                      <span className="font-medium">${basePrice.toFixed(2)}</span>
                    </div>
                    {gratuity > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Gratuity</span>
                        <span className="font-medium">+${gratuity.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-gray-200 text-gray-900">
                      <span className="font-semibold">Total</span>
                      <span className="font-bold">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

          </div>

          {/* Right: Send Confirmation Actions */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em]">Send Confirmation</p>

            {[
              {
                key: "driver" as const,
                label: "Driver",
                doc: "Job Order",
                icon: Car,
                color: "bg-slate-100",
                textColor: "text-slate-600",
                hasEmail: !!trip.driver?.email,
                email: trip.driver?.email,
              },
              {
                key: "client" as const,
                label: "Client",
                doc: "Reservation",
                icon: User,
                color: "bg-blue-50",
                textColor: "text-blue-600",
                hasEmail: !!(trip.passengerEmail || trip.customer?.email),
                email: trip.passengerEmail || trip.customer?.email,
              },
              {
                key: "affiliate" as const,
                label: "Affiliate",
                doc: "Reservation",
                icon: FileText,
                color: "bg-indigo-50",
                textColor: "text-indigo-600",
                hasEmail: !!(trip.farmOuts?.[0] && (trip.farmOuts[0] as { toCompany?: { email?: string } }).toCompany?.email),
                email: (trip.farmOuts?.[0] as { toCompany?: { email?: string } })?.toCompany?.email,
              },
            ].map(({ key, label, doc, icon: Icon, color, textColor, hasEmail, email }) => (
              <button
                key={key}
                type="button"
                disabled={!hasEmail}
                onClick={() => {
                  if (hasEmail) {
                    onSendEmail(key)
                  }
                }}
                className={cn(
                  "w-full rounded-xl border transition-all p-3 text-left",
                  hasEmail
                    ? "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-pointer"
                    : "border-gray-100 bg-gray-50 cursor-not-allowed opacity-60"
                )}
                aria-disabled={!hasEmail}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", color)}>
                    <Icon className={cn("w-4 h-4", textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                    <p className="text-[11px] text-gray-500 mb-2">{doc} PDF</p>
                    {hasEmail ? (
                      <p className="text-xs text-gray-600 truncate">{email}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No email on file</p>
                    )}
                  </div>
                  {hasEmail && <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />}
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-10"
            onClick={onNewReservation}
          >
            New Reservation
          </Button>
          <Button
            type="button"
            className="flex-1 h-10 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold"
            onClick={onGoToDispatch}
          >
            Go to Dispatch
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
