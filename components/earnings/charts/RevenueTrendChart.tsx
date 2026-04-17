"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface RevenueTrendChartProps {
  data: Array<{ date: string; revenue: number }>
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <p className="text-slate-600">No data available</p>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.revenue, 0)
  const avg = total / data.length
  const max = Math.max(...data.map((d) => d.revenue))

  // Format data for Recharts with readable dates
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: Math.round(item.revenue),
  }))

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Revenue Trend</h3>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
            formatter={(value: any) =>
              `$${typeof value === "number" ? value.toLocaleString("en-US") : 0}`
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-600 font-medium">Total</p>
          <p className="text-lg font-bold text-slate-900">
            ${(total / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Average</p>
          <p className="text-lg font-bold text-slate-900">
            ${(avg / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Peak</p>
          <p className="text-lg font-bold text-slate-900">
            ${(max / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  )
}
