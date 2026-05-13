"use client"

import { AlertTriangle } from "lucide-react"
import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { FleetPerformanceTable } from "../charts/FleetPerformanceTable"

export function FleetTab({ data, isLoading }: { data?: EarningsBreakdown; isLoading: boolean }) {
  if (isLoading) {
    return <div className="h-96 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
  }

  const alertCount   = data?.fleetPerformance?.filter((v) => v.status === "alert").length   ?? 0
  const warningCount = data?.fleetPerformance?.filter((v) => v.status === "warning").length ?? 0
  const hasIssues    = data?.fleetPerformance?.some((v) => v.status !== "ok") ?? false

  return (
    <div className="space-y-4">
      {hasIssues && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.20)" }}
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(251,191,36,0.15)" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#fbbf24" }} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "rgba(251,191,36,0.90)" }}>Vehicle Alerts</p>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "rgba(251,191,36,0.65)" }}>
              {alertCount > 0 && `${alertCount} vehicle${alertCount !== 1 ? "s" : ""} showing losses`}
              {alertCount > 0 && warningCount > 0 ? ", " : alertCount > 0 ? "." : ""}
              {warningCount > 0 && `${warningCount} vehicle${warningCount !== 1 ? "s" : ""} with low profit margins.`}
            </p>
          </div>
        </div>
      )}
      {data?.fleetPerformance && <FleetPerformanceTable vehicles={data.fleetPerformance} />}
    </div>
  )
}
