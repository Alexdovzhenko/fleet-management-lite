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
      <div className="space-y-6">
        <div className="h-96 bg-white/70 rounded-2xl animate-pulse" />
        <div className="h-96 bg-white/70 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Expense Form */}
      <ExpenseForm />

      {/* Expenses List */}
      <ExpensesList startDate={startDate} endDate={endDate} />
    </div>
  )
}
