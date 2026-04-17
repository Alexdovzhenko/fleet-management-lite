"use client"

import { useState, useCallback } from "react"
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { BillingDatePicker } from "@/components/billing/BillingDatePicker"

interface TimeRangeSelectorProps {
  onRangeChange: (startDate: string, endDate: string) => void
  defaultPreset?: "last-7-days" | "today" | "this-month" | "last-month" | "last-12-months"
}

const PRESETS = [
  {
    id: "today",
    label: "Today",
    getRange: () => {
      const now = new Date()
      return {
        start: format(startOfDay(now), "yyyy-MM-dd"),
        end: format(endOfDay(now), "yyyy-MM-dd"),
      }
    },
  },
  {
    id: "last-7-days",
    label: "Last 7 Days",
    getRange: () => ({
      start: format(startOfDay(subDays(new Date(), 6)), "yyyy-MM-dd"),
      end: format(endOfDay(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    id: "this-month",
    label: "This Month",
    getRange: () => {
      const now = new Date()
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfDay(now), "yyyy-MM-dd"),
      }
    },
  },
  {
    id: "last-month",
    label: "Last Month",
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
      }
    },
  },
  {
    id: "last-12-months",
    label: "Last 12 Months",
    getRange: () => ({
      start: format(startOfDay(subMonths(new Date(), 11)), "yyyy-MM-dd"),
      end: format(endOfDay(new Date()), "yyyy-MM-dd"),
    }),
  },
]

export function TimeRangeSelector({
  onRangeChange,
  defaultPreset = "last-7-days",
}: TimeRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultPreset)

  const handlePresetClick = useCallback(
    (presetId: string) => {
      setSelectedPreset(presetId)
      const preset = PRESETS.find((p) => p.id === presetId)
      if (preset) {
        const range = preset.getRange()
        onRangeChange(range.start, range.end)
      }
    },
    [onRangeChange]
  )

  const handleCustomRange = useCallback(
    (start: string | null, end: string | null) => {
      if (start && end) {
        setSelectedPreset("")
        onRangeChange(start, end)
      }
    },
    [onRangeChange]
  )

  // Get current range to show in date picker
  const currentPreset = PRESETS.find((p) => p.id === selectedPreset)
  const currentRange = currentPreset
    ? currentPreset.getRange()
    : { start: "", end: "" }

  return (
    <div className="space-y-4">
      {/* Date Picker */}
      <div className="flex items-center gap-3">
        <BillingDatePicker
          startDate={currentRange.start}
          endDate={currentRange.end}
          onChange={handleCustomRange}
        />

        {/* Preset buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedPreset === preset.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
