"use client"

import { AlertTriangle } from "lucide-react"
import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { FleetPerformanceTable } from "../charts/FleetPerformanceTable"

interface FleetTabProps {
  data?: EarningsBreakdown
  isLoading: boolean
}

export function FleetTab({ data, isLoading }: FleetTabProps) {
  if (isLoading) {
    return <div className="h-96 bg-white rounded-2xl border border-slate-100 animate-pulse" />
  }

  return (
    <div className="space-y-4">
      {data?.fleetPerformance && (
        <>
          {data.fleetPerformance.some((v) => v.status !== "ok") && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-amber-900">Vehicle Alerts</p>
                <p className="text-[12px] text-amber-700 mt-1 leading-relaxed">
                  {data.fleetPerformance.filter((v) => v.status === "alert").length > 0 && (
                    <>
                      {data.fleetPerformance.filter((v) => v.status === "alert").length} vehicle
                      {data.fleetPerformance.filter((v) => v.status === "alert").length !== 1 ? "s" : ""} showing losses
                      {data.fleetPerformance.filter((v) => v.status === "warning").length > 0 ? ", " : "."}
                    </>
                  )}
                  {data.fleetPerformance.filter((v) => v.status === "warning").length > 0 && (
                    <>
                      {data.fleetPerformance.filter((v) => v.status === "warning").length} vehicle
                      {data.fleetPerformance.filter((v) => v.status === "warning").length !== 1 ? "s" : ""} with low profit margins.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          <FleetPerformanceTable vehicles={data.fleetPerformance} />
        </>
      )}
    </div>
  )
}
