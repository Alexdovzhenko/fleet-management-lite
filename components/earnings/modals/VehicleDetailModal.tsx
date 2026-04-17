"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, TrendingUp, TrendingDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface VehicleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  vehicleId: string
  vehicleName: string
  startDate: string
  endDate: string
}

export function VehicleDetailModal({
  isOpen,
  onClose,
  vehicleId,
  vehicleName,
  startDate,
  endDate,
}: VehicleDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-detail", vehicleId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        vehicleId,
        startDate,
        endDate,
      })
      const res = await fetch(`/api/vehicles/${vehicleId}/performance?${params}`)
      if (!res.ok) throw new Error("Failed to fetch vehicle details")
      return res.json()
    },
    enabled: isOpen && !!vehicleId,
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{vehicleName}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Performance insights for selected period
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-40 bg-slate-100 rounded-lg animate-pulse" />
                </div>
              ) : data ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-medium">Trips</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        {data.trips}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-medium">
                        Avg Trip Value
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">
                        ${(data.avgTripValue / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-xs text-slate-600 font-medium">
                        Profit Margin
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${
                          data.profitMargin >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {data.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-4 border border-blue-100">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Total Revenue</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">
                          ${(data.totalRevenue / 1000).toFixed(1)}k
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Total Expenses</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">
                          ${(data.totalExpenses / 1000).toFixed(1)}k
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Net Profit</p>
                        <p
                          className={`text-lg font-bold mt-1 ${
                            data.netProfit >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          ${(data.netProfit / 1000).toFixed(1)}k
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Trip */}
                  {data.topTrip && (
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Best Trip
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Trip #</span>
                          <span className="font-medium text-slate-900">
                            {data.topTrip.tripNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Revenue</span>
                          <span className="font-medium text-emerald-600">
                            ${data.topTrip.revenue.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date</span>
                          <span className="font-medium text-slate-900">
                            {new Date(data.topTrip.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lowest Trip */}
                  {data.lowestTrip && (
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-slate-400" />
                        Lowest Revenue Trip
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Trip #</span>
                          <span className="font-medium text-slate-900">
                            {data.lowestTrip.tripNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Revenue</span>
                          <span className="font-medium text-slate-900">
                            ${data.lowestTrip.revenue.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Date</span>
                          <span className="font-medium text-slate-900">
                            {new Date(data.lowestTrip.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-slate-600">No data available</p>
              )}
            </div>

            {/* Close Button */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
