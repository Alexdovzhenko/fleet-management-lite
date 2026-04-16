"use client"

import { useState } from "react"
import { Calendar, X } from "lucide-react"
import { format } from "date-fns"

interface BillingDatePickerProps {
  value: string | null
  onChange: (value: string | null) => void
}

export function BillingDatePicker({ value, onChange }: BillingDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(false)
  }

  const displayValue = value ? format(new Date(value), "MMM d, yyyy") : "Filter by date"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{displayValue}</span>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-10">
          <input
            type="date"
            value={value || ""}
            onChange={handleDateChange}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
