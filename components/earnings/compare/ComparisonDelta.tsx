"use client"

interface ComparisonDeltaProps {
  label: string
  period1Value: number
  period2Value: number
  isExpense?: boolean
}

export function ComparisonDelta({
  label,
  period1Value,
  period2Value,
  isExpense = false,
}: ComparisonDeltaProps) {
  const diff = period2Value - period1Value
  const pctChange =
    period1Value !== 0 ? (diff / Math.abs(period1Value)) * 100 : 0
  const isIncreasing = diff > 0

  // For revenue/profit: increase is good. For expenses: decrease is good
  const isGood = isExpense ? !isIncreasing : isIncreasing

  const arrow = isIncreasing ? "↑" : diff < 0 ? "↓" : "→"

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
      <p className="text-sm font-medium text-slate-600 mb-3">{label}</p>

      <div className="space-y-3">
        {/* Period 2 Value with Delta */}
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-900">
              ${(period2Value / 1000).toFixed(1)}k
            </span>
            {diff !== 0 && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${
                  isGood
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {arrow} {Math.abs(pctChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            vs{" "}
            <span className="font-medium text-slate-600">
              ${(period1Value / 1000).toFixed(1)}k
            </span>
          </p>
        </div>

        {/* Absolute Change */}
        {diff !== 0 && (
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-600 font-medium">Absolute Change</p>
            <p
              className={`text-lg font-bold ${
                isGood ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isIncreasing && !isExpense ? "+" : ""}
              {!isIncreasing && isExpense ? "+" : ""}
              {!isIncreasing ? "-" : ""}
              ${Math.abs(diff).toLocaleString("en-US", {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}