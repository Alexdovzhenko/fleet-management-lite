"use client"

import { motion } from "framer-motion"

interface FleetRankingTableProps {
  vehicles: Array<{ vehicleId: string; name: string; type: string; trips: number; revenue: number }>
}

function fmtAmt(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

const RANK_STYLES: Record<number, { bg: string; color: string }> = {
  1: { bg: "rgba(201,168,124,0.15)", color: "#c9a87c"  },
  2: { bg: "rgba(200,212,228,0.10)", color: "rgba(200,212,228,0.65)" },
  3: { bg: "rgba(253,186,116,0.12)", color: "#fb923c"  },
}

export function FleetRankingTable({ vehicles }: FleetRankingTableProps) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center h-[160px]"
        style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-[13px]" style={{ color: "rgba(200,212,228,0.40)" }}>No fleet data for this period</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...vehicles.map((v) => v.revenue), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1], delay: 0.18 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.38)", letterSpacing: "0.14em" }}>
          Fleet Ranking
        </p>
      </div>

      <div>
        {vehicles.map((vehicle, idx) => {
          const rank      = idx + 1
          const rankStyle = RANK_STYLES[rank] ?? { bg: "rgba(255,255,255,0.05)", color: "rgba(200,212,228,0.38)" }
          const barPct    = (vehicle.revenue / maxRevenue) * 100

          return (
            <motion.div
              key={vehicle.vehicleId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.26, ease: [0.25, 0.1, 0.25, 1], delay: 0.22 + idx * 0.055 }}
              className="flex items-center gap-4 px-5 py-3.5 transition-colors duration-150"
              style={{ borderBottom: idx < vehicles.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              {/* Rank badge */}
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: rankStyle.bg }}
              >
                <span className="text-[11px] font-black tabular-nums" style={{ color: rankStyle.color }}>
                  {rank}
                </span>
              </div>

              {/* Vehicle info + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{vehicle.name}</span>
                    <span
                      className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(200,212,228,0.50)" }}
                    >
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-[13px] font-bold tabular-nums" style={{ color: "#c9a87c" }}>{fmtAmt(vehicle.revenue)}</p>
                    <p className="text-[10px]" style={{ color: "rgba(200,212,228,0.38)" }}>
                      {vehicle.trips} trip{vehicle.trips !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {/* Revenue bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ width: `${barPct}%`, background: rank === 1 ? "#c9a87c" : rank === 2 ? "rgba(200,212,228,0.45)" : "#fb923c" }}
                    initial={{ clipPath: "inset(0 100% 0 0)" }}
                    animate={{ clipPath: "inset(0 0% 0 0)" }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.3 + idx * 0.07 }}
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
