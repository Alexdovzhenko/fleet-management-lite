"use client"

import { motion } from "framer-motion"

interface InvoiceTabsProps {
  activeTab: "OPEN" | "SETTLED"
  onTabChange: (tab: "OPEN" | "SETTLED") => void
  openCount: number
  settledCount: number
}

export function InvoiceTabs({
  activeTab,
  onTabChange,
  openCount,
  settledCount,
}: InvoiceTabsProps) {
  return (
    <div className="flex gap-2 bg-slate-100 rounded-lg p-1 w-fit">
      <button
        onClick={() => onTabChange("OPEN")}
        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === "OPEN"
            ? "text-slate-900"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Opened {openCount > 0 && <span className="text-xs ml-1">({openCount})</span>}
        {activeTab === "OPEN" && (
          <motion.div
            layoutId="active-tab"
            className="absolute inset-0 bg-white rounded-md -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        )}
      </button>

      <button
        onClick={() => onTabChange("SETTLED")}
        className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeTab === "SETTLED"
            ? "text-slate-900"
            : "text-slate-600 hover:text-slate-900"
        }`}
      >
        Settled {settledCount > 0 && <span className="text-xs ml-1">({settledCount})</span>}
        {activeTab === "SETTLED" && (
          <motion.div
            layoutId="active-tab"
            className="absolute inset-0 bg-white rounded-md -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
          />
        )}
      </button>
    </div>
  )
}
