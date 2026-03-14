"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import {
  format, parse, isValid, isToday, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval,
} from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function MiniCalendar({ selected, onSelect }: { selected: Date | undefined; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date())

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(viewMonth)),
    end:   endOfWeek(endOfMonth(viewMonth)),
  })

  return (
    <div className="p-3 w-[256px] select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(subMonths(viewMonth, 1)) }}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); setViewMonth(addMonths(viewMonth, 1)) }}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-7 flex items-center justify-center text-[11px] font-medium text-gray-400">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const inMonth     = isSameMonth(day, viewMonth)
          const isSelected  = selected ? isSameDay(day, selected) : false
          const isTodayDate = isToday(day)

          return (
            <button
              key={day.toISOString()}
              type="button"
              // Use onMouseDown + preventDefault so the input never loses focus
              onMouseDown={(e) => { e.preventDefault(); onSelect(day) }}
              className={cn(
                "h-8 w-full flex items-center justify-center text-sm rounded-md transition-colors",
                !inMonth && "text-gray-300 hover:bg-gray-50",
                inMonth && !isSelected && !isTodayDate && "text-gray-700 hover:bg-gray-100",
                isTodayDate && !isSelected && "text-blue-600 font-semibold hover:bg-blue-50",
                isSelected && "bg-[#2563EB] text-white hover:bg-blue-700 font-medium",
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DatePickerInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  hasError?: boolean
}

export function DatePickerInput({ value, onChange, placeholder = "MM/DD/YYYY", className, hasError }: DatePickerInputProps) {
  const [open, setOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = (() => {
    if (!value) return undefined
    const d = parse(value, "MM/dd/yyyy", new Date())
    return isValid(d) ? d : undefined
  })()

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  function openCalendar() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPopupStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 9999,
      })
    }
    setOpen(true)
  }

  function handleSelect(date: Date) {
    onChange(format(date, "MM/dd/yyyy"))
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={openCalendar}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("h-9 text-sm pr-9", hasError && "border-red-400", className)}
      />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); open ? setOpen(false) : openCalendar() }}
        className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors rounded-r-lg"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {open && createPortal(
        <div style={popupStyle} className="bg-white rounded-xl shadow-lg border border-gray-100">
          <MiniCalendar selected={selectedDate} onSelect={handleSelect} />
        </div>,
        document.body
      )}
    </div>
  )
}
