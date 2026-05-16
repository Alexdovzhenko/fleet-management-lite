"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

function fmtAxis(v: number): string {
  if (v >= 10000) return `$${(v / 1000).toFixed(0)}k`
  if (v >= 1000)  return `$${(v / 1000).toFixed(1)}k`
  return `$${v}`
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="px-3.5 py-2.5 rounded-xl min-w-[110px]"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-border)", boxShadow: "0 12px 32px rgba(0,0,0,0.60)" }}
    >
      <p className="text-[11px] font-medium mb-1" style={{ color: "var(--lc-text-label)" }}>{label}</p>
      <p className="text-[15px] font-bold tabular-nums" style={{ color: "#c9a87c" }}>
        ${(payload[0]?.value ?? 0).toLocaleString("en-US")}
      </p>
    </div>
  )
}

export function RevenueTrendChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center h-[280px]"
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
      >
        <p className="text-[13px]" style={{ color: "var(--lc-text-muted)" }}>No revenue data for this period</p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.revenue, 0)
  const peak  = Math.max(...data.map((d) => d.revenue))
  const avg   = data.length > 0 ? total / data.length : 0

  const chartData = data.map((item) => {
    const [year, month, day] = item.date.split("-").map(Number)
    return {
      date: new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.round(item.revenue),
    }
  })

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.14em" }}>
            Revenue Trend
          </p>
          <p className="text-[28px] font-bold tabular-nums tracking-tight leading-none" style={{ color: "var(--lc-text-primary)" }}>
            ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[12px] mt-1.5" style={{ color: "var(--lc-text-muted)" }}>total for period</p>
        </div>
        <div className="flex gap-5">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.12em" }}>Peak</p>
            <p className="text-[14px] font-bold tabular-nums" style={{ color: "var(--lc-text-secondary)" }}>{fmtAxis(Math.round(peak))}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.12em" }}>Avg/Day</p>
            <p className="text-[14px] font-bold tabular-nums" style={{ color: "var(--lc-text-secondary)" }}>{fmtAxis(Math.round(avg))}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={195}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#c9a87c" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#c9a87c" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--lc-bg-card)" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--lc-text-muted)" }}
            tickMargin={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--lc-text-muted)" }}
            tickFormatter={fmtAxis}
            width={48}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(201,168,124,0.20)", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="natural"
            dataKey="revenue"
            stroke="#c9a87c"
            strokeWidth={2}
            fill="url(#goldAreaGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#c9a87c", strokeWidth: 2.5, stroke: "var(--lc-bg-surface)" }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
