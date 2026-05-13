"use client"

import { EarningsBreakdown } from "@/lib/hooks/use-earnings"
import { ExpenseForm } from "../forms/ExpenseForm"
import { ExpensesList } from "../expense/ExpensesList"

interface ExpensesTabProps {
  data?: EarningsBreakdown
  isLoading: boolean
  startDate: string
  endDate: string
}

export function ExpensesTab({ data, isLoading, startDate, endDate }: ExpensesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "#0d1526" }} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ExpenseForm />
      <ExpensesList startDate={startDate} endDate={endDate} />
    </div>
  )
}
