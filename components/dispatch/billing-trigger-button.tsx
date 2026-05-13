"use client"

import { DollarSign, ChevronRight } from "lucide-react"
import { formatCurrency, computeBillingTotals } from "@/lib/utils"
import type { BillingData, TripPayment } from "@/types"

interface BillingTriggerButtonProps {
  billingData?: BillingData | any | null
  payments?: TripPayment[]
  invoiceTotal?: number | null
  onClick: () => void
}

export function BillingTriggerButton({ billingData, payments = [], invoiceTotal, onClick }: BillingTriggerButtonProps) {
  const totals = computeBillingTotals(billingData || { lineItems: [], adjustments: {} }, payments)
  // Use invoiceTotal if available (from Invoice record), otherwise use computed totals from billingData
  const displayTotal = invoiceTotal !== null && invoiceTotal !== undefined ? invoiceTotal : totals.total
  const hasData = (invoiceTotal !== null && invoiceTotal !== undefined) || (billingData && ((billingData as any).lineItems?.length > 0 || Object.keys(billingData).length > 0))

  // Debug logging
  console.log('[BillingButton] invoiceTotal:', invoiceTotal)
  console.log('[BillingButton] displayTotal:', displayTotal)
  console.log('[BillingButton] hasData:', hasData)
  console.log('[BillingButton] billingData:', billingData)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl overflow-hidden transition-all group"
      style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.30)" }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)" }}
    >
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Gold accent bar + icon */}
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#c9a87c" }} />
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.20)" }}>
              <DollarSign className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
            </div>
          </div>
          <div className="text-left min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "rgba(200,212,228,0.55)" }}>Billing</p>
            {hasData ? (
              <p className="text-sm font-bold tabular-nums" style={{ color: "rgba(255,255,255,0.90)" }}>
                {formatCurrency(displayTotal)}
                {totals.balance > 0 && (
                  <span className="ml-2 text-xs font-medium" style={{ color: "rgba(248,113,113,0.80)" }}>Balance due</span>
                )}
              </p>
            ) : (
              <p className="text-sm" style={{ color: "rgba(200,212,228,0.45)" }}>Set up pricing →</p>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: "rgba(200,212,228,0.30)" }} />
      </div>
    </button>
  )
}
