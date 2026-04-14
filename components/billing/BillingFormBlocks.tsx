"use client"

import { computeBillingTotals, type BillingData } from "@/lib/billing-calculations"
import { useMemo } from "react"

interface BillingFormBlocksProps {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
}

export function BillingFormBlocks({ data, onChange }: BillingFormBlocksProps) {
  const totals = useMemo(() => computeBillingTotals(data as BillingData), [data])

  const formatCurrency = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    return "$" + num.toFixed(2)
  }

  const formatPercent = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    return num.toFixed(2)
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* PRIMARY CHARGES SECTION */}
      <div className="border-t border-slate-200 pt-4 space-y-4 lg:space-y-5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-4">
          Primary Charges
        </h3>

        {/* Flat Rate */}
        <FormRow
          label="Flat Rate"
          result={formatCurrency(data.flatRate)}
          editable={true}
          editableValue={data.flatRate || ""}
          onEditChange={(val) => onChange("flatRate", val ? parseFloat(val) : 0)}
        />

        {/* Per Hour */}
        <FormRow
          label="Per Hour"
          result={formatCurrency((data.perHourQty || 0) * (data.perHourRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.perHourQty || ""}
              onChange={(e) => onChange("perHourQty", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={data.perHourRate || ""}
                onChange={(e) => onChange("perHourRate", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Travel Time */}
        <FormRow
          label="Travel Time"
          result={formatCurrency((data.travelTimeQty || 0) * (data.travelTimeRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.travelTimeQty || ""}
              onChange={(e) => onChange("travelTimeQty", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={data.travelTimeRate || ""}
                onChange={(e) => onChange("travelTimeRate", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Wait/OT Time */}
        <FormRow
          label="Wait/Misc (Qty)"
          result={formatCurrency((data.waitTimeQty || 0) * (data.waitTimeRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.waitTimeQty || ""}
              onChange={(e) => onChange("waitTimeQty", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={data.waitTimeRate || ""}
                onChange={(e) => onChange("waitTimeRate", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Extra Stops */}
        <FormRow
          label="Extra Stops"
          result={formatCurrency((data.extraStopsQty || 0) * (data.extraStopsRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.extraStopsQty || ""}
              onChange={(e) => onChange("extraStopsQty", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={data.extraStopsRate || ""}
                onChange={(e) => onChange("extraStopsRate", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Airport Fee */}
        <FormRow
          label="Airport Fee"
          result={formatCurrency(data.airportFee)}
          editable={true}
          editableValue={data.airportFee || ""}
          onEditChange={(val) => onChange("airportFee", val ? parseFloat(val) : 0)}
        />

        {/* Parking */}
        <FormRow
          label="Parking"
          result={formatCurrency(data.parkingFee)}
          editable={true}
          editableValue={data.parkingFee || ""}
          onEditChange={(val) => onChange("parkingFee", val ? parseFloat(val) : 0)}
        />

        {/* Meet & Greet */}
        <FormRow
          label="Meet & Greet"
          result={formatCurrency(data.meetAndGreet)}
          editable={true}
          editableValue={data.meetAndGreet || ""}
          onEditChange={(val) => onChange("meetAndGreet", val ? parseFloat(val) : 0)}
        />

        {/* Car Seat */}
        <FormRow
          label="Car Seat"
          result={formatCurrency((data.carSeatQty || 0) * (data.carSeatRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              placeholder="0"
              value={data.carSeatQty || ""}
              onChange={(e) => onChange("carSeatQty", e.target.value ? parseInt(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder="0.00"
                value={data.carSeatRate || ""}
                onChange={(e) => onChange("carSeatRate", e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Late/Early Charge */}
        <FormRow
          label="Late/Early Charge"
          result={formatCurrency(data.lateEarlyCharge)}
          editable={true}
          editableValue={data.lateEarlyCharge || ""}
          onEditChange={(val) => onChange("lateEarlyCharge", val ? parseFloat(val) : 0)}
        />
      </div>

      {/* ADDITIONAL CHARGES SECTION */}
      <div className="border-t border-slate-200 pt-4 space-y-4 lg:space-y-5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-4">
          Additional Charges
        </h3>

        {/* Misc Fee 1 */}
        <FormRow label="Misc Fee 1" result={formatCurrency(data.miscFee1Amount)}>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Label"
              value={data.miscFee1Label || ""}
              onChange={(e) => onChange("miscFee1Label", e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.miscFee1Amount || ""}
              onChange={(e) => onChange("miscFee1Amount", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
          </div>
        </FormRow>

        {/* Misc Fee 2 */}
        <FormRow label="Misc Fee 2" result={formatCurrency(data.miscFee2Amount)}>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Label"
              value={data.miscFee2Label || ""}
              onChange={(e) => onChange("miscFee2Label", e.target.value)}
              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
            />
            <input
              type="number"
              placeholder="0.00"
              value={data.miscFee2Amount || ""}
              onChange={(e) => onChange("miscFee2Amount", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
          </div>
        </FormRow>

        {/* Misc Fee 3 */}
        <FormRow label="Misc Fee 3" result={formatCurrency(data.miscFee3Amount)}>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Label"
              value={data.miscFee3Label || ""}
              onChange={(e) => onChange("miscFee3Label", e.target.value)}
              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm"
            />
            <input
              type="number"
              placeholder="0.00"
              value={data.miscFee3Amount || ""}
              onChange={(e) => onChange("miscFee3Amount", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
          </div>
        </FormRow>

        {/* Standard Gratuity - BLUE */}
        <FormRow
          label="Std Grat"
          labelColor="text-blue-600"
          formula={`${formatPercent(data.gratuityPct)}%`}
          result={formatCurrency(totals.gratuity)}
        >
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.gratuityPct || ""}
              onChange={(e) => onChange("gratuityPct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>

        {/* Discount - RED */}
        <FormRow
          label="Discount"
          labelColor="text-red-600"
          formula={`${formatPercent(data.discountPct)}%`}
          result={`-${formatCurrency(totals.discount)}`}
        >
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={data.discountPct || ""}
              onChange={(e) => onChange("discountPct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>

        {/* Credit Card Fee - BLUE */}
        <FormRow
          label="CC Fee"
          labelColor="text-blue-600"
          formula={`${formatPercent(data.creditCardFeePct)}%`}
          result={formatCurrency(totals.creditCardFee)}
        >
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={data.creditCardFeePct || ""}
              onChange={(e) => onChange("creditCardFeePct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>
      </div>

      {/* FARM-OUT SECTION */}
      <div className="border-t border-slate-200 pt-4 space-y-4 lg:space-y-5">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-l-4 border-blue-500 pl-3 mb-4">
          Farm-Out Costs
        </h3>

        {/* Farm-out Rate */}
        <FormRow label="Farm-Out Rate" result={formatCurrency(data.farmOutRate)}>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutRate || ""}
              onChange={(e) => onChange("farmOutRate", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-6 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Gratuity */}
        <FormRow label="FO Gratuity" result={formatCurrency(data.farmOutGratuity)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutGratuity || ""}
              onChange={(e) => onChange("farmOutGratuity", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Stops */}
        <FormRow label="FO Stops" result={formatCurrency(data.farmOutStops)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutStops || ""}
              onChange={(e) => onChange("farmOutStops", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Tolls */}
        <FormRow label="FO Tolls" result={formatCurrency(data.farmOutTolls)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutTolls || ""}
              onChange={(e) => onChange("farmOutTolls", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Parking */}
        <FormRow label="FO Parking" result={formatCurrency(data.farmOutParking)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutParking || ""}
              onChange={(e) => onChange("farmOutParking", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Airport Fee */}
        <FormRow label="FO Airport Fee" result={formatCurrency(data.farmOutAirportFee)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutAirportFee || ""}
              onChange={(e) => onChange("farmOutAirportFee", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Wait Time */}
        <FormRow label="FO Wait Time" result={formatCurrency(data.farmOutWaitTime)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutWaitTime || ""}
              onChange={(e) => onChange("farmOutWaitTime", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Fuel Surcharge - BLUE */}
        <FormRow
          label="FO Fuel Surch"
          labelColor="text-blue-600"
          formula={`${formatPercent(data.farmOutFuelSurcharge)}%`}
          result={formatCurrency((data.farmOutRate || 0) * (data.farmOutFuelSurcharge || 0) / 100)}
        >
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={data.farmOutFuelSurcharge || ""}
              onChange={(e) => onChange("farmOutFuelSurcharge", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>

        {/* Farm-out Meet & Greet */}
        <FormRow label="FO Meet & Greet" result={formatCurrency(data.farmOutMeetAndGreet)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutMeetAndGreet || ""}
              onChange={(e) => onChange("farmOutMeetAndGreet", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Child Seat */}
        <FormRow label="FO Child Seat" result={formatCurrency(data.farmOutChildSeat)}>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutChildSeat || ""}
              onChange={(e) => onChange("farmOutChildSeat", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 pl-5 pr-2 py-1 border border-slate-300 rounded text-sm text-right"
            />
          </div>
        </FormRow>

        {/* Farm-out Discount - RED */}
        <FormRow
          label="FO Discount"
          labelColor="text-red-600"
          formula={`${formatPercent(data.farmOutDiscountPct)}%`}
          result={`-${formatCurrency(totals.farmOutDiscount)}`}
        >
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={data.farmOutDiscountPct || ""}
              onChange={(e) => onChange("farmOutDiscountPct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>

        {/* Farm-out Late/Early */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-2">
            <label className="text-sm font-medium text-slate-700">FO Late/Early</label>
            <div className="flex items-center gap-3">
              <select
                value={data.farmOutLateEarlyType || "late"}
                onChange={(e) => onChange("farmOutLateEarlyType", e.target.value)}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
              >
                <option value="late">Late</option>
                <option value="early">Early</option>
              </select>
            </div>
            <div className="min-w-[100px]">
              <div className="border border-slate-300 rounded-lg px-3 py-2 text-right text-sm font-semibold text-slate-900 bg-slate-50">
                {formatCurrency(data.farmOutLateEarlyCharge)}
              </div>
            </div>
          </div>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={data.farmOutLateEarlyCharge || ""}
            onChange={(e) => onChange("farmOutLateEarlyCharge", e.target.value ? parseFloat(e.target.value) : 0)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
          />
        </div>

        {/* Farm-out CC Fee - BLUE */}
        <FormRow
          label="FO CC Fee"
          labelColor="text-blue-600"
          formula={`${formatPercent(data.farmOutCCFeePct)}%`}
          result={formatCurrency(totals.farmOutCCFee)}
        >
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="0.00"
              value={data.farmOutCCFeePct || ""}
              onChange={(e) => onChange("farmOutCCFeePct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            />
            <span className="text-slate-500">%</span>
          </div>
        </FormRow>
      </div>
    </div>
  )
}

interface FormRowProps {
  label: string
  labelColor?: string
  formula?: string
  result: string
  children?: React.ReactNode
  editable?: boolean
  editableValue?: string | number
  onEditChange?: (val: string) => void
}

function FormRow({ label, labelColor = "text-slate-900", formula, result, children, editable = false, editableValue = "", onEditChange }: FormRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 lg:py-4">
      <div className="flex-1 min-w-[100px]">
        <label className={`text-sm font-medium text-slate-700 ${labelColor === "text-slate-900" ? "" : labelColor}`}>{label}</label>
      </div>
      <div className="flex items-center gap-3 flex-1">
        {children}
        {formula && <span className="font-mono text-sm text-slate-600 min-w-fit">{formula}</span>}
      </div>
      <div className="min-w-[110px]">
        {editable ? (
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={editableValue}
              onChange={(e) => onEditChange?.(e.target.value)}
              className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50 cursor-text focus:bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none transition-colors"
            />
          </div>
        ) : (
          <div className="border border-slate-300 rounded-lg px-3 py-2 text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50">
            {result}
          </div>
        )}
      </div>
    </div>
  )
}
