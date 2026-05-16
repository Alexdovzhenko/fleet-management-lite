import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, dark = false }: { rows?: number; dark?: boolean }) {
  if (dark) {
    const cols = [
      { w: 88,  label: 60  },
      { w: 52,  label: 36  },
      { w: 64,  label: 44  },
      { w: 100, label: 72  },
      { w: 112, label: 80  },
      { w: 88,  label: 64  },
      { w: 72,  label: 52  },
      { w: 140, label: 100 },
      { w: 140, label: 88  },
      { w: 96,  label: 68  },
      { w: 64,  label: 48  },
      { w: 80,  label: 56  },
      { w: 32,  label: 16  },
      { w: 56,  label: 40  },
    ]
    const rowWidthVariants = [0.85, 0.70, 0.90, 0.60, 0.80, 0.75, 0.95, 0.65]
    return (
      <div
        className="rounded-2xl overflow-hidden flex-1"
        style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-0"
          style={{ background: "var(--lc-bg-card)", borderBottom: "1px solid var(--lc-bg-glass-hover)" }}
        >
          {cols.map((col, i) => (
            <div key={i} className="px-3 py-2.5 flex-shrink-0" style={{ width: `${col.w}px` }}>
              <div className="h-2 rounded-full" style={{ width: `${col.label}px`, background: "var(--lc-bg-glass-hover)", animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
            </div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-0"
            style={{ borderBottom: "1px solid var(--lc-bg-glass)", animationDelay: `${i * 40}ms` }}
          >
            {cols.map((col, j) => {
              const variant = rowWidthVariants[(i + j) % rowWidthVariants.length]
              const isStatus = j === 0
              const isTime = j === 1
              return (
                <div key={j} className="px-3 py-[14px] flex-shrink-0" style={{ width: `${col.w}px` }}>
                  <div
                    className="rounded-full"
                    style={{
                      height: isStatus ? "22px" : isTime ? "14px" : "10px",
                      width: isStatus ? "80px" : `${Math.round(col.label * variant)}px`,
                      background: "var(--lc-bg-glass)",
                      animation: `pulse 2s cubic-bezier(0.4,0,0.6,1) ${i * 40 + j * 15}ms infinite`,
                      borderRadius: isStatus ? "999px" : "4px",
                    }}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-lg border">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  )
}

export function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-2.5 h-2.5 rounded-full" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
