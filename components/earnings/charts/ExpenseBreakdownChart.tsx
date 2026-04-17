"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

interface ExpenseBreakdownChartProps {
  data: { fixed: number; variable: number }
}

const COLORS = ["#ef4444", "#f97316"]

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const total = data.fixed + data.variable

  if (total === 0) {
    return (
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <p className="text-slate-600">No expense data</p>
      </div>
    )
  }

  const chartData = [
    {
      name: "Fixed",
      value: Math.round(data.fixed),
      display: `$${(data.fixed / 1000).toFixed(1)}k`,
    },
    {
      name: "Variable",
      value: Math.round(data.variable),
      display: `$${(data.variable / 1000).toFixed(1)}k`,
    },
  ]

  const fixedPct = ((data.fixed / total) * 100).toFixed(0)
  const variablePct = ((data.variable / total) * 100).toFixed(0)

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Expense Breakdown</h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#94a3b8"
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: any) =>
              `$${typeof value === "number" ? value.toLocaleString("en-US") : 0}`
            }
            contentStyle={{
              background: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey="value"
            fill="#ef4444"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-600 font-medium">Fixed</p>
          <p className="text-lg font-bold text-red-600">{fixedPct}%</p>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.fixed / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Variable</p>
          <p className="text-lg font-bold text-orange-600">{variablePct}%</p>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.variable / 1000).toFixed(1)}k
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-600 font-medium">Total</p>
        <p className="text-2xl font-bold text-slate-900">
          ${(total / 1000).toFixed(1)}k
        </p>
      </div>
    </div>
  )
}
