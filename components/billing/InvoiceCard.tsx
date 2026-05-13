"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"

interface InvoiceCardProps {
  invoice: any
  onMarkSettled?: () => void
  onViewDetails?: () => void
  isSettledTab?: boolean
}

export function InvoiceCard({ invoice, onMarkSettled, onViewDetails, isSettledTab }: InvoiceCardProps) {
  const [hovered, setHovered] = useState(false)

  const customerName    = invoice.customer?.name || "Unknown"
  const reservationNum  = invoice.trip?.tripNumber || "N/A"
  const serviceDate     = invoice.trip?.pickupDate ? format(new Date(invoice.trip.pickupDate), "MMM d, yyyy") : "N/A"
  const invoiceNumber   = invoice.invoiceNumber || "—"
  const isOpen          = invoice.status === "OPEN"
  const amount          = parseFloat(String(invoice.total || 0)).toFixed(2)

  return (
    <div
      onClick={onViewDetails}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: hovered ? "#111e35" : "#0d1526",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.11)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      {/* Left: customer + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>
            {customerName}
          </span>
          <span className="text-[11px] font-mono shrink-0" style={{ color: "rgba(200,212,228,0.38)" }}>
            #{invoiceNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "rgba(200,212,228,0.50)" }}>
          <span>{serviceDate}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Res #{reservationNum}</span>
        </div>
      </div>

      {/* Right: amount + badge + settle + chevron */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-[15px] font-bold tabular-nums"
          style={{ color: isOpen ? "rgba(255,255,255,0.90)" : "rgba(255,255,255,0.55)" }}
        >
          ${amount}
        </span>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
          style={isOpen
            ? { background: "rgba(251,191,36,0.12)", color: "rgba(251,191,36,0.90)" }
            : { background: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.85)"  }
          }
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: isOpen ? "#fbbf24" : "#34d399" }}
          />
          {isOpen ? "Open" : "Settled"}
        </span>

        {isOpen && !isSettledTab && onMarkSettled && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkSettled() }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 active:scale-95 cursor-pointer shrink-0"
            style={{ color: "#c9a87c", background: "rgba(201,168,124,0.08)", border: "1px solid rgba(201,168,124,0.18)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.15)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.30)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.08)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.18)"
            }}
          >
            Settle
          </button>
        )}

        <ChevronRight
          className="w-4 h-4 shrink-0 transition-colors duration-150"
          style={{ color: hovered ? "rgba(200,212,228,0.60)" : "rgba(200,212,228,0.28)" }}
        />
      </div>
    </div>
  )
}
