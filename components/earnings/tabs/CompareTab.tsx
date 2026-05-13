"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns"
import { useEarningsSummary } from "@/lib/hooks/use-earnings"
import { ComparisonDelta } from "../compare/ComparisonDelta"

interface CompareTabProps { startDate: string; endDate: string }

const MONTH_OPTIONS = [
  { label: "This Month",           getValue: () => { const n = new Date(); return { start: format(startOfMonth(n), "yyyy-MM-dd"), end: format(endOfMonth(n), "yyyy-MM-dd") } } },
  { label: "Last Month",           getValue: () => { const l = subMonths(new Date(), 1); return { start: format(startOfMonth(l), "yyyy-MM-dd"), end: format(endOfMonth(l), "yyyy-MM-dd") } } },
  { label: "2 Months Ago",         getValue: () => { const a = subMonths(new Date(), 2); return { start: format(startOfMonth(a), "yyyy-MM-dd"), end: format(endOfMonth(a), "yyyy-MM-dd") } } },
  { label: "3 Months Ago",         getValue: () => { const a = subMonths(new Date(), 3); return { start: format(startOfMonth(a), "yyyy-MM-dd"), end: format(endOfMonth(a), "yyyy-MM-dd") } } },
  { label: "Last Year (Same Month)", getValue: () => { const a = subMonths(new Date(), 12); return { start: format(startOfMonth(a), "yyyy-MM-dd"), end: format(endOfMonth(a), "yyyy-MM-dd") } } },
]

const darkSelect: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "rgba(255,255,255,0.80)",
  borderRadius: "10px",
  padding: "8px 12px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
}

export function CompareTab({ startDate, endDate }: CompareTabProps) {
  const [period1, setPeriod1] = useState("this")
  const [period2, setPeriod2] = useState("last")

  const getRange = (key: string) =>
    MONTH_OPTIONS.find((o) => o.label.toLowerCase().startsWith(key))?.getValue() ?? MONTH_OPTIONS[0].getValue()

  const p1Range = getRange(period1)
  const p2Range = getRange(period2)

  const { data: p1Data } = useEarningsSummary(p1Range.start, p1Range.end)
  const { data: p2Data } = useEarningsSummary(p2Range.start, p2Range.end)

  if (!p1Data || !p2Data) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
        <div className="grid grid-cols-2 gap-4">
          {[0,1,2,3].map(i => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />)}
        </div>
      </div>
    )
  }

  const fmtK = (v: number) => `$${(v / 1000).toFixed(1)}k`

  return (
    <div className="space-y-4">
      {/* Period selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Period 1", value: period1, onChange: setPeriod1 },
          { label: "Period 2", value: period2, onChange: setPeriod2 },
        ].map(({ label, value, onChange }) => (
          <div
            key={label}
            className="rounded-2xl p-5"
            style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(200,212,228,0.38)", letterSpacing: "0.14em" }}>
              {label}
            </p>
            <div className="relative">
              <select value={value} onChange={(e) => onChange(e.target.value)} style={darkSelect}>
                {MONTH_OPTIONS.map((opt) => (
                  <option
                    key={opt.label}
                    value={opt.label.toLowerCase().split(" ")[0]}
                    style={{ background: "#0d1526", color: "rgba(255,255,255,0.80)" }}
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] mt-2" style={{ color: "rgba(200,212,228,0.35)" }}>
              {getRange(value).start} → {getRange(value).end}
            </p>
          </div>
        ))}
      </div>

      {/* Delta cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonDelta label="Total Revenue"    period1Value={p1Data.metrics.totalRevenue}    period2Value={p2Data.metrics.totalRevenue} />
        <ComparisonDelta label="Collected Revenue" period1Value={p1Data.metrics.collectedRevenue} period2Value={p2Data.metrics.collectedRevenue} />
        <ComparisonDelta label="Total Expenses"   period1Value={p1Data.metrics.totalExpenses}   period2Value={p2Data.metrics.totalExpenses}  isExpense />
        <ComparisonDelta label="Net Profit"
          period1Value={p1Data.metrics.totalRevenue - p1Data.metrics.totalExpenses}
          period2Value={p2Data.metrics.totalRevenue - p2Data.metrics.totalExpenses}
        />
      </div>

      {/* Breakdown */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-5" style={{ color: "rgba(200,212,228,0.38)", letterSpacing: "0.14em" }}>
          Breakdown
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { label: MONTH_OPTIONS.find(o => o.label.toLowerCase().startsWith(period1))?.label ?? "Period 1", data: p1Data },
            { label: MONTH_OPTIONS.find(o => o.label.toLowerCase().startsWith(period2))?.label ?? "Period 2", data: p2Data },
          ].map(({ label, data }) => {
            const profit = data.metrics.totalRevenue - data.metrics.totalExpenses
            return (
              <div key={label}>
                <p className="text-[13px] font-semibold mb-3" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</p>
                <div className="space-y-2.5 text-[13px]">
                  {[
                    { key: "Revenue",  value: data.metrics.totalRevenue,  color: "rgba(52,211,153,0.90)" },
                    { key: "Expenses", value: data.metrics.totalExpenses, color: "rgba(248,113,113,0.80)" },
                  ].map(({ key, value, color }) => (
                    <div key={key} className="flex justify-between items-center">
                      <span style={{ color: "rgba(200,212,228,0.55)" }}>{key}</span>
                      <span className="font-semibold tabular-nums" style={{ color }}>{fmtK(value)}</span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between items-center pt-2.5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="font-semibold" style={{ color: "rgba(200,212,228,0.70)" }}>Profit</span>
                    <span
                      className="font-bold tabular-nums"
                      style={{ color: profit >= 0 ? "rgba(52,211,153,0.90)" : "rgba(248,113,113,0.90)" }}
                    >
                      {profit < 0 ? "-" : ""}${Math.abs(profit).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
