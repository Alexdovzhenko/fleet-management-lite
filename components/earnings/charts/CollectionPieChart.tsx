"use client"

interface CollectionPieChartProps {
  data: { collected: number; uncollected: number }
}

export function CollectionPieChart({ data }: CollectionPieChartProps) {
  const total = data.collected + data.uncollected
  const collectedPct = total > 0 ? (data.collected / total) * 100 : 0
  const uncollectedPct = total > 0 ? (data.uncollected / total) * 100 : 0

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Collection Status</h3>

      <div className="flex items-center justify-center gap-8">
        {/* Simple pie representation */}
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-8 border-slate-100" style={{
          background: `conic-gradient(#06b6d4 0% ${collectedPct}%, #f59e0b ${collectedPct}% 100%)`
        }}>
          <div className="absolute inset-0 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <span className="text-sm font-bold text-slate-900">{collectedPct.toFixed(0)}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-500 rounded-full" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Collected</p>
              <p className="text-lg font-bold text-slate-900">
                ${(data.collected / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full" />
            <div>
              <p className="text-xs text-slate-600 font-medium">Pending</p>
              <p className="text-lg font-bold text-slate-900">
                ${(data.uncollected / 1000).toFixed(1)}k
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
