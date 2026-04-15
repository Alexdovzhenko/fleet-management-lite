"use client"

import { computeBillingTotals, type BillingData } from "@/lib/billing-calculations"
import { useMemo, useState } from "react"
import { CollapsibleSection } from "./CollapsibleSection"

interface BillingFormBlocksProps {
  data: Partial<BillingData>
  onChange: (field: string, value: any) => void
}

export function BillingFormBlocks({ data, onChange }: BillingFormBlocksProps) {
  const totals = useMemo(() => computeBillingTotals(data as BillingData), [data])
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})

  // Format number to currency display (e.g., 1999.1 → "1,999.10")
  const formatCurrencyInput = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    if (isNaN(num)) return ""
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Parse user input, removing commas and converting to number
  const parseCurrencyInput = (val: string) => {
    const cleaned = val.replace(/,/g, "")
    return parseFloat(cleaned) || 0
  }

  // Format decimal number with 2 decimal places (e.g., 1 → "1.00", .2 → "0.20")
  const formatDecimalInput = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    if (isNaN(num)) return ""
    return num.toFixed(2)
  }

  // Parse decimal input
  const parseDecimalInput = (val: string) => {
    return parseFloat(val) || 0
  }

  // Format integer (whole number only)
  const formatIntegerInput = (val: any) => {
    const num = typeof val === "string" ? parseInt(val) || 0 : val || 0
    if (isNaN(num)) return ""
    return String(Math.max(0, num))
  }

  // Parse integer input
  const parseIntegerInput = (val: string) => {
    return parseInt(val) || 0
  }

  const formatCurrency = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    return "$" + num.toFixed(2)
  }

  return (
    <div className="space-y-4">
      {/* PRIMARY CHARGES SECTION */}
      <CollapsibleSection title="Primary Charges" defaultOpen={true} type="primary">
        {/* Flat Rate */}
        <FormRow
          label="Flat Rate"
          result={formatCurrency(data.flatRate)}
          editable={true}
          editableValue={data.flatRate || ""}
          onEditChange={(val) => onChange("flatRate", val ? parseFloat(val) : 0)}
          fieldId="flatRate"
        />

        {/* Per Hour */}
        <FormRow
          label="Per Hour"
          result={formatCurrency((data.perHourQty || 0) * (data.perHourRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "perHourQty" ? (inputValues.perHourQty || String(data.perHourQty || "")) : formatDecimalInput(data.perHourQty)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, perHourQty: e.target.value })
                  onChange("perHourQty", parseDecimalInput(e.target.value))
                }}
                onFocus={() => setFocusedField("perHourQty")}
                onBlur={() => {
                  setFocusedField(null)
                  const { perHourQty: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <span className="text-sm font-medium text-slate-500 min-w-max">Hrs</span>
            </div>
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "perHourRate" ? (inputValues.perHourRate || String(data.perHourRate || "")) : formatCurrencyInput(data.perHourRate)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, perHourRate: e.target.value })
                  onChange("perHourRate", parseCurrencyInput(e.target.value))
                }}
                onFocus={() => setFocusedField("perHourRate")}
                onBlur={() => {
                  setFocusedField(null)
                  const { perHourRate: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "travelTimeQty" ? (inputValues.travelTimeQty || String(data.travelTimeQty || "")) : formatDecimalInput(data.travelTimeQty)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, travelTimeQty: e.target.value })
                  onChange("travelTimeQty", parseDecimalInput(e.target.value))
                }}
                onFocus={() => setFocusedField("travelTimeQty")}
                onBlur={() => {
                  setFocusedField(null)
                  const { travelTimeQty: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <span className="text-sm font-medium text-slate-500 min-w-max">Hrs</span>
            </div>
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "travelTimeRate" ? (inputValues.travelTimeRate || String(data.travelTimeRate || "")) : formatCurrencyInput(data.travelTimeRate)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, travelTimeRate: e.target.value })
                  onChange("travelTimeRate", parseCurrencyInput(e.target.value))
                }}
                onFocus={() => setFocusedField("travelTimeRate")}
                onBlur={() => {
                  setFocusedField(null)
                  const { travelTimeRate: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </FormRow>

        {/* Wait Time */}
        <FormRow
          label="Wait Time (Qty)"
          result={formatCurrency((data.waitTimeQty || 0) * (data.waitTimeRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "waitTimeQty" ? (inputValues.waitTimeQty || String(data.waitTimeQty || "")) : formatDecimalInput(data.waitTimeQty)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, waitTimeQty: e.target.value })
                  onChange("waitTimeQty", parseDecimalInput(e.target.value))
                }}
                onFocus={() => setFocusedField("waitTimeQty")}
                onBlur={() => {
                  setFocusedField(null)
                  const { waitTimeQty: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <span className="text-sm font-medium text-slate-500 min-w-max">Hrs</span>
            </div>
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "waitTimeRate" ? (inputValues.waitTimeRate || String(data.waitTimeRate || "")) : formatCurrencyInput(data.waitTimeRate)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, waitTimeRate: e.target.value })
                  onChange("waitTimeRate", parseCurrencyInput(e.target.value))
                }}
                onFocus={() => setFocusedField("waitTimeRate")}
                onBlur={() => {
                  setFocusedField(null)
                  const { waitTimeRate: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
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
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={focusedField === "extraStopsQty" ? String(data.extraStopsQty || "") : formatIntegerInput(data.extraStopsQty)}
                onChange={(e) => onChange("extraStopsQty", parseIntegerInput(e.target.value))}
                onFocus={() => setFocusedField("extraStopsQty")}
                onBlur={() => setFocusedField(null)}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <span className="text-sm font-medium text-slate-500 min-w-max">ea.</span>
            </div>
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "extraStopsRate" ? (inputValues.extraStopsRate || String(data.extraStopsRate || "")) : formatCurrencyInput(data.extraStopsRate)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, extraStopsRate: e.target.value })
                  onChange("extraStopsRate", parseCurrencyInput(e.target.value))
                }}
                onFocus={() => setFocusedField("extraStopsRate")}
                onBlur={() => {
                  setFocusedField(null)
                  const { extraStopsRate: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
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
          fieldId="airportFee"
        />

        {/* Parking */}
        <FormRow
          label="Parking"
          result={formatCurrency(data.parkingFee)}
          editable={true}
          editableValue={data.parkingFee || ""}
          onEditChange={(val) => onChange("parkingFee", val ? parseFloat(val) : 0)}
          fieldId="parkingFee"
        />

        {/* Meet & Greet */}
        <FormRow
          label="Meet & Greet"
          result={formatCurrency(data.meetAndGreet)}
          editable={true}
          editableValue={data.meetAndGreet || ""}
          onEditChange={(val) => onChange("meetAndGreet", val ? parseFloat(val) : 0)}
          fieldId="meetAndGreet"
        />

        {/* Car Seat */}
        <FormRow
          label="Car Seat"
          result={formatCurrency((data.carSeatQty || 0) * (data.carSeatRate || 0))}
        >
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={focusedField === "carSeatQty" ? String(data.carSeatQty || "") : formatIntegerInput(data.carSeatQty)}
                onChange={(e) => onChange("carSeatQty", parseIntegerInput(e.target.value))}
                onFocus={() => setFocusedField("carSeatQty")}
                onBlur={() => setFocusedField(null)}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
              <span className="text-sm font-medium text-slate-500 min-w-max">ea.</span>
            </div>
            <span className="text-slate-500 font-medium">×</span>
            <div className="relative flex items-center w-20">
              <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={focusedField === "carSeatRate" ? (inputValues.carSeatRate || String(data.carSeatRate || "")) : formatCurrencyInput(data.carSeatRate)}
                onChange={(e) => {
                  setInputValues({ ...inputValues, carSeatRate: e.target.value })
                  onChange("carSeatRate", parseCurrencyInput(e.target.value))
                }}
                onFocus={() => setFocusedField("carSeatRate")}
                onBlur={() => {
                  setFocusedField(null)
                  const { carSeatRate: _, ...rest } = inputValues
                  setInputValues(rest)
                }}
                className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
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
          fieldId="lateEarlyCharge"
        />
      </CollapsibleSection>

      {/* ADDITIONAL CHARGES SECTION */}
      <CollapsibleSection title="Additional Charges" defaultOpen={false} type="additional">
        {/* Misc Fee 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-2">
            <label className="text-sm font-medium text-slate-700">Misc Fee 1</label>
            <div className="min-w-[110px]">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={focusedField === "miscFee1" ? (inputValues.miscFee1 || String(data.miscFee1Amount || "")) : formatCurrencyInput(data.miscFee1Amount)}
                  onChange={(e) => {
                    setInputValues({ ...inputValues, miscFee1: e.target.value })
                    onChange("miscFee1Amount", parseCurrencyInput(e.target.value))
                  }}
                  onFocus={() => setFocusedField("miscFee1")}
                  onBlur={() => {
                    setFocusedField(null)
                    const { miscFee1: _, ...rest } = inputValues
                    setInputValues(rest)
                  }}
                  className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50 cursor-text focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g., Surcharge, Service Fee, etc."
            value={data.miscFee1Label || ""}
            onChange={(e) => onChange("miscFee1Label", e.target.value)}
            onFocus={(e) => {
              if (e.target.value === "Misc Fee 1") {
                onChange("miscFee1Label", "")
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        {/* Misc Fee 2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-2">
            <label className="text-sm font-medium text-slate-700">Misc Fee 2</label>
            <div className="min-w-[110px]">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={focusedField === "miscFee2" ? (inputValues.miscFee2 || String(data.miscFee2Amount || "")) : formatCurrencyInput(data.miscFee2Amount)}
                  onChange={(e) => {
                    setInputValues({ ...inputValues, miscFee2: e.target.value })
                    onChange("miscFee2Amount", parseCurrencyInput(e.target.value))
                  }}
                  onFocus={() => setFocusedField("miscFee2")}
                  onBlur={() => {
                    setFocusedField(null)
                    const { miscFee2: _, ...rest } = inputValues
                    setInputValues(rest)
                  }}
                  className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50 cursor-text focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g., Surcharge, Service Fee, etc."
            value={data.miscFee2Label || ""}
            onChange={(e) => onChange("miscFee2Label", e.target.value)}
            onFocus={(e) => {
              if (e.target.value === "Misc Fee 2") {
                onChange("miscFee2Label", "")
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        {/* Misc Fee 3 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-2">
            <label className="text-sm font-medium text-slate-700">Misc Fee 3</label>
            <div className="min-w-[110px]">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm font-semibold font-mono text-slate-900 pointer-events-none">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={focusedField === "miscFee3" ? (inputValues.miscFee3 || String(data.miscFee3Amount || "")) : formatCurrencyInput(data.miscFee3Amount)}
                  onChange={(e) => {
                    setInputValues({ ...inputValues, miscFee3: e.target.value })
                    onChange("miscFee3Amount", parseCurrencyInput(e.target.value))
                  }}
                  onFocus={() => setFocusedField("miscFee3")}
                  onBlur={() => {
                    setFocusedField(null)
                    const { miscFee3: _, ...rest } = inputValues
                    setInputValues(rest)
                  }}
                  className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50 cursor-text focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          <input
            type="text"
            placeholder="e.g., Surcharge, Service Fee, etc."
            value={data.miscFee3Label || ""}
            onChange={(e) => onChange("miscFee3Label", e.target.value)}
            onFocus={(e) => {
              if (e.target.value === "Misc Fee 3") {
                onChange("miscFee3Label", "")
              }
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-1 focus:ring-slate-400 focus:outline-none"
          />
        </div>

        {/* Standard Gratuity - BLUE */}
        <FormRow
          label="Std Grat"
          labelColor="text-blue-600"
          result={formatCurrency(totals.gratuity)}
        >
          <div className="relative flex items-center w-24">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={focusedField === "gratuityPct" ? (inputValues.gratuityPct || String(data.gratuityPct || "")) : formatDecimalInput(data.gratuityPct)}
              onChange={(e) => {
                setInputValues({ ...inputValues, gratuityPct: e.target.value })
                onChange("gratuityPct", parseDecimalInput(e.target.value))
              }}
              onFocus={() => setFocusedField("gratuityPct")}
              onBlur={() => {
                setFocusedField(null)
                const { gratuityPct: _, ...rest } = inputValues
                setInputValues(rest)
              }}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>

        {/* Discount - RED */}
        <FormRow
          label="Discount"
          labelColor="text-red-600"
          result={`-${formatCurrency(totals.discount)}`}
        >
          <div className="relative flex items-center w-24">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={focusedField === "discountPct" ? (inputValues.discountPct || String(data.discountPct || "")) : formatDecimalInput(data.discountPct)}
              onChange={(e) => {
                setInputValues({ ...inputValues, discountPct: e.target.value })
                onChange("discountPct", parseDecimalInput(e.target.value))
              }}
              onFocus={() => setFocusedField("discountPct")}
              onBlur={() => {
                setFocusedField(null)
                const { discountPct: _, ...rest } = inputValues
                setInputValues(rest)
              }}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>

        {/* Credit Card Fee - BLUE */}
        <FormRow
          label="CC Fee"
          labelColor="text-blue-600"
          result={formatCurrency(totals.creditCardFee)}
        >
          <div className="relative flex items-center w-24">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={focusedField === "creditCardFeePct" ? (inputValues.creditCardFeePct || String(data.creditCardFeePct || "")) : formatDecimalInput(data.creditCardFeePct)}
              onChange={(e) => {
                setInputValues({ ...inputValues, creditCardFeePct: e.target.value })
                onChange("creditCardFeePct", parseDecimalInput(e.target.value))
              }}
              onFocus={() => setFocusedField("creditCardFeePct")}
              onBlur={() => {
                setFocusedField(null)
                const { creditCardFeePct: _, ...rest } = inputValues
                setInputValues(rest)
              }}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>
      </CollapsibleSection>

      {/* FARM-OUT SECTION */}
      <CollapsibleSection title="Farm-Out Costs" defaultOpen={false} type="farmout">
        {/* Farm-out Rate */}
        <FormRow
          label="Farm-Out Rate"
          result={formatCurrency(data.farmOutRate)}
          editable={true}
          editableValue={data.farmOutRate || ""}
          onEditChange={(val) => onChange("farmOutRate", val ? parseFloat(val) : 0)}
          fieldId="farmOutRate"
        />

        {/* Farm-out Gratuity */}
        <FormRow
          label="FO Gratuity"
          result={formatCurrency(data.farmOutGratuity)}
          editable={true}
          editableValue={data.farmOutGratuity || ""}
          onEditChange={(val) => onChange("farmOutGratuity", val ? parseFloat(val) : 0)}
          fieldId="farmOutGratuity"
        />

        {/* Farm-out Stops */}
        <FormRow
          label="FO Stops"
          result={formatCurrency(data.farmOutStops)}
          editable={true}
          editableValue={data.farmOutStops || ""}
          onEditChange={(val) => onChange("farmOutStops", val ? parseFloat(val) : 0)}
          fieldId="farmOutStops"
        />

        {/* Farm-out Tolls */}
        <FormRow
          label="FO Tolls"
          result={formatCurrency(data.farmOutTolls)}
          editable={true}
          editableValue={data.farmOutTolls || ""}
          onEditChange={(val) => onChange("farmOutTolls", val ? parseFloat(val) : 0)}
          fieldId="farmOutTolls"
        />

        {/* Farm-out Parking */}
        <FormRow
          label="FO Parking"
          result={formatCurrency(data.farmOutParking)}
          editable={true}
          editableValue={data.farmOutParking || ""}
          onEditChange={(val) => onChange("farmOutParking", val ? parseFloat(val) : 0)}
          fieldId="farmOutParking"
        />

        {/* Farm-out Airport Fee */}
        <FormRow
          label="FO Airport Fee"
          result={formatCurrency(data.farmOutAirportFee)}
          editable={true}
          editableValue={data.farmOutAirportFee || ""}
          onEditChange={(val) => onChange("farmOutAirportFee", val ? parseFloat(val) : 0)}
          fieldId="farmOutAirportFee"
        />

        {/* Farm-out Wait Time */}
        <FormRow
          label="FO Wait Time"
          result={formatCurrency(data.farmOutWaitTime)}
          editable={true}
          editableValue={data.farmOutWaitTime || ""}
          onEditChange={(val) => onChange("farmOutWaitTime", val ? parseFloat(val) : 0)}
          fieldId="farmOutWaitTime"
        />

        {/* Farm-out Fuel Surcharge - BLUE */}
        <FormRow
          label="FO Fuel Surch"
          labelColor="text-blue-600"
          result={formatCurrency((data.farmOutRate || 0) * (data.farmOutFuelSurcharge || 0) / 100)}
        >
          <div className="relative flex items-center w-24">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutFuelSurcharge || ""}
              onChange={(e) => onChange("farmOutFuelSurcharge", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>

        {/* Farm-out Meet & Greet */}
        <FormRow
          label="FO Meet & Greet"
          result={formatCurrency(data.farmOutMeetAndGreet)}
          editable={true}
          editableValue={data.farmOutMeetAndGreet || ""}
          onEditChange={(val) => onChange("farmOutMeetAndGreet", val ? parseFloat(val) : 0)}
          fieldId="farmOutMeetAndGreet"
        />

        {/* Farm-out Child Seat */}
        <FormRow
          label="FO Child Seat"
          result={formatCurrency(data.farmOutChildSeat)}
          editable={true}
          editableValue={data.farmOutChildSeat || ""}
          onEditChange={(val) => onChange("farmOutChildSeat", val ? parseFloat(val) : 0)}
          fieldId="farmOutChildSeat"
        />

        {/* Farm-out Discount - RED */}
        <FormRow
          label="FO Discount"
          labelColor="text-red-600"
          result={`-${formatCurrency(totals.farmOutDiscount)}`}
        >
          <div className="relative flex items-center w-24">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutDiscountPct || ""}
              onChange={(e) => onChange("farmOutDiscountPct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>

        {/* Farm-out CC Fee - BLUE */}
        <FormRow
          label="FO CC Fee"
          labelColor="text-blue-600"
          result={formatCurrency(totals.farmOutCCFee)}
        >
          <div className="relative flex items-center w-24">
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder="0.00"
              value={data.farmOutCCFeePct || ""}
              onChange={(e) => onChange("farmOutCCFeePct", e.target.value ? parseFloat(e.target.value) : 0)}
              className="w-full pr-6 pl-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:ring-1 focus:ring-slate-400 focus:outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0"
            />
            <span className="absolute right-3 text-sm font-semibold text-slate-500 pointer-events-none">%</span>
          </div>
        </FormRow>
      </CollapsibleSection>
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
  fieldId?: string
}

function FormRow({ label, labelColor = "text-slate-900", formula, result, children, editable = false, editableValue = "", onEditChange, fieldId }: FormRowProps) {
  const [focusedEditableField, setFocusedEditableField] = useState<string | null>(null)
  const [editableInputValues, setEditableInputValues] = useState<Record<string, string>>({})

  const formatCurrencyInput = (val: any) => {
    const num = typeof val === "string" ? parseFloat(val) || 0 : val || 0
    if (isNaN(num)) return ""
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

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
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={fieldId && focusedEditableField === fieldId ? (editableInputValues[fieldId] || String(editableValue || "")) : formatCurrencyInput(editableValue)}
              onChange={(e) => {
                if (fieldId) {
                  setEditableInputValues({ ...editableInputValues, [fieldId]: e.target.value })
                }
                onEditChange?.(e.target.value)
              }}
              onFocus={() => fieldId && setFocusedEditableField(fieldId)}
              onBlur={() => {
                if (fieldId) {
                  setFocusedEditableField(null)
                  const { [fieldId]: _, ...rest } = editableInputValues
                  setEditableInputValues(rest)
                }
              }}
              className="w-full pl-6 pr-3 py-2 border border-slate-300 rounded-lg text-right text-sm font-semibold font-mono text-slate-900 bg-slate-50 cursor-text focus:bg-white focus:ring-1 focus:ring-slate-400 focus:outline-none transition-colors"
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
