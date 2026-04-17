"use client"

import { Search, X } from "lucide-react"

interface BillingSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function BillingSearchBar({ value, onChange }: BillingSearchBarProps) {
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        placeholder="Search invoices..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-10 py-3 text-base rounded-xl bg-white border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 hover:border-slate-300 transition-all duration-150"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 active:scale-90 transition-all duration-150 p-1"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
