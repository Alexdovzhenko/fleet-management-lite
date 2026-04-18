"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEarningsSummary, useEarningsBreakdown } from "@/lib/hooks/use-earnings"
import { format, subDays } from "date-fns"
import { MetricCard } from "./MetricCard"
import { TimeRangeSelector } from "./TimeRangeSelector"
import { OverviewTab } from "./tabs/OverviewTab"
import { ExpensesTab } from "./tabs/ExpensesTab"
import { FleetTab } from "./tabs/FleetTab"
import { CompareTab } from "./tabs/CompareTab"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "expenses", label: "Expenses" },
  { id: "fleet", label: "Fleet" },
  { id: "compare", label: "Compare" },
] as const

type TabId = (typeof TABS)[number]["id"]

export function EarningsPage() {
  const now = new Date()
  const defaultStart = format(subDays(now, 6), "yyyy-MM-dd")
  const defaultEnd = format(now, "yyyy-MM-dd")

  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [isScrolled, setIsScrolled] = useState(false)

  const { data: summary, isLoading: summaryLoading } = useEarningsSummary(startDate, endDate)
  const { data: breakdown, isLoading: breakdownLoading } = useEarningsBreakdown(
    activeTab,
    startDate,
    endDate
  )

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }, [])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 72)
  }, [])

  const metrics = [
    {
      type: "revenue" as const,
      label: "Total Revenue",
      value: summary?.metrics.totalRevenue ?? 0,
      trend: summary?.deltas.revenue,
    },
    {
      type: "collected" as const,
      label: "Collected",
      value: summary?.metrics.collectedRevenue ?? 0,
      trend: undefined,
    },
    {
      type: "pending" as const,
      label: "Pending",
      value: summary?.metrics.uncollectedRevenue ?? 0,
      trend: undefined,
    },
    {
      type: "expenses" as const,
      label: "Total Expenses",
      value: summary?.metrics.totalExpenses ?? 0,
      trend: summary?.deltas.expenses,
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl transition-shadow duration-200"
        style={{
          boxShadow: isScrolled
            ? "0 1px 0 0 rgba(0,0,0,0.06), 0 4px 16px 0 rgba(0,0,0,0.04)"
            : "0 1px 0 0 rgba(0,0,0,0.06)",
        }}
      >
        {/* Title row — expands at top, collapses on scroll */}
        <div className="px-6">
          <AnimatePresence initial={false}>
            {!isScrolled ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-5 pb-1">
                  <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
                    Earnings
                  </h1>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    Revenue, expenses &amp; fleet performance
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Controls row: compact title (when scrolled) + time selector */}
          <div className="flex items-center gap-3 py-2">
            <AnimatePresence initial={false}>
              {isScrolled && (
                <motion.span
                  key="compact-title"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="text-[15px] font-semibold text-slate-800 whitespace-nowrap"
                >
                  Earnings
                </motion.span>
              )}
            </AnimatePresence>
            <div className={isScrolled ? "flex-1 flex justify-end" : "w-full"}>
              <TimeRangeSelector onRangeChange={handleRangeChange} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="px-5">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors duration-150 cursor-pointer ${
                  activeTab === tab.id
                    ? "text-emerald-700"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="earnings-tab-pill"
                    className="absolute inset-0 bg-emerald-50 rounded-lg"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
          <div className="h-px bg-slate-100" />
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        {/* Metric cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-6 pt-5 pb-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.06, delayChildren: 0.04 },
            },
          }}
        >
          {metrics.map((card) => (
            <motion.div
              key={card.label}
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <MetricCard
                type={card.type}
                label={card.label}
                value={card.value}
                trend={card.trend}
                isLoading={summaryLoading}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Tab content */}
        <div className="px-6 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {activeTab === "overview" && (
                <OverviewTab data={breakdown} isLoading={breakdownLoading} />
              )}
              {activeTab === "expenses" && (
                <ExpensesTab
                  data={breakdown}
                  isLoading={breakdownLoading}
                  startDate={startDate}
                  endDate={endDate}
                />
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
