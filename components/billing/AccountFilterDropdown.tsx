"use client"

import { useState } from "react"
import { ChevronDown, Check } from "lucide-react"

interface Account {
  id: string
  name: string
  type: "CUSTOMER" | "AFFILIATE"
}

interface AccountFilterDropdownProps {
  accounts: Account[]
  value: string | null
  onChange: (value: string | null) => void
  isLoading?: boolean
}

export function AccountFilterDropdown({ accounts, value, onChange, isLoading }: AccountFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const customers  = accounts.filter((a) => a.type === "CUSTOMER")
  const affiliates = accounts.filter((a) => a.type === "AFFILIATE")
  const selectedLabel = accounts.find((a) => a.id === value)?.name || "All Accounts"
  const isActive = !!value

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        style={isActive
          ? { background: "rgba(201,168,124,0.15)", border: "1px solid rgba(201,168,124,0.30)", color: "#c9a87c" }
          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(200,212,228,0.70)" }
        }
      >
        <span className="max-w-[120px] truncate">{selectedLabel}</span>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full mt-1.5 left-0 z-20 rounded-xl overflow-hidden py-1 min-w-[180px]"
            style={{
              background: "#0d1526",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.60)",
            }}
          >
            {/* All Accounts */}
            <button
              onClick={() => { onChange(null); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
              style={{ color: "rgba(255,255,255,0.80)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              All Accounts
              {!value && <Check className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />}
            </button>

            {/* Customers */}
            {customers.length > 0 && (
              <>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(200,212,228,0.55)", letterSpacing: "0.14em", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "2px", paddingTop: "8px" }}
                >
                  Customers
                </div>
                {customers.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { onChange(a.id); setIsOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
                    style={{ color: value === a.id ? "#c9a87c" : "rgba(255,255,255,0.72)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <span className="truncate max-w-[160px]">{a.name}</span>
                    {value === a.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#c9a87c" }} />}
                  </button>
                ))}
              </>
            )}

            {/* Affiliates */}
            {affiliates.length > 0 && (
              <>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(200,212,228,0.55)", letterSpacing: "0.14em", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "2px", paddingTop: "8px" }}
                >
                  Affiliates
                </div>
                {affiliates.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { onChange(a.id); setIsOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
                    style={{ color: value === a.id ? "#c9a87c" : "rgba(255,255,255,0.72)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <span className="truncate max-w-[160px]">{a.name}</span>
                    {value === a.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#c9a87c" }} />}
                  </button>
                ))}
              </>
            )}

            {customers.length === 0 && affiliates.length === 0 && (
              <div className="px-4 py-3 text-[13px] text-center" style={{ color: "rgba(200,212,228,0.65)" }}>
                No accounts available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
