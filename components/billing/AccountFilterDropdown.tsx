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

export function AccountFilterDropdown({
  accounts,
  value,
  onChange,
  isLoading,
}: AccountFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const customers = accounts.filter((a) => a.type === "CUSTOMER")
  const affiliates = accounts.filter((a) => a.type === "AFFILIATE")

  const selectedLabel =
    accounts.find((a) => a.id === value)?.name || "All Accounts"

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:border-slate-300 transition-colors disabled:opacity-50"
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 z-10 bg-white border border-slate-200 rounded-lg shadow-lg">
          {/* All Accounts option */}
          <button
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between border-b border-slate-100"
          >
            All Accounts
            {!value && <Check className="w-4 h-4 text-blue-600" />}
          </button>

          {/* Customers section */}
          {customers.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs uppercase font-semibold text-slate-500 bg-slate-50">
                Customers
              </div>
              {customers.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    onChange(account.id)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  {account.name}
                  {value === account.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </>
          )}

          {/* Affiliates section */}
          {affiliates.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs uppercase font-semibold text-slate-500 bg-slate-50">
                Affiliates
              </div>
              {affiliates.map((account) => (
                <button
                  key={account.id}
                  onClick={() => {
                    onChange(account.id)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                >
                  {account.name}
                  {value === account.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </>
          )}

          {customers.length === 0 && affiliates.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500 text-center">
              No accounts available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
