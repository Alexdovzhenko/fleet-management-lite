"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh",
  "Belarus", "Belgium", "Bolivia", "Bosnia and Herzegovina", "Brazil",
  "Bulgaria", "Cambodia", "Canada", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Estonia", "Ethiopia", "Finland", "France",
  "Germany", "Ghana", "Greece", "Guatemala", "Honduras",
  "Hong Kong", "Hungary", "Iceland", "India", "Indonesia",
  "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania",
  "Luxembourg", "Malaysia", "Mexico", "Morocco", "Netherlands",
  "New Zealand", "Nicaragua", "Nigeria", "Norway", "Oman",
  "Pakistan", "Panama", "Paraguay", "Peru", "Philippines",
  "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Saudi Arabia", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland",
  "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Venezuela", "Vietnam", "Yemen",
]

interface CountryComboboxProps {
  value?: string
  onChange: (value: string) => void
  id?: string
}

export function CountryCombobox({ value = "", onChange, id }: CountryComboboxProps) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)

  const filtered = query.length > 0
    ? COUNTRIES.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(v.length > 0)
  }

  function handleSelect(country: string) {
    setQuery(country)
    onChange(country)
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
        placeholder="United States"
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-md overflow-hidden">
          {filtered.map(country => (
            <button
              key={country}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(country)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
            >
              {country}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
