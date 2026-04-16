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

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <div className="text-left min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Billing</p>
          {hasData ? (
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(displayTotal)}
              {totals.balance > 0 && <span className="ml-2 text-xs text-rose-600">({totals.balance > 0 ? 'Balance due' : 'Paid'})</span>}
            </p>
          ) : (
            <p className="text-sm text-gray-400">Set up pricing →</p>
          )}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
    </button>
  )
}
