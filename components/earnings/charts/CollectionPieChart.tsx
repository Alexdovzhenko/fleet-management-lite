"use client"

import { motion } from "framer-motion"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

function fmtAmt(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

interface SliceTooltipPayload {
  name: string
  value: number
  payload: { fill: string }
}

interface TooltipProps {
  active?: boolean
  payload?: SliceTooltipPayload[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-3.5 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.payload.fill }} />
        <p className="text-[11px] text-slate-500 font-medium">{item.name}</p>
      </div>
      <p className="text-[15px] font-bold text-slate-900 tabular-nums">{fmtAmt(item.value)}</p>
    </div>
  )
}

interface CollectionPieChartProps {
  data: { collected: number; uncollected: number }
}

export function CollectionPieChart({ data }: CollectionPieChartProps) {
  const total = data.collected + data.uncollected

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center justify-center h-[240px]">
        <p className="text-[13px] text-slate-400">No invoice data for this period</p>
      </div>
    )
  }

  const collectedPct = Math.round((data.collected / total) * 100)

  const chartData = [
    { name: "Collected", value: Math.round(data.collected), fill: "#3b82f6" },
    { name: "Pending", value: Math.round(data.uncollected), fill: "#f59e0b" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1], delay: 0.06 }}
      className="bg-white rounded-2xl border border-slate-100 p-5"
    >
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4">
        Collection Status
      </p>

      {/* Donut + center label */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={82}
              startAngle={90}
              endAngle={-270}
              paddingAngle={data.uncollected > 0 ? 3 : 0}
              dataKey="value"
              strokeWidth={0}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centered label over donut hole */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-[30px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
              {collectedPct}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">collected</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 leading-none mb-1.5">Collected</p>
            <p className="text-[15px] font-bold text-slate-900 tabular-nums leading-none">
              {fmtAmt(data.collected)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 leading-none mb-1.5">Pending</p>
            <p className="text-[15px] font-bold text-slate-900 tabular-nums leading-none">
              {fmtAmt(data.uncollected)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
