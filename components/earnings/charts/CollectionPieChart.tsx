"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

function fmtAmt(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { fill: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div
      className="px-3.5 py-2.5 rounded-xl"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)", boxShadow: "0 12px 32px rgba(0,0,0,0.60)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.payload.fill }} />
        <p className="text-[11px] font-medium" style={{ color: "var(--lc-text-dim)" }}>{item.name}</p>
      </div>
      <p className="text-[15px] font-bold tabular-nums" style={{ color: "var(--lc-text-primary)" }}>{fmtAmt(item.value)}</p>
    </div>
  )
}

export function CollectionPieChart({ data }: { data: { collected: number; uncollected: number } }) {
  const total = data.collected + data.uncollected

  if (total === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col items-center justify-center h-[240px]"
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--lc-text-muted)" }}>No invoice data for this period</p>
      </div>
    )
  }

  const collectedPct = Math.round((data.collected / total) * 100)
  const chartData = [
    { name: "Collected", value: Math.round(data.collected),   fill: "#c9a87c" },
    { name: "Pending",   value: Math.round(data.uncollected), fill: "#fbbf24" },
  ]

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.14em" }}>
        Collection Status
      </p>

      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={62} outerRadius={80}
              startAngle={90} endAngle={-270}
              paddingAngle={data.uncollected > 0 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[30px] font-bold tabular-nums tracking-tight leading-none" style={{ color: "#c9a87c" }}>
              {collectedPct}%
            </p>
            <p className="text-[11px] font-medium mt-1" style={{ color: "var(--lc-text-label)" }}>collected</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-4" style={{ borderTop: "1px solid var(--lc-bg-glass)" }}>
        {[
          { label: "Collected", value: data.collected,   dot: "#c9a87c" },
          { label: "Pending",   value: data.uncollected, dot: "#fbbf24" },
        ].map(({ label, value, dot }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} />
            <div>
              <p className="text-[10px] leading-none mb-1.5" style={{ color: "var(--lc-text-muted)" }}>{label}</p>
              <p className="text-[15px] font-bold tabular-nums leading-none" style={{ color: "var(--lc-text-primary)" }}>
                {fmtAmt(value)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
