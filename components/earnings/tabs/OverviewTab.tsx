"use client"

import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { FleetRankingTable } from "../charts/FleetRankingTable"
import { RevenueTrendChart } from "../charts/RevenueTrendChart"
import { CollectionPieChart } from "../charts/CollectionPieChart"
import { ExpenseBreakdownChart } from "../charts/ExpenseBreakdownChart"

export function OverviewTab({ data, isLoading }: { data?: EarningsBreakdown; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-80 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
        </div>
        <div className="h-48 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data?.revenueTrend    && <RevenueTrendChart data={data.revenueTrend} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.collectionPie    && <CollectionPieChart    data={data.collectionPie} />}
        {data?.expenseBreakdown && <ExpenseBreakdownChart data={data.expenseBreakdown} />}
      </div>
      {data?.fleetRanking && <FleetRankingTable vehicles={data.fleetRanking} />}
    </div>
  )
}
