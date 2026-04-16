"use client"

import { format } from "date-fns"
import type { Invoice } from "@/types"

interface InvoiceCardProps {
  invoice: any
  onMarkSettled?: () => void
  isSettledTab?: boolean
}

export function InvoiceCard({
  invoice,
  onMarkSettled,
  isSettledTab,
}: InvoiceCardProps) {
  const customerName = invoice.customer?.name || "Unknown"
  const reservationNumber = invoice.trip?.tripNumber || "N/A"
  const serviceDate = invoice.trip?.pickupDate
    ? format(new Date(invoice.trip.pickupDate), "MMM d, yyyy")
    : "N/A"
  const dispatcherName = invoice.trip?.createdBy?.name || "—"

  const isOpen = invoice.status === "OPEN"

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Client name and reservation */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{customerName}</h3>
            <span className="text-xs text-slate-500 shrink-0">#{reservationNumber}</span>
          </div>

          {/* Service date */}
          <p className="text-sm text-slate-500 mb-2">{serviceDate}</p>

          {/* Dispatcher name */}
          <p className="text-xs text-slate-400">{dispatcherName}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Invoice total */}
          <p className="text-xl font-semibold text-slate-900">
            ${parseFloat(invoice.total).toFixed(2)}
          </p>

          {/* Status badge */}
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isOpen
                ? "bg-amber-50 text-amber-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {isOpen ? "Open" : "Settled"}
          </span>
        </div>
      </div>

      {/* Mark as Settled button (only on Open tab) */}
      {isOpen && !isSettledTab && onMarkSettled && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={onMarkSettled}
            className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Mark as Settled
          </button>
        </div>
      )}
    </div>
  )
}
