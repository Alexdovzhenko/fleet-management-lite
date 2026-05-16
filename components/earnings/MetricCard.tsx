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

const CONFIG: Record<MetricType, {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>
  iconBg: string
  iconColor: string
  glowColor: string
}> = {
  revenue:   { Icon: TrendingUp,   iconBg: "rgba(52,211,153,0.12)",  iconColor: "#34d399", glowColor: "rgba(52,211,153,0.08)"  },
  collected: { Icon: CheckCircle2, iconBg: "rgba(96,165,250,0.12)",  iconColor: "#60a5fa", glowColor: "rgba(96,165,250,0.08)"  },
  pending:   { Icon: Clock,        iconBg: "rgba(251,191,36,0.12)",  iconColor: "#fbbf24", glowColor: "rgba(251,191,36,0.08)"  },
  expenses:  { Icon: ReceiptText,  iconBg: "rgba(248,113,113,0.12)", iconColor: "#f87171", glowColor: "rgba(248,113,113,0.08)" },
}

export function MetricCard({ type, label, value, format = "currency", trend, isLoading }: MetricCardProps) {
  const { Icon, iconBg, iconColor, glowColor } = CONFIG[type]
  const isPositive = trend && trend.pct >= 0

  const formatted =
    format === "currency"
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
      : format === "percent"
        ? `${value.toFixed(1)}%`
        : value.toLocaleString()

  return (
    <div
      className="rounded-xl p-4 cursor-default select-none"
      style={{
        background: "var(--lc-bg-card)",
        border: "1px solid var(--lc-bg-glass-mid)",
        transition: "transform 200ms cubic-bezier(0.23,1,0.32,1), box-shadow 200ms cubic-bezier(0.23,1,0.32,1)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.40), 0 0 0 1px var(--lc-bg-glass-hover)`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)"
        ;(e.currentTarget as HTMLElement).style.boxShadow = "none"
      }}
    >
      {/* Icon + trend row */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: iconBg, boxShadow: `0 0 12px ${glowColor}` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={2} />
        </div>

        {trend && !isLoading && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
            style={isPositive
              ? { background: "rgba(52,211,153,0.12)", color: "rgba(52,211,153,0.90)" }
              : { background: "rgba(248,113,113,0.12)", color: "rgba(248,113,113,0.90)" }
            }
          >
            {isPositive
              ? <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5} />
              : <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5} />
            }
            {Math.abs(trend.pct).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value + label */}
      {isLoading ? (
        <div className="space-y-2 mt-1">
          <div className="h-6 w-20 rounded-lg animate-pulse" style={{ background: "var(--lc-bg-glass-mid)" }} />
          <div className="h-3 w-24 rounded animate-pulse" style={{ background: "var(--lc-bg-glass)" }} />
        </div>
      ) : (
        <div>
          <p className="text-[22px] font-bold tabular-nums tracking-tight leading-none" style={{ color: "var(--lc-text-primary)" }}>
            {formatted}
          </p>
          <p className="text-[12px] font-medium mt-1.5" style={{ color: "var(--lc-text-label)" }}>{label}</p>
          {trend && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--lc-text-muted)" }}>vs last period</p>
          )}
        </div>
      )}
    </div>
  )
}
