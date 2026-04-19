"use client"

import { motion } from "framer-motion"

interface FleetPerformanceTableProps {
  vehicles: Array<{
    vehicleId: string
    name: string
    type: string
    revenue: number
    expenses: number
    profitability: number
    trips: number
    status: "ok" | "warning" | "alert"
  }>
}

function fmtAmt(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
}

const STATUS_CONFIG = {
  ok: {
    badge: "bg-emerald-50 text-emerald-700",
    label: "Healthy",
    bar: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700",
    label: "Low Margin",
    bar: "bg-amber-400",
  },
  alert: {
    badge: "bg-red-50 text-red-600",
    label: "Loss",
    bar: "bg-red-500",
  },
}

export function FleetPerformanceTable({ vehicles }: FleetPerformanceTableProps) {
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
      transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          Fleet Profitability
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Vehicle
              </th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Trips
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Expenses
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Profit
              </th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle, idx) => {
              const cfg = STATUS_CONFIG[vehicle.status]
              const marginPct =
                vehicle.revenue > 0
                  ? Math.round((vehicle.profitability / vehicle.revenue) * 100)
                  : 0
              const barPct = (vehicle.revenue / maxRevenue) * 100

              return (
                <motion.tr
                  key={vehicle.vehicleId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22, delay: idx * 0.05 }}
                  className="hover:bg-slate-50/60 transition-colors duration-150"
                >
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-[13px] text-slate-900">{vehicle.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-full w-fit mt-1">
                      {vehicle.type}
                    </div>
                    {/* Inline revenue bar */}
                    <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden w-28">
                      <motion.div
                        className={`h-full rounded-full ${cfg.bar}`}
                        style={{ width: `${barPct}%` }}
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        transition={{
                          duration: 0.7,
                          ease: [0.25, 0.1, 0.25, 1],
                          delay: 0.15 + idx * 0.07,
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-[13px] text-slate-500 tabular-nums">
                    {vehicle.trips}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] font-semibold text-emerald-600 tabular-nums">
                    {fmtAmt(vehicle.revenue)}
                  </td>
                  <td className="px-4 py-3.5 text-right text-[13px] text-slate-500 tabular-nums">
                    {fmtAmt(vehicle.expenses)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <p
                      className={`text-[13px] font-bold tabular-nums ${
                        vehicle.profitability < 0 ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {vehicle.profitability < 0 ? "-" : ""}
                      {fmtAmt(Math.abs(vehicle.profitability))}
                    </p>
                    <p className="text-[10px] text-slate-400 tabular-nums mt-0.5">
                      {marginPct}% margin
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.badge}`}
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
