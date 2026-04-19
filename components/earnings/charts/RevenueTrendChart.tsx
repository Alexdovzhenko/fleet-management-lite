"use client"

import { motion } from "framer-motion"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

function fmtAxis(v: number): string {
  if (v >= 10000) return `$${(v / 1000).toFixed(0)}k`
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`
  return `$${v}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5 min-w-[110px]">
      <p className="text-[11px] text-slate-400 font-medium mb-1">{label}</p>
      <p className="text-[15px] font-bold text-slate-900 tabular-nums">
        ${value.toLocaleString("en-US")}
      </p>
    </div>
  )
}

interface RevenueTrendChartProps {
  data: Array<{ date: string; revenue: number }>
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-center h-[280px]">
        <p className="text-[13px] text-slate-400">No revenue data for this period</p>
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.revenue, 0)
  const peak = Math.max(...data.map((d) => d.revenue))
  const avg = data.length > 0 ? total / data.length : 0

  const chartData = data.map((item) => {
    const [year, month, day] = item.date.split("-").map(Number)
    return {
      date: new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      revenue: Math.round(item.revenue),
    }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      className="bg-white rounded-2xl border border-slate-100 p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Revenue Trend
          </p>
          <p className="text-[28px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
            ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[12px] text-slate-400 mt-1.5">total for period</p>
        </div>
        <div className="flex gap-5">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Peak
            </p>
            <p className="text-[14px] font-bold text-slate-900 tabular-nums">{fmtAxis(Math.round(peak))}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
              Avg / Day
            </p>
            <p className="text-[14px] font-bold text-slate-900 tabular-nums">
              {fmtAxis(Math.round(avg))}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={195}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickMargin={10}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={fmtAxis}
            width={50}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          <Area
            type="natural"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueAreaGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#10b981", strokeWidth: 2.5, stroke: "#fff" }}
            animationDuration={900}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
