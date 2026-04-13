"use client"

import { Button } from "@/components/ui/button"
import { BillingInputRow } from "./BillingInputRow"
import { type BillingData } from "@/lib/billing-calculations"
import { ChevronDown } from "lucide-react"
import { useState } from "react"

interface Block1Props {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
  subtotal: number
  onCollapse?: (collapsed: boolean) => void
}

export function Block1PrimaryCharges({
  data,
  onChange,
  subtotal,
  onCollapse,
}: Block1Props) {
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
        className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-blue-50 border-l-4 border-blue-500 hover:bg-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
            Primary Charges
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-blue-600">
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
          {/* Flat Rate */}
          <BillingInputRow
            label="Flat Rate"
            value={data.flatRate || ""}
            onChange={(v) => onChange("flatRate", v)}
            type="currency"
          />

          {/* Per Hour */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <BillingInputRow
                label="Per Hour (Hours)"
                value={data.perHourQty || ""}
                onChange={(v) => onChange("perHourQty", v)}
                type="decimal"
              />
              <BillingInputRow
                label="Per Hour (Rate)"
                value={data.perHourRate || ""}
                onChange={(v) => onChange("perHourRate", v)}
                type="currency"
              />
            </div>
            {(data.perHourQty || 0) * (data.perHourRate || 0) > 0 && (
              <div className="text-xs text-slate-500 px-4">
                Total: ${((data.perHourQty || 0) * (data.perHourRate || 0)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Travel Time */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <BillingInputRow
                label="Travel Time (Hours)"
                value={data.travelTimeQty || ""}
                onChange={(v) => onChange("travelTimeQty", v)}
                type="decimal"
              />
              <BillingInputRow
                label="Travel Time (Rate)"
                value={data.travelTimeRate || ""}
                onChange={(v) => onChange("travelTimeRate", v)}
                type="currency"
              />
            </div>
            {(data.travelTimeQty || 0) * (data.travelTimeRate || 0) > 0 && (
              <div className="text-xs text-slate-500 px-4">
                Total: ${((data.travelTimeQty || 0) * (data.travelTimeRate || 0)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Wait Time */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <BillingInputRow
                label="Wait Time (Hours)"
                value={data.waitTimeQty || ""}
                onChange={(v) => onChange("waitTimeQty", v)}
                type="decimal"
              />
              <BillingInputRow
                label="Wait Time (Rate)"
                value={data.waitTimeRate || ""}
                onChange={(v) => onChange("waitTimeRate", v)}
                type="currency"
              />
            </div>
            {(data.waitTimeQty || 0) * (data.waitTimeRate || 0) > 0 && (
              <div className="text-xs text-slate-500 px-4">
                Total: ${((data.waitTimeQty || 0) * (data.waitTimeRate || 0)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Extra Stops */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <BillingInputRow
                label="Extra Stops (Count)"
                value={data.extraStopsQty || ""}
                onChange={(v) => onChange("extraStopsQty", typeof v === "number" ? v : parseInt(String(v)) || 0)}
                type="number"
                min={0}
              />
              <BillingInputRow
                label="Extra Stops (Rate)"
                value={data.extraStopsRate || ""}
                onChange={(v) => onChange("extraStopsRate", v)}
                type="currency"
              />
            </div>
            {(data.extraStopsQty || 0) * (data.extraStopsRate || 0) > 0 && (
              <div className="text-xs text-slate-500 px-4">
                Total: ${((data.extraStopsQty || 0) * (data.extraStopsRate || 0)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Airport Fee */}
          <BillingInputRow
            label="Airport Fee"
            value={data.airportFee || ""}
            onChange={(v) => onChange("airportFee", v)}
            type="currency"
          />

          {/* Parking Fee */}
          <BillingInputRow
            label="Parking Fee"
            value={data.parkingFee || ""}
            onChange={(v) => onChange("parkingFee", v)}
            type="currency"
          />

          {/* Meet & Greet */}
          <BillingInputRow
            label="Meet & Greet"
            value={data.meetAndGreet || ""}
            onChange={(v) => onChange("meetAndGreet", v)}
            type="currency"
          />

          {/* Car Seat */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <BillingInputRow
                label="Car Seat (Count)"
                value={data.carSeatQty || ""}
                onChange={(v) => onChange("carSeatQty", typeof v === "number" ? v : parseInt(String(v)) || 0)}
                type="number"
                min={0}
              />
              <BillingInputRow
                label="Car Seat (Rate)"
                value={data.carSeatRate || ""}
                onChange={(v) => onChange("carSeatRate", v)}
                type="currency"
              />
            </div>
            {(data.carSeatQty || 0) * (data.carSeatRate || 0) > 0 && (
              <div className="text-xs text-slate-500 px-4">
                Total: ${((data.carSeatQty || 0) * (data.carSeatRate || 0)).toFixed(2)}
              </div>
            )}
          </div>

          {/* Late/Early Charge */}
          <div className="space-y-2">
            <BillingInputRow
              label="Late/Early Charge"
              value={data.lateEarlyCharge || ""}
              onChange={(v) => onChange("lateEarlyCharge", v)}
              type="currency"
            />
            <div className="flex gap-2 px-4">
              <Button
                variant={data.lateEarlyType === "late" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onChange("lateEarlyType", "late")}
              >
                Late
              </Button>
              <Button
                variant={data.lateEarlyType === "early" ? "default" : "outline"}
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={() => onChange("lateEarlyType", "early")}
              >
                Early
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 pt-4"></div>

          {/* Credit Card Fee */}
          <BillingInputRow
            label="Credit Card Fee (%)"
            value={data.creditCardFeePct || ""}
            onChange={(v) => onChange("creditCardFeePct", v)}
            type="percent"
            max={10}
          />

          {/* Gratuity */}
          <BillingInputRow
            label="Gratuity (%)"
            value={data.gratuityPct || ""}
            onChange={(v) => onChange("gratuityPct", v)}
            type="percent"
            max={50}
          />

          {/* Discount */}
          <BillingInputRow
            label="Discount (%)"
            value={data.discountPct || ""}
            onChange={(v) => onChange("discountPct", v)}
            type="percent"
            max={100}
          />
        </div>
      )}
    </div>
  )
}
