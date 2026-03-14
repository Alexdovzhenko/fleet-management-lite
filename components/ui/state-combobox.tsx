"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

const STATES = [
  // US States
  { abbr: "AL", name: "Alabama" },
  { abbr: "AK", name: "Alaska" },
  { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" },
  { abbr: "CA", name: "California" },
  { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" },
  { abbr: "DE", name: "Delaware" },
  { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" },
  { abbr: "HI", name: "Hawaii" },
  { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" },
  { abbr: "IN", name: "Indiana" },
  { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" },
  { abbr: "KY", name: "Kentucky" },
  { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" },
  { abbr: "MD", name: "Maryland" },
  { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" },
  { abbr: "MN", name: "Minnesota" },
  { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" },
  { abbr: "MT", name: "Montana" },
  { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" },
  { abbr: "NH", name: "New Hampshire" },
  { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" },
  { abbr: "NY", name: "New York" },
  { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" },
  { abbr: "OH", name: "Ohio" },
  { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" },
  { abbr: "PA", name: "Pennsylvania" },
  { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" },
  { abbr: "SD", name: "South Dakota" },
  { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" },
  { abbr: "UT", name: "Utah" },
  { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" },
  { abbr: "WA", name: "Washington" },
  { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" },
  { abbr: "WY", name: "Wyoming" },
  { abbr: "DC", name: "District of Columbia" },
  // US Territories
  { abbr: "PR", name: "Puerto Rico" },
  { abbr: "VI", name: "U.S. Virgin Islands" },
  { abbr: "GU", name: "Guam" },
  // Canadian Provinces
  { abbr: "AB", name: "Alberta" },
  { abbr: "BC", name: "British Columbia" },
  { abbr: "MB", name: "Manitoba" },
  { abbr: "NB", name: "New Brunswick" },
  { abbr: "NL", name: "Newfoundland and Labrador" },
  { abbr: "NS", name: "Nova Scotia" },
  { abbr: "ON", name: "Ontario" },
  { abbr: "PE", name: "Prince Edward Island" },
  { abbr: "QC", name: "Quebec" },
  { abbr: "SK", name: "Saskatchewan" },
  { abbr: "NT", name: "Northwest Territories" },
  { abbr: "NU", name: "Nunavut" },
  { abbr: "YT", name: "Yukon" },
]

interface StateComboboxProps {
  value?: string
  onChange: (value: string) => void
  id?: string
}

export function StateCombobox({ value = "", onChange, id }: StateComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  const q = query.toLowerCase()
  const filtered = query.length > 0
    ? STATES.filter(s =>
        s.abbr.toLowerCase().startsWith(q) ||
        s.name.toLowerCase().includes(q)
      ).slice(0, 8)
    : []

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(v.length > 0)
  }

  function handleSelect(s: { abbr: string; name: string }) {
    setQuery(s.abbr)
    onChange(s.abbr)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={query}
        onChange={handleInput}
        onFocus={() => query.length > 0 && filtered.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="FL"
        autoComplete="off"
        maxLength={50}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] rounded-md border bg-white shadow-md overflow-hidden">
          {filtered.map(s => (
            <button
              key={s.abbr}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span className="font-mono font-semibold text-gray-700 w-7 flex-shrink-0">{s.abbr}</span>
              <span className="text-gray-500">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
