"use client"

import { useState, useCallback } from "react"
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { BillingDatePicker } from "@/components/billing/BillingDatePicker"

interface TimeRangeSelectorProps {
  onRangeChange: (startDate: string, endDate: string) => void
  defaultPreset?: string
}

const PRESETS = [
  { id: "today",          label: "Today",         getRange: () => { const n = new Date(); return { start: format(startOfDay(n), "yyyy-MM-dd"), end: format(endOfDay(n), "yyyy-MM-dd") } } },
  { id: "last-7-days",    label: "7d",            getRange: () => ({ start: format(startOfDay(subDays(new Date(), 6)), "yyyy-MM-dd"), end: format(endOfDay(new Date()), "yyyy-MM-dd") }) },
  { id: "this-month",     label: "This Month",    getRange: () => { const n = new Date(); return { start: format(startOfMonth(n), "yyyy-MM-dd"), end: format(endOfDay(n), "yyyy-MM-dd") } } },
  { id: "last-month",     label: "Last Month",    getRange: () => { const l = subMonths(new Date(), 1); return { start: format(startOfMonth(l), "yyyy-MM-dd"), end: format(endOfMonth(l), "yyyy-MM-dd") } } },
  { id: "last-12-months", label: "12 Months",     getRange: () => ({ start: format(startOfDay(subMonths(new Date(), 11)), "yyyy-MM-dd"), end: format(endOfDay(new Date()), "yyyy-MM-dd") }) },
]

export function TimeRangeSelector({ onRangeChange, defaultPreset = "last-7-days" }: TimeRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(defaultPreset)

  const handlePresetClick = useCallback((presetId: string) => {
    setSelectedPreset(presetId)
    const preset = PRESETS.find((p) => p.id === presetId)
    if (preset) { const r = preset.getRange(); onRangeChange(r.start, r.end) }
  }, [onRangeChange])

  const handleCustomRange = useCallback((start: string | null, end: string | null) => {
    if (start && end) { setSelectedPreset(""); onRangeChange(start, end) }
  }, [onRangeChange])

  const currentPreset = PRESETS.find((p) => p.id === selectedPreset)
  const currentRange  = currentPreset ? currentPreset.getRange() : { start: "", end: "" }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Custom date picker */}
      <BillingDatePicker
        startDate={currentRange.start}
        endDate={currentRange.end}
        onChange={handleCustomRange}
      />

      {/* Divider */}
      <div className="h-4 w-px" style={{ background: "var(--lc-border)" }} />

      {/* Preset chips */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className="px-2.5 py-1 text-[12px] font-semibold rounded-full transition-all duration-150 cursor-pointer whitespace-nowrap"
            style={selectedPreset === preset.id
              ? { background: "rgba(201,168,124,0.15)", color: "#c9a87c", border: "1px solid rgba(201,168,124,0.28)" }
              : { color: "var(--lc-text-label)", border: "1px solid transparent" }
            }
            onMouseEnter={e => {
              if (selectedPreset !== preset.id) (e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)"
            }}
            onMouseLeave={e => {
              if (selectedPreset !== preset.id) (e.currentTarget as HTMLElement).style.color = "var(--lc-text-label)"
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
}
