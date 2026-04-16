"use client"

import { Loader2 } from "lucide-react"
import type { Invoice } from "@/types"
import { InvoiceCard } from "./InvoiceCard"

interface InvoiceListProps {
  invoices: Invoice[] | undefined
  isLoading: boolean
  isError: boolean
  onMarkSettled: (invoiceId: string) => void
  onClearFilters: () => void
  isSettledTab?: boolean
}

export function InvoiceList({
  invoices,
  isLoading,
  isError,
  onMarkSettled,
  onClearFilters,
  isSettledTab,
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">Failed to load invoices</p>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-500 text-sm mb-3">No invoices found</p>
        <button
          onClick={onClearFilters}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <InvoiceCard
          key={invoice.id}
          invoice={invoice}
          isSettledTab={isSettledTab}
          onMarkSettled={() => onMarkSettled(invoice.id)}
        />
      ))}
    </div>
  )
}
