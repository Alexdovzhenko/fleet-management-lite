"use client"

interface ExpenseBreakdownChartProps {
  data: { fixed: number; variable: number }
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const total = data.fixed + data.variable
  const fixedPct = total > 0 ? (data.fixed / total) * 100 : 0
  const variablePct = total > 0 ? (data.variable / total) * 100 : 0

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-6">Expense Breakdown</h3>

      <div className="space-y-6">
        {/* Fixed Expenses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="font-medium text-slate-700">Fixed</span>
            </div>
            <span className="text-sm text-slate-600">{fixedPct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: `${fixedPct}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.fixed / 1000).toFixed(1)}k
          </p>
        </div>

        {/* Variable Expenses */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="font-medium text-slate-700">Variable</span>
            </div>
            <span className="text-sm text-slate-600">{variablePct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${variablePct}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-1">
            ${(data.variable / 1000).toFixed(1)}k
          </p>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-600 font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-slate-900">
            ${(total / 1000).toFixed(1)}k
          </p>
        </div>
      </div>
    </div>
  )
}
