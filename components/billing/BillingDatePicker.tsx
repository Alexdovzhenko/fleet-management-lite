"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay, isWithinInterval } from "date-fns"

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
    if (selectionMode === "start") {
      setSelectedStart(day)
      setSelectionMode("end")
      // If end date is before start date, clear it
      if (selectedEnd && day > selectedEnd) {
        setSelectedEnd(null)
      }
    } else {
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
    const baseClasses = "w-8 h-8 rounded text-sm flex items-center justify-center cursor-pointer transition-colors"

    const isStart = selectedStart && isSameDay(day, selectedStart)
    const isEnd = selectedEnd && isSameDay(day, selectedEnd)
    const isInRange =
      selectedStart &&
      selectedEnd &&
      isWithinInterval(day, {
        start: selectedStart,
        end: selectedEnd,
      })

    if (isStart || isEnd) {
      return `${baseClasses} bg-blue-600 text-white font-medium`
    } else if (isInRange) {
      return `${baseClasses} bg-blue-100 text-slate-900`
    } else {
      return `${baseClasses} text-slate-700 hover:bg-slate-100`
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
          {/* Mode indicator */}
          <div className="mb-4 flex items-center gap-2">
            <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded">
              {selectionMode === "start" ? "Select start date" : "Select end date"}
            </div>
            {selectedStart && (
              <div className="text-xs text-slate-500">
                Start: {format(selectedStart, "MMM d")}
              </div>
            )}
          </div>

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
