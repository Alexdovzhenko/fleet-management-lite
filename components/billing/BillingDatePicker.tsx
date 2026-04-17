"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, X, ChevronLeft, ChevronRight, ChevronRight as Arrow } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isWithinInterval, isBefore } from "date-fns"

interface BillingDatePickerProps {
  startDate: string | null
  endDate: string | null
  onChange: (startDate: string | null, endDate: string | null) => void
}

export function BillingDatePicker({ startDate, endDate, onChange }: BillingDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedStart, setSelectedStart] = useState<Date | null>(startDate ? new Date(startDate) : null)
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(endDate ? new Date(endDate) : null)
  const [selectionMode, setSelectionMode] = useState<"start" | "end">("start")
  const [dateMode, setDateMode] = useState<"single" | "range">(endDate && startDate !== endDate ? "range" : "single")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleDayClick = (day: Date) => {
    if (dateMode === "single") {
      // Single date mode: select and close
      setSelectedStart(day)
      setSelectedEnd(day)
      const dateStr = format(day, "yyyy-MM-dd")
      onChange(dateStr, dateStr)
      setIsOpen(false)
      return
    }

    // Range mode logic
    if (selectionMode === "start") {
      setSelectedStart(day)
      setSelectionMode("end")
      // If end date is before start date, clear it
      if (selectedEnd && day > selectedEnd) {
        setSelectedEnd(null)
      }
    } else {
      // In end selection mode, prevent clicking dates before the start date
      if (selectedStart && isBefore(day, selectedStart)) {
        return
      }
      if (day < selectedStart!) {
        // If user clicks a date before start, swap them
        setSelectedEnd(selectedStart)
        setSelectedStart(day)
      } else {
        setSelectedEnd(day)
      }
      // Auto-confirm the range
      handleConfirm()
    }
  }

  const handleConfirm = () => {
    if (selectedStart) {
      const startStr = format(selectedStart, "yyyy-MM-dd")
      const endStr = selectedEnd ? format(selectedEnd, "yyyy-MM-dd") : startStr
      onChange(startStr, endStr)
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedStart(null)
    setSelectedEnd(null)
    setSelectionMode("start")
    onChange(null, null)
  }

  const displayValue =
    selectedStart && selectedEnd && !isSameDay(selectedStart, selectedEnd)
      ? `${format(selectedStart, "MMM d")} - ${format(selectedEnd, "MMM d, yyyy")}`
      : selectedStart
      ? format(selectedStart, "MMM d, yyyy")
      : "Filter by date"

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const getDayClasses = (day: Date) => {
    const baseClasses = "w-8 h-8 rounded text-sm flex items-center justify-center transition-colors"

    const isStart = selectedStart && isSameDay(day, selectedStart)
    const isEnd = selectedEnd && isSameDay(day, selectedEnd)
    const isInRange =
      selectedStart &&
      selectedEnd &&
      isWithinInterval(day, {
        start: selectedStart,
        end: selectedEnd,
      })

    // In step 2, dim dates before the selected start date
    const isBeforeStart = selectedStart && selectionMode === "end" && isBefore(day, selectedStart)

    if (isBeforeStart) {
      return `${baseClasses} text-slate-300 cursor-not-allowed`
    } else if (isStart) {
      return `${baseClasses} bg-blue-600 text-white font-medium cursor-pointer hover:bg-blue-700`
    } else if (isEnd) {
      return `${baseClasses} bg-teal-600 text-white font-medium cursor-pointer hover:bg-teal-700`
    } else if (isInRange) {
      return `${baseClasses} bg-blue-50 text-slate-900 cursor-pointer`
    } else {
      return `${baseClasses} text-slate-700 cursor-pointer hover:bg-slate-100`
    }
  }

  const firstDayOfMonth = startOfMonth(currentMonth).getDay()
  const paddingDays = Array(firstDayOfMonth).fill(null)

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{displayValue}</span>
        {(selectedStart || selectedEnd) && (
          <button
            onClick={handleClear}
            className="ml-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-80">
          {/* Date Mode Selector */}
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                setDateMode("single")
                setSelectionMode("start")
                setSelectedEnd(null)
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateMode === "single"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Single Date
            </button>
            <button
              onClick={() => {
                setDateMode("range")
                setSelectionMode("start")
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateMode === "range"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Progress Indicator (Range mode only) */}
          {dateMode === "range" && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Step {selectionMode === "start" ? "1" : "2"}/2
                </div>
                <div className="text-xs font-medium text-slate-500">
                  {selectionMode === "start" ? "Select Start Date" : "Select End Date"}
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: selectionMode === "start" ? "50%" : "100%" }}
                />
              </div>
            </div>
          )}

          {/* Date Display */}
          {selectedStart && (
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                {dateMode === "single" ? (
                  <span className="text-sm font-semibold text-slate-900">
                    {format(selectedStart, "MMM d, yyyy")}
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-slate-900">
                        {format(selectedStart, "MMM d")}
                      </span>
                      <Arrow className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedEnd ? format(selectedEnd, "MMM d, yyyy") : "End"}
                    </span>
                  </>
                )}
              </div>
              {selectedStart && selectedEnd && dateMode === "range" && (
                <div className="text-xs text-slate-600 mt-2">
                  {Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24))} days selected
                </div>
              )}
            </div>
          )}

          {/* Clear Button */}
          {selectedStart && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedStart(null)
                setSelectedEnd(null)
                setSelectionMode("start")
                onChange(null, null)
              }}
              className="w-full mb-4 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              Clear Selection
            </button>
          )}

          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-slate-100 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-slate-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {paddingDays.map((_, i) => (
              <div key={`padding-${i}`} className="w-8 h-8" />
            ))}
            {monthDays.map((day) => (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={getDayClasses(day)}
              >
                {format(day, "d")}
              </button>
            ))}
          </div>

          {/* Confirmation Summary - Show when range mode with both dates selected */}
          {dateMode === "range" && selectedStart && selectedEnd && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-green-900">Range Selected</span>
              </div>
              <p className="text-sm text-green-800">
                {format(selectedStart, "MMM d")} – {format(selectedEnd, "MMM d, yyyy")}
              </p>
            </div>
          )}

          {/* Quick ranges */}
          <div className="border-t border-slate-200 pt-3 space-y-2">
            <button
              onClick={() => {
                const today = new Date()
                setSelectedStart(today)
                setSelectedEnd(today)
                handleConfirm()
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const lastWeek = new Date(today)
                lastWeek.setDate(today.getDate() - 7)
                setSelectedStart(lastWeek)
                setSelectedEnd(today)
                handleConfirm()
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors"
            >
              Last 7 days
            </button>
            <button
              onClick={() => {
                const today = new Date()
                const lastMonth = new Date(today)
                lastMonth.setDate(today.getDate() - 30)
                setSelectedStart(lastMonth)
                setSelectedEnd(today)
                handleConfirm()
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors"
            >
              Last 30 days
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
