"use client"

import { Search, X } from "lucide-react"

interface BillingSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function BillingSearchBar({ value, onChange }: BillingSearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Search by client name or reservation #"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
