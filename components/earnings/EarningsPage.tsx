"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useEarningsSummary, useEarningsBreakdown } from "@/lib/hooks/use-earnings"
import { format, subDays } from "date-fns"
import { MetricCard } from "./MetricCard"
import { TimeRangeSelector } from "./TimeRangeSelector"
import { OverviewTab } from "./tabs/OverviewTab"
import { ExpensesTab } from "./tabs/ExpensesTab"
import { FleetTab } from "./tabs/FleetTab"
import { CompareTab } from "./tabs/CompareTab"
import { TrendingUp } from "lucide-react"

const TABS = [
  { id: "overview",  label: "Overview"  },
  { id: "expenses",  label: "Expenses"  },
  { id: "fleet",     label: "Fleet"     },
  { id: "compare",   label: "Compare"   },
] as const

type TabId = (typeof TABS)[number]["id"]

export function EarningsPage() {
  const now = new Date()
  const [startDate, setStartDate] = useState(format(subDays(now, 6), "yyyy-MM-dd"))
  const [endDate,   setEndDate]   = useState(format(now, "yyyy-MM-dd"))
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [pill, setPill] = useState({ x: 0, width: 0, ready: false })

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab)
    const el = tabRefs.current[idx]
    if (el) setPill({ x: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [activeTab])

  const { data: summary, isLoading: summaryLoading } = useEarningsSummary(startDate, endDate)
  const { data: breakdown, isLoading: breakdownLoading } = useEarningsBreakdown(activeTab, startDate, endDate)

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start); setEndDate(end)
  }, [])

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v)

  const metrics = [
    { type: "revenue"   as const, label: "Total Revenue",   value: summary?.metrics.totalRevenue      ?? 0, trend: summary?.deltas.revenue  },
    { type: "collected" as const, label: "Collected",        value: summary?.metrics.collectedRevenue  ?? 0, trend: undefined },
    { type: "pending"   as const, label: "Pending",          value: summary?.metrics.uncollectedRevenue ?? 0, trend: undefined },
    { type: "expenses"  as const, label: "Total Expenses",   value: summary?.metrics.totalExpenses     ?? 0, trend: summary?.deltas.expenses },
  ]

  return (
    <>
      {/* Dark backdrop behind dock nav */}
      <div
        className="fixed bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "#080c16", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "#080c16", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-6xl mx-auto space-y-4">

          {/* ── Header card ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            {/* Title row */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 flex-wrap gap-y-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <TrendingUp className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Earnings
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em" }}>
                    {summaryLoading ? "Loading…" : `${fmtCurrency(summary?.metrics.totalRevenue ?? 0)} revenue · ${fmtCurrency(summary?.metrics.totalExpenses ?? 0)} expenses`}
                  </p>
                </div>
              </div>

              {/* Time range selector */}
              <TimeRangeSelector onRangeChange={handleRangeChange} />
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              {metrics.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.05 }}
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
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Tab bar */}
            <div className="px-3 py-1">
              <div className="relative flex items-center">
                {/* Sliding pill background */}
                {pill.ready && (
                  <div
                    className="absolute inset-y-1 rounded-[10px] pointer-events-none"
                    style={{
                      left: pill.x,
                      width: pill.width,
                      background: "rgba(201,168,124,0.11)",
                      border: "1px solid rgba(201,168,124,0.22)",
                      transition: "left 0.25s cubic-bezier(0.23,1,0.32,1), width 0.25s cubic-bezier(0.23,1,0.32,1)",
                    }}
                  />
                )}
                {TABS.map((tab, i) => (
                  <button
                    key={tab.id}
                    ref={(el) => { tabRefs.current[i] = el }}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative z-10 px-4 py-2.5 text-[13px] font-semibold transition-colors duration-150 cursor-pointer whitespace-nowrap select-none"
                    style={activeTab === tab.id ? { color: "#c9a87c" } : { color: "rgba(200,212,228,0.50)" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Tab content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {activeTab === "overview"  && <OverviewTab  data={breakdown} isLoading={breakdownLoading} />}
              {activeTab === "expenses"  && <ExpensesTab  data={breakdown} isLoading={breakdownLoading} startDate={startDate} endDate={endDate} />}
              {activeTab === "fleet"     && <FleetTab     data={breakdown} isLoading={breakdownLoading} />}
              {activeTab === "compare"   && <CompareTab   startDate={startDate} endDate={endDate} />}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </>
  )
}
