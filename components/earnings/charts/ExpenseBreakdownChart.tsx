"use client"

import { motion } from "framer-motion"

function fmtAmt(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

interface ExpenseBreakdownChartProps {
  data: { fixed: number; variable: number }
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const total = data.fixed + data.variable

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-center h-[240px]">
        <p className="text-[13px] text-slate-400">No expenses recorded</p>
      </div>
    )
  }

  const fixedPct = Math.round((data.fixed / total) * 100)
  const variablePct = 100 - fixedPct

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1], delay: 0.12 }}
      className="bg-white rounded-2xl border border-slate-100 p-5"
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Expense Breakdown
      </p>

      {/* Total */}
      <p className="text-[28px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
        {fmtAmt(total)}
      </p>
      <p className="text-[12px] text-slate-400 mt-1.5 mb-6">total expenses</p>

      {/* Stacked progress bar — clip-path reveal (GPU-accelerated, no layout shift) */}
      <div className="h-3 rounded-full bg-slate-100 flex overflow-hidden mb-5">
        {data.fixed > 0 && (
          <motion.div
            className="h-full bg-rose-500"
            style={{ width: `${fixedPct}%` }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1] }}
          />
        )}
        {data.variable > 0 && (
          <motion.div
            className="h-full bg-amber-400"
            style={{ width: `${variablePct}%` }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1], delay: 0.14 }}
          />
        )}
      </div>

      {/* Legend rows */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <p className="text-[13px] text-slate-600 font-medium">Fixed</p>
          </div>
          <div className="text-right">
            <span className="text-[14px] font-bold text-slate-900 tabular-nums">
              {fmtAmt(data.fixed)}
            </span>
            <span className="text-[11px] text-slate-400 ml-2">{fixedPct}%</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <p className="text-[13px] text-slate-600 font-medium">Variable</p>
          </div>
          <div className="text-right">
            <span className="text-[14px] font-bold text-slate-900 tabular-nums">
              {fmtAmt(data.variable)}
            </span>
            <span className="text-[11px] text-slate-400 ml-2">{variablePct}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
