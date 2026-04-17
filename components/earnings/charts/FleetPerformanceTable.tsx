"use client"

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

export function FleetPerformanceTable({ vehicles }: FleetPerformanceTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "alert":
        return "bg-red-50 border-red-200"
      case "warning":
        return "bg-amber-50 border-amber-200"
      default:
        return "hover:bg-slate-50/50"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "alert":
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Loss</span>
      case "warning":
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">Low Margin</span>
      default:
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">Healthy</span>
    }
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">Fleet Profitability</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Vehicle</th>
              <th className="px-6 py-3 text-center font-medium text-slate-600">Trips</th>
              <th className="px-6 py-3 text-right font-medium text-slate-600">Revenue</th>
              <th className="px-6 py-3 text-right font-medium text-slate-600">Expenses</th>
              <th className="px-6 py-3 text-right font-medium text-slate-600">Profit</th>
              <th className="px-6 py-3 text-center font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.vehicleId}
                className={`transition-colors border-l-4 ${getStatusColor(vehicle.status)}`}
              >
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{vehicle.name}</div>
                  <div className="text-xs text-slate-500">{vehicle.type}</div>
                </td>
                <td className="px-6 py-4 text-center text-slate-600">{vehicle.trips}</td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                  ${vehicle.revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-right font-medium text-slate-600">
                  ${vehicle.expenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td
                  className={`px-6 py-4 text-right font-bold ${
                    vehicle.profitability < 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  ${vehicle.profitability.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </td>
                <td className="px-6 py-4 text-center">{getStatusBadge(vehicle.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
