"use client"

interface FleetRankingTableProps {
  vehicles: Array<{
    vehicleId: string
    name: string
    type: string
    trips: number
    revenue: number
  }>
}

export function FleetRankingTable({ vehicles }: FleetRankingTableProps) {
  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Fleet Ranking</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Rank</th>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Vehicle</th>
              <th className="px-6 py-3 text-center font-medium text-slate-600">Trips</th>
              <th className="px-6 py-3 text-right font-medium text-slate-600">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle, idx) => (
              <tr key={vehicle.vehicleId} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-emerald-600">#{idx + 1}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{vehicle.name}</div>
                  <div className="text-xs text-slate-500">{vehicle.type}</div>
                </td>
                <td className="px-6 py-4 text-center text-slate-600">{vehicle.trips}</td>
                <td className="px-6 py-4 text-right font-semibold text-slate-900">
                  ${vehicle.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
