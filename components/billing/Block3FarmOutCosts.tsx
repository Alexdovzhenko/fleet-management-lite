"use client"

import { Button } from "@/components/ui/button"
import { BillingInputRow } from "./BillingInputRow"
import { type BillingData } from "@/lib/billing-calculations"
import { ChevronDown, Info } from "lucide-react"
import { useState } from "react"

interface Block3Props {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
  subtotal: number
  onCollapse?: (collapsed: boolean) => void
}

export function Block3FarmOutCosts({
  data,
  onChange,
  subtotal,
  onCollapse,
}: Block3Props) {
  const [collapsed, setCollapsed] = useState(false)

  const handleCollapse = (value: boolean) => {
    setCollapsed(value)
    onCollapse?.(value)
  }

  return (
    <div className="space-y-4">
      {/* Block Header */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-slate-100 border-l-4 border-slate-400 border-dashed hover:bg-slate-200 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Farm-out Costs
          </h3>
          <div
            className="text-slate-500 cursor-help hover:text-slate-700"
            title="Farm-out costs are charges passed to an external vendor or subcontracted driver"
          >
            <Info className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
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
        <div className="px-5 py-4 rounded-xl bg-slate-50/60 border-2 border-dashed border-slate-300 space-y-4">
          {/* Rate */}
          <BillingInputRow
            label="Rate"
            value={data.farmOutRate || ""}
            onChange={(v) => onChange("farmOutRate", v)}
            type="currency"
          />

          {/* Gratuity */}
          <BillingInputRow
            label="Gratuity"
            value={data.farmOutGratuity || ""}
            onChange={(v) => onChange("farmOutGratuity", v)}
            type="currency"
          />

          {/* Stops */}
          <BillingInputRow
            label="Stops"
            value={data.farmOutStops || ""}
            onChange={(v) => onChange("farmOutStops", v)}
            type="currency"
          />

          {/* Tolls */}
          <BillingInputRow
            label="Tolls"
            value={data.farmOutTolls || ""}
            onChange={(v) => onChange("farmOutTolls", v)}
            type="currency"
          />

          {/* Parking */}
          <BillingInputRow
            label="Parking"
            value={data.farmOutParking || ""}
            onChange={(v) => onChange("farmOutParking", v)}
            type="currency"
          />

          {/* Airport Fee */}
          <BillingInputRow
            label="Airport Fee"
            value={data.farmOutAirportFee || ""}
            onChange={(v) => onChange("farmOutAirportFee", v)}
            type="currency"
          />

          {/* Wait Time */}
          <BillingInputRow
            label="Wait Time"
            value={data.farmOutWaitTime || ""}
            onChange={(v) => onChange("farmOutWaitTime", v)}
            type="currency"
          />

          {/* Fuel Surcharge */}
          <BillingInputRow
            label="Fuel Surcharge"
            value={data.farmOutFuelSurcharge || ""}
            onChange={(v) => onChange("farmOutFuelSurcharge", v)}
            type="currency"
          />

          {/* Meet & Greet */}
          <BillingInputRow
            label="Meet & Greet"
            value={data.farmOutMeetAndGreet || ""}
            onChange={(v) => onChange("farmOutMeetAndGreet", v)}
            type="currency"
          />

          {/* Child Seat */}
          <BillingInputRow
            label="Child Seat"
            value={data.farmOutChildSeat || ""}
            onChange={(v) => onChange("farmOutChildSeat", v)}
            type="currency"
          />

          {/* Divider */}
          <div className="border-t border-slate-200 pt-4"></div>

          {/* Discount */}
          <BillingInputRow
            label="Discount (%)"
            value={data.farmOutDiscountPct || ""}
            onChange={(v) => onChange("farmOutDiscountPct", v)}
            type="percent"
            max={100}
          />

          {/* Late/Early Charge */}
          <div className="space-y-2">
            <BillingInputRow
              label="Late/Early Charge"
              value={data.farmOutLateEarlyCharge || ""}
              onChange={(v) => onChange("farmOutLateEarlyCharge", v)}
              type="currency"
            />
            <div className="flex gap-2 px-4">
              <Button
                variant={data.farmOutLateEarlyType === "late" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onChange("farmOutLateEarlyType", "late")}
              >
                Late
              </Button>
              <Button
                variant={data.farmOutLateEarlyType === "early" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onChange("farmOutLateEarlyType", "early")}
              >
                Early
              </Button>
            </div>
          </div>

          {/* Credit Card Fee */}
          <BillingInputRow
            label="Credit Card Fee (%)"
            value={data.farmOutCCFeePct || ""}
            onChange={(v) => onChange("farmOutCCFeePct", v)}
            type="percent"
            max={10}
          />
        </div>
      )}
    </div>
  )
}
