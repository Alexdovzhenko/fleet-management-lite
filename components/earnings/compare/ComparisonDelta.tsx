"use client"

interface ComparisonDeltaProps {
  label: string
  period1Value: number
  period2Value: number
  isExpense?: boolean
}

export function ComparisonDelta({ label, period1Value, period2Value, isExpense = false }: ComparisonDeltaProps) {
  const diff      = period2Value - period1Value
  const pctChange = period1Value !== 0 ? (diff / Math.abs(period1Value)) * 100 : 0
  const isIncrease = diff > 0
  const isGood    = isExpense ? !isIncrease : isIncrease

  const arrow = isIncrease ? "↑" : diff < 0 ? "↓" : "→"

  const badgeStyle: React.CSSProperties = isGood
    ? { background: "rgba(52,211,153,0.12)", color: "rgba(52,211,153,0.90)" }
    : { background: "rgba(248,113,113,0.12)", color: "rgba(248,113,113,0.90)" }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.12em" }}>
        {label}
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[28px] font-bold tabular-nums tracking-tight leading-none" style={{ color: "var(--lc-text-primary)" }}>
              ${(period2Value / 1000).toFixed(1)}k
            </span>
            {diff !== 0 && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-semibold"
                style={badgeStyle}
              >
                {arrow} {Math.abs(pctChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-[12px]" style={{ color: "var(--lc-text-muted)" }}>
            vs{" "}
            <span style={{ color: "var(--lc-text-dim)", fontWeight: 600 }}>
              ${(period1Value / 1000).toFixed(1)}k
            </span>
          </p>
        </div>

        {diff !== 0 && (
          <div className="pt-3" style={{ borderTop: "1px solid var(--lc-bg-glass)" }}>
            <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: "var(--lc-text-muted)", letterSpacing: "0.12em" }}>
              Absolute Change
            </p>
            <p className="text-[16px] font-bold tabular-nums" style={{ color: isGood ? "rgba(52,211,153,0.90)" : "rgba(248,113,113,0.90)" }}>
              {isIncrease ? "+" : "-"}${Math.abs(diff).toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
