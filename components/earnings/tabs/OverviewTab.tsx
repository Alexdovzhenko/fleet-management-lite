"use client"

import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { FleetRankingTable } from "../charts/FleetRankingTable"
import { RevenueTrendChart } from "../charts/RevenueTrendChart"
import { CollectionPieChart } from "../charts/CollectionPieChart"
import { ExpenseBreakdownChart } from "../charts/ExpenseBreakdownChart"

interface OverviewTabProps {
  data?: EarningsBreakdown
  isLoading: boolean
}

export function OverviewTab({ data, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-80 bg-white/70 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-white/70 rounded-2xl animate-pulse" />
          <div className="h-64 bg-white/70 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      {data?.revenueTrend && (
        <RevenueTrendChart data={data.revenueTrend} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.collectionPie && (
          <CollectionPieChart data={data.collectionPie} />
        )}
        {data?.expenseBreakdown && (
          <ExpenseBreakdownChart data={data.expenseBreakdown} />
        )}
      </div>

      {/* Fleet Ranking */}
      {data?.fleetRanking && (
        <FleetRankingTable vehicles={data.fleetRanking} />
      )}
    </div>
  )
}
