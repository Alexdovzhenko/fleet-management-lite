"use client"

import { motion } from "framer-motion"

interface Vehicle {
  vehicleId: string; name: string; type: string
  revenue: number; expenses: number; profitability: number; trips: number
  status: "ok" | "warning" | "alert"
}

function fmtAmt(v: number) {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

const STATUS_CONFIG = {
  ok:      { bg: "rgba(52,211,153,0.12)",  color: "rgba(52,211,153,0.90)",  label: "Healthy",    bar: "#34d399" },
  warning: { bg: "rgba(251,191,36,0.12)",  color: "rgba(251,191,36,0.90)",  label: "Low Margin", bar: "#fbbf24" },
  alert:   { bg: "rgba(248,113,113,0.12)", color: "rgba(248,113,113,0.90)", label: "Loss",       bar: "#f87171" },
}

export function FleetPerformanceTable({ vehicles }: { vehicles: Vehicle[] }) {
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
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.25)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(200,212,228,0.38)", letterSpacing: "0.14em" }}>
          Fleet Profitability
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Vehicle", "Trips", "Revenue", "Expenses", "Profit", "Status"].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-widest ${i === 0 ? "text-left pl-5" : i >= 4 ? "text-center" : "text-right"} ${i === 5 ? "pr-5" : ""}`}
                  style={{ color: "rgba(200,212,228,0.35)", letterSpacing: "0.12em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle, idx) => {
              const cfg       = STATUS_CONFIG[vehicle.status]
              const marginPct = vehicle.revenue > 0 ? Math.round((vehicle.profitability / vehicle.revenue) * 100) : 0
              const barPct    = (vehicle.revenue / maxRevenue) * 100

              return (
                <motion.tr
                  key={vehicle.vehicleId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22, delay: idx * 0.05 }}
                  style={{ borderBottom: idx < vehicles.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="font-semibold text-[13px]" style={{ color: "rgba(255,255,255,0.88)" }}>{vehicle.name}</div>
                    <div
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full w-fit mt-1"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(200,212,228,0.50)" }}
                    >
                      {vehicle.type}
                    </div>
                    <div className="mt-2 h-1 rounded-full overflow-hidden w-28" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ width: `${barPct}%`, background: cfg.bar }}
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 + idx * 0.07 }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-[13px] tabular-nums" style={{ color: "rgba(200,212,228,0.55)" }}>
                    {vehicle.trips}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-semibold tabular-nums" style={{ color: "#34d399" }}>
                    {fmtAmt(vehicle.revenue)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] tabular-nums" style={{ color: "rgba(200,212,228,0.55)" }}>
                    {fmtAmt(vehicle.expenses)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p
                      className="text-[13px] font-bold tabular-nums"
                      style={{ color: vehicle.profitability < 0 ? "#f87171" : "#34d399" }}
                    >
                      {vehicle.profitability < 0 ? "-" : ""}
                      {fmtAmt(Math.abs(vehicle.profitability))}
                    </p>
                    <p className="text-[10px] tabular-nums mt-0.5" style={{ color: "rgba(200,212,228,0.35)" }}>
                      {marginPct}% margin
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{ background: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
