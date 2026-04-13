"use client"

import { BillingInputRow } from "./BillingInputRow"
import { type BillingData } from "@/lib/billing-calculations"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface Block2Props {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
  subtotal: number
  onCollapse?: (collapsed: boolean) => void
}

export function Block2AdditionalCharges({
  data,
  onChange,
  subtotal,
  onCollapse,
}: Block2Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedFees, setExpandedFees] = useState<Set<1 | 2 | 3>>(new Set())

  const handleCollapse = (value: boolean) => {
    setCollapsed(value)
    onCollapse?.(value)
  }

  const toggleFee = (feeNum: 1 | 2 | 3) => {
    const newSet = new Set(expandedFees)
    if (newSet.has(feeNum)) {
      newSet.delete(feeNum)
    } else {
      newSet.add(feeNum)
    }
    setExpandedFees(newSet)
  }

  return (
    <div className="space-y-4">
      {/* Block Header */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-amber-50 border-l-4 border-amber-500 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Additional Charges
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-amber-600">
            ${subtotal.toFixed(2)}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${
              collapsed ? "-rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {/* Block Content */}
      {!collapsed && (
        <div className="px-5 py-4 rounded-xl bg-slate-50/60 border border-slate-100 space-y-4">
          {/* Misc Fee 1 */}
          <div className="space-y-2">
            <button
              onClick={() => toggleFee(1)}
              className="w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 px-2 py-1"
            >
              <span
                className={`transition-transform ${expandedFees.has(1) ? "" : "-rotate-90"}`}
              >
                ▼
              </span>
              Misc Fee 1
            </button>
            {expandedFees.has(1) && (
              <div className="space-y-2 pl-4">
                <BillingInputRow
                  label="Label"
                  value={data.miscFee1Label || "Misc Fee 1"}
                  onChange={(v) => onChange("miscFee1Label", v)}
                  type="text"
                />
                <BillingInputRow
                  label="Amount"
                  value={data.miscFee1Amount || ""}
                  onChange={(v) => onChange("miscFee1Amount", v)}
                  type="currency"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          {(expandedFees.has(1) || expandedFees.has(2) || expandedFees.has(3)) && (
            <div className="border-t border-slate-200"></div>
          )}

          {/* Misc Fee 2 */}
          <div className="space-y-2">
            <button
              onClick={() => toggleFee(2)}
              className="w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 px-2 py-1"
            >
              <span
                className={`transition-transform ${expandedFees.has(2) ? "" : "-rotate-90"}`}
              >
                ▼
              </span>
              Misc Fee 2
            </button>
            {expandedFees.has(2) && (
              <div className="space-y-2 pl-4">
                <BillingInputRow
                  label="Label"
                  value={data.miscFee2Label || "Misc Fee 2"}
                  onChange={(v) => onChange("miscFee2Label", v)}
                  type="text"
                />
                <BillingInputRow
                  label="Amount"
                  value={data.miscFee2Amount || ""}
                  onChange={(v) => onChange("miscFee2Amount", v)}
                  type="currency"
                />
              </div>
            )}
          </div>

          {/* Divider */}
          {(expandedFees.has(1) || expandedFees.has(2) || expandedFees.has(3)) && (
            <div className="border-t border-slate-200"></div>
          )}

          {/* Misc Fee 3 */}
          <div className="space-y-2">
            <button
              onClick={() => toggleFee(3)}
              className="w-full text-left text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2 px-2 py-1"
            >
              <span
                className={`transition-transform ${expandedFees.has(3) ? "" : "-rotate-90"}`}
              >
                ▼
              </span>
              Misc Fee 3
            </button>
            {expandedFees.has(3) && (
              <div className="space-y-2 pl-4">
                <BillingInputRow
                  label="Label"
                  value={data.miscFee3Label || "Misc Fee 3"}
                  onChange={(v) => onChange("miscFee3Label", v)}
                  type="text"
                />
                <BillingInputRow
                  label="Amount"
                  value={data.miscFee3Amount || ""}
                  onChange={(v) => onChange("miscFee3Amount", v)}
                  type="currency"
                />
              </div>
            )}
          </div>

          {/* Empty State */}
          {expandedFees.size === 0 && (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500">
                Click a fee above to add custom charges
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
