"use client"

import { useState, useCallback } from "react"
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { BillingDatePicker } from "@/components/billing/BillingDatePicker"

interface TimeRangeSelectorProps {
  onRangeChange: (startDate: string, endDate: string) => void
  defaultPreset?: string
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

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset)
  const currentRange = currentPreset ? currentPreset.getRange() : { start: "", end: "" }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Custom date picker */}
      <BillingDatePicker
        startDate={currentRange.start}
        endDate={currentRange.end}
        onChange={handleCustomRange}
      />

      {/* Divider */}
      <div className="h-4 w-px bg-slate-200" />

      {/* Preset chips */}
      <div className="flex items-center gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`px-2.5 py-1 text-[12px] font-medium rounded-full transition-all duration-150 cursor-pointer ${
              selectedPreset === preset.id
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
