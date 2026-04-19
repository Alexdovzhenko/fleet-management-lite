"use client"

import { motion } from "framer-motion"

interface FleetRankingTableProps {
  vehicles: Array<{
    vehicleId: string
    name: string
    type: string
    trips: number
    revenue: number
  }>
}

function fmtAmt(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

const RANK_STYLES: Record<number, { bg: string; text: string }> = {
  1: { bg: "bg-amber-50", text: "text-amber-600" },
  2: { bg: "bg-slate-50", text: "text-slate-500" },
  3: { bg: "bg-orange-50", text: "text-orange-600" },
}

export function FleetRankingTable({ vehicles }: FleetRankingTableProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-center h-[160px]">
        <p className="text-[13px] text-slate-400">No fleet data for this period</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...vehicles.map((v) => v.revenue), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1], delay: 0.18 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          Fleet Ranking
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {vehicles.map((vehicle, idx) => {
          const rank = idx + 1
          const rankStyle = RANK_STYLES[rank] ?? { bg: "", text: "text-slate-400" }
          const barPct = (vehicle.revenue / maxRevenue) * 100

          return (
            <motion.div
              key={vehicle.vehicleId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.28,
                ease: [0.25, 0.1, 0.25, 1],
                delay: 0.22 + idx * 0.055,
              }}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/70 transition-colors duration-150"
            >
              {/* Rank badge */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${rankStyle.bg}`}
              >
                <span className={`text-[11px] font-black tabular-nums ${rankStyle.text}`}>
                  {rank}
                </span>
              </div>

              {/* Vehicle info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[13px] font-semibold text-slate-900">{vehicle.name}</span>
                    <span className="ml-2 text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-[13px] font-bold text-slate-900 tabular-nums">
                      {fmtAmt(vehicle.revenue)}
                    </p>
                    <p className="text-[10px] text-slate-400">{vehicle.trips} trip{vehicle.trips !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                {/* Relative revenue bar */}
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${barPct}%` }}
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{
                      duration: 0.7,
                      ease: [0.25, 0.1, 0.25, 1],
                      delay: 0.3 + idx * 0.07,
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
