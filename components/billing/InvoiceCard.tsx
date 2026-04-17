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
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={onViewDetails}
    >
      {/* Main Content */}
      <div className="p-5 space-y-4">
        {/* Top Row: Customer + Invoice Number */}
        <div className="flex items-baseline justify-between gap-3 min-h-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-900 truncate">
              {customerName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Invoice {invoiceNumber}</p>
          </div>
          {/* Amount - Right aligned, prominent */}
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-2xl font-bold text-slate-900">
              ${parseFloat(invoice.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Middle Row: Date + Reservation */}
        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-500 uppercase tracking-tight">Date</p>
              <p className="text-sm font-medium text-slate-700">{serviceDate}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="flex flex-col gap-1">
              <p className="text-xs text-slate-500 uppercase tracking-tight">Reservation</p>
              <p className="text-sm font-medium text-slate-700">#{reservationNumber}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                isOpen
                  ? "bg-amber-100/80 text-amber-700"
                  : "bg-green-100/80 text-green-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isOpen ? "bg-amber-500" : "bg-green-500"}`} />
              {isOpen ? "Open" : "Settled"}
            </span>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>

        {/* Bottom Row: Dispatcher */}
        {dispatcherName !== "—" && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Created by <span className="font-medium text-slate-700">{dispatcherName}</span>
            </p>
          </div>
        )}
      </div>

      {/* Mark as Settled Action (only on Open tab) */}
      {isOpen && !isSettledTab && onMarkSettled && (
        <div className="px-5 py-3 bg-blue-50/50 border-t border-slate-200 group-hover:bg-blue-50 transition-colors">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkSettled()
            }}
            className="w-full py-2 px-3 text-sm font-semibold text-blue-600 hover:text-blue-700 active:scale-95 transition-all duration-150"
          >
            Mark as Settled
          </button>
        </div>
      )}
    </div>
  )
}
