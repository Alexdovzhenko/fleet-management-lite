"use client"

import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { FleetPerformanceTable } from "../charts/FleetPerformanceTable"

interface FleetTabProps {
  data?: EarningsBreakdown
  isLoading: boolean
}

export function FleetTab({ data, isLoading }: FleetTabProps) {
  if (isLoading) {
    return <div className="h-96 bg-white/70 rounded-2xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      {/* Alerts for underperforming vehicles */}
      {data?.fleetPerformance && (
        <>
          {data.fleetPerformance.some((v) => v.status !== "ok") && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-900">Vehicle Alerts</p>
                <p className="text-sm text-amber-800 mt-1">
                  {data.fleetPerformance.filter((v) => v.status === "alert").length} vehicle(s)
                  {" "}
                  showing losses,{" "}
                  {data.fleetPerformance.filter((v) => v.status === "warning").length} vehicle(s)
                  {" "}
                  with low profit margins
                </p>
              </div>
            </div>
          )}

          {/* Fleet Performance Table */}
          <FleetPerformanceTable vehicles={data.fleetPerformance} />
        </>
      )}
    </div>
  )
}
