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
    <div className="flex gap-0">
      <button
        onClick={() => onTabChange("OPEN")}
        className={`relative px-0 py-3 text-sm font-semibold transition-colors duration-200 ${
          activeTab === "OPEN"
            ? "text-slate-900"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Open</span>
          {openCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {openCount}
            </span>
          )}
        </div>

        {/* Animated underline */}
        {activeTab === "OPEN" && (
          <motion.div
            layoutId="active-tab-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>

      <button
        onClick={() => onTabChange("SETTLED")}
        className={`relative px-0 py-3 ml-6 text-sm font-semibold transition-colors duration-200 ${
          activeTab === "SETTLED"
            ? "text-slate-900"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>Settled</span>
          {settledCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
              {settledCount}
            </span>
          )}
        </div>

        {/* Animated underline */}
        {activeTab === "SETTLED" && (
          <motion.div
            layoutId="active-tab-indicator"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-full"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </button>
    </div>
  )
}
