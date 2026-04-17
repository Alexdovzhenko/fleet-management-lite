"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns"
import { useEarningsSummary } from "@/lib/hooks/use-earnings"
import { ComparisonDelta } from "../compare/ComparisonDelta"

interface CompareTabProps {
  startDate: string
  endDate: string
}

const MONTH_OPTIONS = [
  { label: "This Month", getValue: () => {
    const now = new Date()
    return {
      start: format(startOfMonth(now), "yyyy-MM-dd"),
      end: format(endOfMonth(now), "yyyy-MM-dd"),
    }
  }},
  { label: "Last Month", getValue: () => {
    const last = subMonths(new Date(), 1)
    return {
      start: format(startOfMonth(last), "yyyy-MM-dd"),
      end: format(endOfMonth(last), "yyyy-MM-dd"),
    }
  }},
  { label: "2 Months Ago", getValue: () => {
    const ago = subMonths(new Date(), 2)
    return {
      start: format(startOfMonth(ago), "yyyy-MM-dd"),
      end: format(endOfMonth(ago), "yyyy-MM-dd"),
    }
  }},
  { label: "3 Months Ago", getValue: () => {
    const ago = subMonths(new Date(), 3)
    return {
      start: format(startOfMonth(ago), "yyyy-MM-dd"),
      end: format(endOfMonth(ago), "yyyy-MM-dd"),
    }
  }},
  { label: "Last Year (Same Month)", getValue: () => {
    const lastYear = subMonths(new Date(), 12)
    return {
      start: format(startOfMonth(lastYear), "yyyy-MM-dd"),
      end: format(endOfMonth(lastYear), "yyyy-MM-dd"),
    }
  }},
]

export function CompareTab({ startDate, endDate }: CompareTabProps) {
  const [period1, setPeriod1] = useState<string>("this-month")
  const [period2, setPeriod2] = useState<string>("last-month")

  const period1Range = MONTH_OPTIONS.find((o) => o.label.toLowerCase().includes(period1.split("-")[0]))?.getValue() || MONTH_OPTIONS[0].getValue()
  const period2Range = MONTH_OPTIONS.find((o) => o.label.toLowerCase().includes(period2.split("-")[0]))?.getValue() || MONTH_OPTIONS[1].getValue()

  const { data: period1Data } = useEarningsSummary(
    period1Range.start,
    period1Range.end
  )
  const { data: period2Data } = useEarningsSummary(
    period2Range.start,
    period2Range.end
  )

  if (!period1Data || !period2Data) {
    return <div className="h-96 bg-white/70 rounded-2xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      {/* Period Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Period 1
          </label>
          <select
            value={period1}
            onChange={(e) => setPeriod1(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.label.toLowerCase().split(" ")[0]}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            {period1Range.start} to {period1Range.end}
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Period 2
          </label>
          <select
            value={period2}
            onChange={(e) => setPeriod2(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.label.toLowerCase().split(" ")[0]}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-2">
            {period2Range.start} to {period2Range.end}
          </p>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ComparisonDelta
          label="Total Revenue"
          period1Value={period1Data.metrics.totalRevenue}
          period2Value={period2Data.metrics.totalRevenue}
        />
        <ComparisonDelta
          label="Collected Revenue"
          period1Value={period1Data.metrics.collectedRevenue}
          period2Value={period2Data.metrics.collectedRevenue}
        />
        <ComparisonDelta
          label="Total Expenses"
          period1Value={period1Data.metrics.totalExpenses}
          period2Value={period2Data.metrics.totalExpenses}
          isExpense
        />
        <ComparisonDelta
          label="Net Profit"
          period1Value={
            period1Data.metrics.totalRevenue - period1Data.metrics.totalExpenses
          }
          period2Value={
            period2Data.metrics.totalRevenue - period2Data.metrics.totalExpenses
          }
        />
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Period 1 */}
          <div>
            <p className="font-medium text-slate-900 mb-3">
              {MONTH_OPTIONS.find((o) => o.label.toLowerCase().includes(period1.split("-")[0]))?.label}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Revenue:</span>
                <span className="font-semibold text-slate-900">
                  ${period1Data.metrics.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expenses:</span>
                <span className="font-semibold text-slate-900">
                  ${period1Data.metrics.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Profit:</span>
                <span className="font-bold text-emerald-600">
                  ${(period1Data.metrics.totalRevenue - period1Data.metrics.totalExpenses).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Period 2 */}
          <div>
            <p className="font-medium text-slate-900 mb-3">
              {MONTH_OPTIONS.find((o) => o.label.toLowerCase().includes(period2.split("-")[0]))?.label}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Revenue:</span>
                <span className="font-semibold text-slate-900">
                  ${period2Data.metrics.totalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Expenses:</span>
                <span className="font-semibold text-slate-900">
                  ${period2Data.metrics.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Profit:</span>
                <span className="font-bold text-emerald-600">
                  ${(period2Data.metrics.totalRevenue - period2Data.metrics.totalExpenses).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
