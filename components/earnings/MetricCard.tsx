"use client"

import { TrendingUp, TrendingDown, CheckCircle2, Clock, ReceiptText } from "lucide-react"

export type MetricType = "revenue" | "collected" | "pending" | "expenses"

interface MetricCardProps {
  type: MetricType
  label: string
  value: number
  format?: "currency" | "number" | "percent"
  trend?: { pct: number; amount: number }
  isLoading?: boolean
}

const CONFIG: Record<
  MetricType,
  {
    Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
    iconBg: string
    iconColor: string
  }
> = {
  revenue: {
    Icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  collected: {
    Icon: CheckCircle2,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  pending: {
    Icon: Clock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  expenses: {
    Icon: ReceiptText,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
}

export function MetricCard({
  type,
  label,
  value,
  format = "currency",
  trend,
  isLoading,
}: MetricCardProps) {
  const { Icon, iconBg, iconColor } = CONFIG[type]
  const isPositive = trend && trend.pct >= 0

  const formatted =
    format === "currency"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
      {/* Icon row */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={2} />
        </div>

        {trend && !isLoading && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
              isPositive
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
            ) : (
              <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />
            )}
            {Math.abs(trend.pct).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value + label */}
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <div className="h-7 w-20 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-3 w-24 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-[22px] font-bold text-slate-900 tabular-nums tracking-tight leading-none">
            {formatted}
          </p>
          <p className="text-[12px] text-slate-400 font-medium mt-1.5">{label}</p>
          {trend && (
            <p className="text-[11px] text-slate-300 mt-0.5">vs last period</p>
          )}
        </div>
      )}
    </div>
  )
}
