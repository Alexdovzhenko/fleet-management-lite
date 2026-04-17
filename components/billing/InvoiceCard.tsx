"use client"

import { format } from "date-fns"
import type { Invoice } from "@/types"
import { ChevronRight } from "lucide-react"

interface InvoiceCardProps {
  invoice: any
  onMarkSettled?: () => void
  onViewDetails?: () => void
  isSettledTab?: boolean
}

export function InvoiceCard({
  invoice,
  onMarkSettled,
  onViewDetails,
  isSettledTab,
}: InvoiceCardProps) {
  const customerName = invoice.customer?.name || "Unknown"
  const reservationNumber = invoice.trip?.tripNumber || "N/A"
  const serviceDate = invoice.trip?.pickupDate
    ? format(new Date(invoice.trip.pickupDate), "MMM d, yyyy")
    : "N/A"
  const dispatcherName = invoice.trip?.createdBy?.name || "—"
  const invoiceNumber = invoice.invoiceNumber || "—"

  const isOpen = invoice.status === "OPEN"

  return (
    <div
      className="group bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer rounded-xl"
      onClick={onViewDetails}
    >
      {/* Single Row Layout - Compact */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Customer Info */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {customerName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>INV {invoiceNumber}</span>
            <span>•</span>
            <span>{serviceDate}</span>
            <span>•</span>
            <span>#{reservationNumber}</span>
          </div>
        </div>

        {/* Right: Amount + Status + Action */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Amount */}
          <div className="text-right min-w-[80px]">
            <p className="text-lg font-bold text-slate-900">
              ${parseFloat(invoice.total).toFixed(2)}
            </p>
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors ${
              isOpen
                ? "bg-amber-100/80 text-amber-700"
                : "bg-green-100/80 text-green-700"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isOpen ? "bg-amber-500" : "bg-green-500"}`} />
            {isOpen ? "Open" : "Settled"}
          </span>

          {/* Chevron */}
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
        </div>

        {/* Mark as Settled - Quick Action Button (only on Open tab) */}
        {isOpen && !isSettledTab && onMarkSettled && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkSettled()
            }}
            className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg active:scale-95 transition-all duration-150 shrink-0"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  )
}
