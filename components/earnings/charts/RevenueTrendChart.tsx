"use client"

interface RevenueTrendChartProps {
  data: Array<{ date: string; revenue: number }>
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const avgRevenue = data.reduce((sum, d) => sum + d.revenue, 0) / data.length

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Revenue Trend</h3>

      {/* Simple bar chart */}
      <div className="flex items-end gap-1 h-64">
        {data.map((item, idx) => {
          const heightPercent = (item.revenue / maxRevenue) * 100
          const isAboveAvg = item.revenue > avgRevenue

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t transition-all ${
                  isAboveAvg ? "bg-emerald-500" : "bg-emerald-400"
                }`}
                style={{ height: `${Math.max(heightPercent, 5)}%` }}
              />
              <div className="text-xs text-slate-600 text-center whitespace-nowrap truncate">
                {new Date(item.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-slate-600 font-medium">Total</p>
          <p className="text-lg font-bold text-slate-900">
            ${(data.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Average</p>
          <p className="text-lg font-bold text-slate-900">
            ${(avgRevenue / 1000).toFixed(1)}k
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 font-medium">Peak</p>
          <p className="text-lg font-bold text-slate-900">
            ${(Math.max(...data.map((d) => d.revenue)) / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  )
}
