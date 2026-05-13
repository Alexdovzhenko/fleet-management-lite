"use client"

import { FileText, AlertCircle } from "lucide-react"
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
  invoices, isLoading, isError, onMarkSettled, onViewDetails, onClearFilters, isSettledTab,
}: InvoiceListProps) {

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[62px] rounded-xl"
            style={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.07)",
              opacity: 1 - i * 0.15,
            }}
          >
            <div className="flex items-center gap-4 px-4 py-3.5 h-full">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-2.5 w-56 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
                <div className="h-5 w-14 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: "#0d1526", border: "1px solid rgba(248,113,113,0.20)" }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
          style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.20)" }}
        >
          <AlertCircle className="w-6 h-6" style={{ color: "#f87171" }} />
        </div>
        <h3 className="text-[14px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.88)" }}>
          Failed to load invoices
        </h3>
        <p className="text-[13px]" style={{ color: "rgba(200,212,228,0.55)" }}>
          There was an issue loading your invoices. Please try again.
        </p>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 flex flex-col items-center text-center"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
        >
          <FileText className="w-7 h-7" style={{ color: "#c9a87c" }} strokeWidth={1.5} />
        </div>
        <h3 className="text-[14px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.88)" }}>
          {isSettledTab ? "No settled invoices" : "No open invoices"}
        </h3>
        <p className="text-[13px] mb-5 max-w-xs" style={{ color: "rgba(200,212,228,0.50)" }}>
          {isSettledTab
            ? "Invoices you mark as settled will appear here."
            : "All invoices are settled — great work!"}
        </p>
        <button
          onClick={onClearFilters}
          className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer"
          style={{ color: "#c9a87c", background: "rgba(201,168,124,0.08)", border: "1px solid rgba(201,168,124,0.18)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.14)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(201,168,124,0.08)"}
        >
          Clear filters
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Count label */}
      <p
        className="text-[11px] font-semibold uppercase tracking-widest px-1"
        style={{ color: "rgba(200,212,228,0.35)", letterSpacing: "0.14em" }}
      >
        {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      {invoices.map((invoice, index) => (
        <div
          key={invoice.id}
          style={{ animation: `billingSlideIn 0.25s ease-out ${index * 25}ms both` }}
        >
          <InvoiceCard
            invoice={invoice}
            isSettledTab={isSettledTab}
            onMarkSettled={() => onMarkSettled(invoice.id)}
            onViewDetails={() => onViewDetails(invoice)}
          />
        </div>
      ))}

      <style>{`
        @keyframes billingSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  )
}
