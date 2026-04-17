"use client"

interface CompareTabProps {
  startDate: string
  endDate: string
}

export function CompareTab({ startDate, endDate }: CompareTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Compare Periods</h2>
        <p className="text-sm text-slate-600">
          Coming soon: Compare financial metrics between two different time periods
        </p>
      </div>
    </div>
  )
}
