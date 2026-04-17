"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface CollectionPieChartProps {
  data: { collected: number; uncollected: number }
}

const COLORS = ["#06b6d4", "#f59e0b"]

export function CollectionPieChart({ data }: CollectionPieChartProps) {
  const total = data.collected + data.uncollected

  if (total === 0) {
    return (
      <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <p className="text-slate-600">No collection data</p>
      </div>
    )
  }

  const chartData = [
    {
      name: "Collected",
      value: Math.round(data.collected),
      display: `$${(data.collected / 1000).toFixed(1)}k`,
    },
    {
      name: "Pending",
      value: Math.round(data.uncollected),
      display: `$${(data.uncollected / 1000).toFixed(1)}k`,
    },
  ]

  const collectedPct = ((data.collected / total) * 100).toFixed(0)

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Collection Status</h3>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, display }) => `${name}: ${display}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) =>
              `$${typeof value === "number" ? value.toLocaleString("en-US") : 0}`
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
        <div>
          <p className="text-xs text-slate-600 font-medium">Collected</p>
          <p className="text-lg font-bold text-cyan-600">
            {collectedPct}%
          </p>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.collected / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Pending</p>
          <p className="text-lg font-bold text-amber-600">
            {(100 - parseInt(collectedPct)).toFixed(0)}%
          </p>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.uncollected / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  )
}
