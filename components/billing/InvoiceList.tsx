"use client"

import { Loader2, FileText, AlertCircle } from "lucide-react"
import type { Invoice } from "@/types"
import { InvoiceCard } from "./InvoiceCard"

interface InvoiceListProps {
  invoices: Invoice[] | undefined
  isLoading: boolean
  isError: boolean
  onMarkSettled: (invoiceId: string) => void
  onViewDetails: (invoice: Invoice) => void
  onClearFilters: () => void
  isSettledTab?: boolean
}

export function InvoiceList({
  invoices,
  isLoading,
  isError,
  onMarkSettled,
  onViewDetails,
  onClearFilters,
  isSettledTab,
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading invoices...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-semibold text-red-900 mb-1">Failed to load invoices</h3>
        <p className="text-sm text-red-700">
          There was an issue loading your invoices. Please try again.
        </p>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-100 rounded-full mb-4">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          {isSettledTab ? "No settled invoices" : "No open invoices"}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {isSettledTab
            ? "Invoices you mark as settled will appear here"
            : "All your invoices are settled. Great work!"}
        </p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-lg transition-colors"
        >
          Clear filters to see all invoices
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with count */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-tight">
          {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {/* Invoice Cards - with animation */}
      <div className="space-y-2">
        {invoices.map((invoice, index) => (
          <div
            key={invoice.id}
            style={{
              animation: `slideIn 0.3s ease-out ${index * 30}ms both`,
            }}
          >
            <InvoiceCard
              invoice={invoice}
              isSettledTab={isSettledTab}
              onMarkSettled={() => onMarkSettled(invoice.id)}
              onViewDetails={() => onViewDetails(invoice)}
            />
          </div>
        ))}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
