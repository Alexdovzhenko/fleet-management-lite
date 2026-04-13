"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrency } from "@/lib/billing-calculations"

interface BillingInputRowProps {
  label: string
  value: number | string
  onChange: (value: number | string) => void
  type?: "currency" | "number" | "decimal" | "percent" | "text"
  suffix?: string
  computedTotal?: number
  className?: string
  disabled?: boolean
  min?: number
  max?: number
}

export function BillingInputRow({
  label,
  value,
  onChange,
  type = "currency",
  suffix,
  computedTotal,
  className = "",
  disabled = false,
  min = 0,
  max,
}: BillingInputRowProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue: string | number = e.target.value

    if (type === "currency" || type === "number" || type === "decimal" || type === "percent") {
      const numValue = parseFloat(newValue) || 0
      if (min !== undefined && numValue < min) return
      if (max !== undefined && numValue > max) return
      newValue = numValue
    }

    onChange(newValue)
  }

  const inputType =
    type === "currency" || type === "decimal" || type === "percent" ? "number" : type

  const step = type === "decimal" || type === "percent" ? "0.1" : "1"

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Label */}
      <Label className="text-sm font-medium text-slate-700 flex-shrink-0 min-w-fit">
        {label}
      </Label>

      {/* Input Area */}
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          {type === "currency" && (
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              $
            </span>
          )}
          <Input
            type={inputType}
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`
              h-8 px-2.5 py-1 text-sm
              ${type === "currency" ? "pl-7" : ""}
              ${disabled ? "bg-slate-100" : ""}
            `}
          />
          {type === "percent" && (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
              %
            </span>
          )}
        </div>

        {/* Computed Total (for qty × rate combinations) */}
        {computedTotal !== undefined && (
          <div className="flex-shrink-0 text-right">
            <div className="text-xs text-slate-500 font-medium">
              = {formatCurrency(computedTotal)}
            </div>
          </div>
        )}

        {/* Suffix */}
        {suffix && !computedTotal && (
          <span className="text-sm text-slate-500 flex-shrink-0">{suffix}</span>
        )}
      </div>
    </div>
  )
}
