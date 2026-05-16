"use client"

import { motion } from "framer-motion"

function fmtAmt(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

export function ExpenseBreakdownChart({ data }: { data: { fixed: number; variable: number } }) {
  const total       = data.fixed + data.variable
  const fixedPct    = total > 0 ? Math.round((data.fixed / total) * 100) : 0
  const variablePct = 100 - fixedPct

  if (total === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center h-[240px]"
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--lc-text-muted)" }}>No expenses recorded</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.14em" }}>
        Expense Breakdown
      </p>

      <p className="text-[28px] font-bold tabular-nums tracking-tight leading-none" style={{ color: "var(--lc-text-primary)" }}>
        {fmtAmt(total)}
      </p>
      <p className="text-[12px] mt-1.5 mb-6" style={{ color: "var(--lc-text-muted)" }}>total expenses</p>

      {/* Stacked bar */}
      <div className="h-3 rounded-full flex overflow-hidden mb-5" style={{ background: "var(--lc-bg-glass)" }}>
        {data.fixed > 0 && (
          <motion.div
            className="h-full"
            style={{ width: `${fixedPct}%`, background: "#f87171" }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1] }}
          />
        )}
        {data.variable > 0 && (
          <motion.div
            className="h-full"
            style={{ width: `${variablePct}%`, background: "#fbbf24" }}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.85, ease: [0.25, 0.1, 0.25, 1], delay: 0.14 }}
          />
        )}
      </div>

      {/* Legend rows */}
      <div className="space-y-3 pt-4" style={{ borderTop: "1px solid var(--lc-bg-glass)" }}>
        {[
          { label: "Fixed",    value: data.fixed,    pct: fixedPct,    dot: "#f87171" },
          { label: "Variable", value: data.variable, pct: variablePct, dot: "#fbbf24" },
        ].map(({ label, value, pct, dot }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
              <p className="text-[13px] font-medium" style={{ color: "var(--lc-text-secondary)" }}>{label}</p>
            </div>
            <div className="text-right">
              <span className="text-[14px] font-bold tabular-nums" style={{ color: "var(--lc-text-primary)" }}>{fmtAmt(value)}</span>
              <span className="text-[11px] ml-2" style={{ color: "var(--lc-text-muted)" }}>{pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
