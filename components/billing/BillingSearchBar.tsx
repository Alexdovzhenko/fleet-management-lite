"use client"

import { Search, X } from "lucide-react"

interface BillingSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function BillingSearchBar({ value, onChange }: BillingSearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        style={{ color: "var(--lc-text-muted)" }}
      />
      <input
        type="text"
        placeholder="Search invoices…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-8.5 pr-8 w-full text-[13px] rounded-xl outline-none transition-all duration-200 font-medium"
        style={{
          background: "var(--lc-bg-glass)",
          border: "1px solid var(--lc-bg-glass-hover)",
          color: "var(--lc-text-primary)",
        }}
        onFocus={(e) => {
          e.target.style.border = "1px solid rgba(201,168,124,0.40)"
          e.target.style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
        }}
        onBlur={(e) => {
          e.target.style.border = "1px solid var(--lc-bg-glass-hover)"
          e.target.style.boxShadow = "none"
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: "var(--lc-text-muted)" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--lc-text-muted)"}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
