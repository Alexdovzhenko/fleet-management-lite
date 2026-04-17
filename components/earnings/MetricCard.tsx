"use client"

import { ReactNode } from "react"

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: number
  format?: "currency" | "number" | "percent"
  trend?: {
    pct: number
    amount: number
  }
  isLoading?: boolean
}

export function MetricCard({
  icon,
  label,
  value,
  format = "currency",
  trend,
  isLoading,
}: MetricCardProps) {
  const formatted = isLoading
    ? "..."
    : format === "currency"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  const isPositive = trend && trend.pct >= 0

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6 overflow-hidden group hover:bg-white/80 transition-colors">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-3">
        {/* Icon + Label */}
        <div className="flex items-center gap-2">
          <div className="text-2xl">{icon}</div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
        </div>

        {/* Value */}
        <p className={`text-3xl font-bold ${isLoading ? "text-slate-400" : "text-slate-900"}`}>
          {formatted}
        </p>

        {/* Trend */}
        {trend && !isLoading && (
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`font-semibold ${
                isPositive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {isPositive ? "↑" : "↓"} {Math.abs(trend.pct).toFixed(1)}%
            </span>
            <span className="text-slate-500">vs last period</span>
          </div>
        )}
      </div>
    </div>
  )
}
