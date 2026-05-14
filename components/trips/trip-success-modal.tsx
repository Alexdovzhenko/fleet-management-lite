"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import {
  ArrowRight, Calendar, Car, Check, CheckCircle2, Clock,
  Copy, FileText, Mail, MapPin, Navigation, Phone, Users, User, X,
} from "lucide-react"
import { FarmOutModal } from "@/components/dispatch/farm-out-modal"
import type { Trip } from "@/types"

function formatPickupDate(raw: string): string {
  if (!raw) return ""
  // ISO string (e.g. 2026-05-14T00:00:00.000Z) → May 14, 2026
  const iso = new Date(raw)
  if (!isNaN(iso.getTime())) {
    return iso.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  }
  // Already formatted (MM/DD/YYYY) — convert to readable
  const parts = raw.split("/")
  if (parts.length === 3) {
    const d = new Date(`${parts[2]}-${parts[0].padStart(2,"0")}-${parts[1].padStart(2,"0")}`)
    if (!isNaN(d.getTime()))
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
  }
  return raw
}

// ── Section label with gold accent bar ──────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.13em] flex items-center gap-1.5 mb-2.5"
       style={{ color: "#c9a87c" }}>
      <span className="w-0.5 h-3 rounded-full flex-shrink-0" style={{ background: "#c9a87c" }} />
      {children}
    </p>
  )
}

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
  const [confirmCopied, setConfirmCopied] = useState(false)
  const [farmOutOpen, setFarmOutOpen] = useState(false)

  if (!open) return null

  const emailRecipients = [
    {
      key: "driver" as const,
      label: "Driver",
      doc: "Job Order PDF",
      icon: Car,
      iconBg: "rgba(255,255,255,0.07)",
      iconColor: "rgba(200,212,228,0.70)",
      hasEmail: !!trip.driver?.email,
      email: trip.driver?.email,
    },
    {
      key: "client" as const,
      label: "Client",
      doc: "Reservation PDF",
      icon: User,
      iconBg: "rgba(99,102,241,0.14)",
      iconColor: "rgba(167,139,250,0.85)",
      hasEmail: !!(trip.passengerEmail || trip.customer?.email),
      email: trip.passengerEmail || trip.customer?.email,
    },
    {
      key: "affiliate" as const,
      label: "Affiliate",
      doc: "Reservation PDF",
      icon: FileText,
      iconBg: "rgba(201,168,124,0.12)",
      iconColor: "#c9a87c",
      hasEmail: !!(trip.farmOuts?.[0] && (trip.farmOuts[0] as { toCompany?: { email?: string } }).toCompany?.email),
      email: (trip.farmOuts?.[0] as { toCompany?: { email?: string } })?.toCompany?.email,
    },
  ]

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: "#080c16",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 32px 96px rgba(0,0,0,0.80), 0 0 0 1px rgba(201,168,124,0.07)",
          maxHeight: "90vh",
        }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="relative flex items-center gap-3.5 px-6 py-4 pr-14 flex-shrink-0"
          style={{ background: "#0d1526", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Success icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.28)" }}
          >
            <CheckCircle2 className="w-5 h-5" style={{ color: "rgba(52,211,153,0.90)" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
              Reservation Created
            </h2>
            <p className="text-[11px] font-mono" style={{ color: "#c9a87c" }}>{confirmationNumber}</p>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-4 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.70)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)"
              ;(e.currentTarget as HTMLElement).style.color = "#ffffff"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"
            }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1" style={{ minHeight: 0 }}>

          {/* Left — Trip Details */}
          <div
            className="px-6 py-5 space-y-5"
            style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* Confirmation # */}
            <div>
              <SectionLabel>Confirmation #</SectionLabel>
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(201,168,124,0.07)", border: "1px solid rgba(201,168,124,0.20)" }}
              >
                <span className="text-lg font-mono font-bold" style={{ color: "#c9a87c" }}>
                  {confirmationNumber}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(confirmationNumber)
                    setConfirmCopied(true)
                    setTimeout(() => setConfirmCopied(false), 2000)
                  }}
                  className="transition-colors ml-2 flex-shrink-0"
                  style={{ color: confirmCopied ? "rgba(52,211,153,0.90)" : "rgba(201,168,124,0.55)" }}
                  onMouseEnter={e => { if (!confirmCopied) (e.currentTarget.style.color = "#c9a87c") }}
                  onMouseLeave={e => { if (!confirmCopied) (e.currentTarget.style.color = "rgba(201,168,124,0.55)") }}
                  aria-label="Copy confirmation number"
                >
                  {confirmCopied
                    ? <Check className="w-4 h-4" />
                    : <Copy className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>

            {/* Trip Details */}
            <div>
              <SectionLabel>Trip Details</SectionLabel>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#c9a87c" }} />
                    <span style={{ color: "rgba(255,255,255,0.82)" }}>{formatPickupDate(trip.pickupDate)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#c9a87c" }} />
                    <span style={{ color: "rgba(255,255,255,0.82)" }}>{trip.pickupTime}</span>
                  </div>
                </div>
                {trip.tripType && (
                  <span
                    className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(200,212,228,0.70)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    {trip.tripType}
                  </span>
                )}
              </div>
            </div>

            {/* Route */}
            <div>
              <SectionLabel>Route</SectionLabel>
              <div className="space-y-2">
                {trip.pickupAddress && (
                  <div className="flex gap-2 items-start text-sm">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "rgba(52,211,153,0.80)" }} />
                    <span className="line-clamp-1" style={{ color: "rgba(255,255,255,0.82)" }} title={trip.pickupAddress}>
                      {trip.pickupAddress}
                    </span>
                  </div>
                )}
                {trip.dropoffAddress && (
                  <div className="flex gap-2 items-start text-sm">
                    <Navigation className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "rgba(248,113,113,0.70)" }} />
                    <span className="line-clamp-1" style={{ color: "rgba(255,255,255,0.82)" }} title={trip.dropoffAddress}>
                      {trip.dropoffAddress}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Passenger */}
            {trip.passengerName && (
              <div>
                <SectionLabel>Passenger</SectionLabel>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.90)" }}>
                    {trip.passengerName}
                  </p>
                  <div className="space-y-1">
                    {trip.passengerPhone && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(200,212,228,0.55)" }}>
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{trip.passengerPhone}</span>
                      </div>
                    )}
                    {trip.passengerEmail && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(200,212,228,0.55)" }}>
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span>{trip.passengerEmail}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(200,212,228,0.55)" }}>
                      <Users className="w-3 h-3 flex-shrink-0" />
                      <span>{trip.passengerCount} {trip.passengerCount === 1 ? "passenger" : "passengers"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assignment */}
            {(trip.driver || trip.vehicle) && (
              <div>
                <SectionLabel>Assignment</SectionLabel>
                <div className="space-y-1">
                  {trip.driver && (
                    <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{trip.driver.name}</p>
                  )}
                  {trip.vehicle && (
                    <p className="text-xs" style={{ color: "rgba(200,212,228,0.55)" }}>{trip.vehicle.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Pricing */}
            {trip.price && (() => {
              const base = parseFloat(trip.price as string)
              const gratuity = trip.gratuity ? parseFloat(trip.gratuity as string) : 0
              const total = trip.totalPrice ? parseFloat(trip.totalPrice as string) : base + gratuity
              return (
                <div>
                  <SectionLabel>Pricing</SectionLabel>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "rgba(200,212,228,0.55)" }}>Base Price</span>
                      <span style={{ color: "rgba(255,255,255,0.80)" }}>${base.toFixed(2)}</span>
                    </div>
                    {gratuity > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: "rgba(200,212,228,0.55)" }}>Gratuity</span>
                        <span style={{ color: "rgba(255,255,255,0.80)" }}>+${gratuity.toFixed(2)}</span>
                      </div>
                    )}
                    <div
                      className="flex justify-between pt-2"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <span className="font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Total</span>
                      <span className="font-bold" style={{ color: "#c9a87c" }}>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Right — Actions */}
          <div className="px-6 py-5 space-y-5">
            {/* Farm Out */}
            <div>
              <SectionLabel>Farm Out</SectionLabel>
              <button
                type="button"
                onClick={() => setFarmOutOpen(true)}
                className="w-full rounded-xl p-3.5 text-left transition-all group"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.35)"
                  ;(e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.06)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)"
                  ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Farm Out to Affiliate
                  </span>
                  <ArrowRight className="w-4 h-4 transition-colors" style={{ color: "rgba(200,212,228,0.35)" }} />
                </div>
              </button>
            </div>

            {/* Send Confirmation */}
            <div className="space-y-2.5">
              <SectionLabel>Send Confirmation</SectionLabel>

              {emailRecipients.map(({ key, label, doc, icon: Icon, iconBg, iconColor, hasEmail, email }) => (
                <button
                  key={key}
                  type="button"
                  disabled={!hasEmail}
                  onClick={() => hasEmail && onSendEmail(key)}
                  className="w-full rounded-xl p-3.5 text-left transition-all"
                  style={{
                    background: hasEmail ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${hasEmail ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)"}`,
                    cursor: hasEmail ? "pointer" : "not-allowed",
                    opacity: hasEmail ? 1 : 0.55,
                  }}
                  onMouseEnter={e => {
                    if (hasEmail) {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.30)"
                      ;(e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.05)"
                    }
                  }}
                  onMouseLeave={e => {
                    if (hasEmail) {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)"
                      ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: iconBg, border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{label}</p>
                      <p className="text-[11px] mb-1.5" style={{ color: "rgba(200,212,228,0.50)" }}>{doc}</p>
                      {hasEmail ? (
                        <p className="text-xs truncate" style={{ color: "rgba(200,212,228,0.65)" }}>{email}</p>
                      ) : (
                        <p className="text-xs italic" style={{ color: "rgba(200,212,228,0.35)" }}>No email on file</p>
                      )}
                    </div>
                    {hasEmail && (
                      <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 flex-shrink-0" style={{ color: "rgba(200,212,228,0.30)" }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div
          className="flex gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)", background: "#0d1526" }}
        >
          <button
            type="button"
            onClick={onNewReservation}
            className="flex-1 h-10 text-sm font-semibold rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"
            }}
          >
            New Reservation
          </button>
          <button
            type="button"
            onClick={onGoToDispatch}
            className="flex-1 h-10 text-sm font-bold rounded-xl transition-all"
            style={{ background: "#c9a87c", color: "#0d1526" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#d4b88e"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#c9a87c"}
          >
            Go to Dispatch
          </button>
        </div>
      </div>

      {/* Farm Out Modal */}
      {farmOutOpen && (
        <FarmOutModal trip={trip} open={farmOutOpen} onClose={() => setFarmOutOpen(false)} />
      )}
    </div>,
    document.body
  )
}
