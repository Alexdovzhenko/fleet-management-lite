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
  const displayTotal = invoiceTotal !== null && invoiceTotal !== undefined ? invoiceTotal : totals.total
  const hasData = (invoiceTotal !== null && invoiceTotal !== undefined) || (billingData && ((billingData as any).lineItems?.length > 0 || Object.keys(billingData).length > 0))

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--lc-text-label)" }}>Billing</p>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all"
        style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,124,0.40)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--lc-border)" }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(201,168,124,0.12)" }}>
          <DollarSign className="w-4 h-4" style={{ color: "#c9a87c" }} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>
            {hasData ? formatCurrency(displayTotal) : "Set up pricing"}
          </div>
          <div className="text-[11px]" style={{ color: totals.balance > 0 ? "rgba(248,113,113,0.80)" : "var(--lc-text-dim)" }}>
            {hasData
              ? totals.balance > 0 ? "Balance due" : "Billing configured"
              : "Tap to configure billing"}
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--lc-text-muted)" }} />
      </button>
    </div>
  )
}
