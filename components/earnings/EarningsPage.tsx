"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEarningsSummary, useEarningsBreakdown } from "@/lib/hooks/use-earnings"
import { format, subDays } from "date-fns"
import { MetricCard } from "./MetricCard"
import { TimeRangeSelector } from "./TimeRangeSelector"
import { OverviewTab } from "./tabs/OverviewTab"
import { ExpensesTab } from "./tabs/ExpensesTab"
import { FleetTab } from "./tabs/FleetTab"
import { CompareTab } from "./tabs/CompareTab"

export function EarningsPage() {
  // Initialize with last 7 days
  const now = new Date()
  const defaultStart = format(subDays(now, 6), "yyyy-MM-dd")
  const defaultEnd = format(now, "yyyy-MM-dd")

  const [startDate, setStartDate] = useState<string>(defaultStart)
  const [endDate, setEndDate] = useState<string>(defaultEnd)
  const [activeTab, setActiveTab] = useState<"overview" | "expenses" | "fleet" | "compare">("overview")

  const { data: summary, isLoading: summaryLoading } = useEarningsSummary(startDate, endDate)
  const { data: breakdown, isLoading: breakdownLoading } = useEarningsBreakdown(
    activeTab,
    startDate,
    endDate
  )

  const handleRangeChange = (start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "expenses", label: "Expenses" },
    { id: "fleet", label: "Fleet" },
    { id: "compare", label: "Compare" },
  ] as const

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Earnings</h1>
            <p className="text-sm text-slate-500 mt-1">Manage revenue, expenses, and fleet performance</p>
          </div>

          {/* Summary Cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2,
                },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <MetricCard
                icon="💰"
                label="Total Revenue"
                value={summary?.metrics.totalRevenue ?? 0}
                trend={summary?.deltas.revenue}
                isLoading={summaryLoading}
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <MetricCard
                icon="✅"
                label="Collected"
                value={summary?.metrics.collectedRevenue ?? 0}
                isLoading={summaryLoading}
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <MetricCard
                icon="⏳"
                label="Pending"
                value={summary?.metrics.uncollectedRevenue ?? 0}
                isLoading={summaryLoading}
              />
            </motion.div>
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.4 }}
            >
              <MetricCard
                icon="📉"
                label="Total Expenses"
                value={summary?.metrics.totalExpenses ?? 0}
                trend={summary?.deltas.expenses}
                isLoading={summaryLoading}
              />
            </motion.div>
          </motion.div>

          {/* Time Range Selector */}
          <TimeRangeSelector onRangeChange={handleRangeChange} />

          {/* Tabs */}
          <div className="border-b border-slate-200/50">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-1 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === "overview" && (
                <OverviewTab data={breakdown} isLoading={breakdownLoading} />
              )}
              {activeTab === "expenses" && (
                <ExpensesTab data={breakdown} isLoading={breakdownLoading} startDate={startDate} endDate={endDate} />
              )}
              {activeTab === "fleet" && (
                <FleetTab data={breakdown} isLoading={breakdownLoading} />
              )}
              {activeTab === "compare" && (
                <CompareTab startDate={startDate} endDate={endDate} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
