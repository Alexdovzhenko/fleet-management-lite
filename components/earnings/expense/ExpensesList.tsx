"use client"

import { useState } from "react"
import { useExpensesList, useDeleteExpenseMutation } from "@/lib/hooks/use-earnings"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface ExpensesListProps {
  startDate: string
  endDate: string
}

export function ExpensesList({ startDate, endDate }: ExpensesListProps) {
  const [category, setCategory] = useState<"FIXED" | "VARIABLE" | undefined>()
  const { data: expenses, isLoading } = useExpensesList(startDate, endDate, category)
  const { mutate: deleteExpense } = useDeleteExpenseMutation()

  const handleDelete = (expenseId: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      deleteExpense(expenseId, {
        onSuccess: () => toast.success("Expense deleted"),
        onError: () => toast.error("Failed to delete expense"),
      })
    }
  }

  if (isLoading) {
    return <div className="h-96 bg-white/70 rounded-2xl animate-pulse" />
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-100 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Expenses</h3>

        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setCategory(undefined)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              !category
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setCategory("FIXED")}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              category === "FIXED"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Fixed
          </button>
          <button
            onClick={() => setCategory("VARIABLE")}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              category === "VARIABLE"
                ? "bg-orange-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Variable
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Date</th>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Type</th>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Category</th>
              <th className="px-6 py-3 text-left font-medium text-slate-600">Vehicle</th>
              <th className="px-6 py-3 text-right font-medium text-slate-600">Amount</th>
              <th className="px-6 py-3 text-center font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(expense.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {expense.subcategory}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        expense.category === "FIXED"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {expense.vehicle?.name || "Company-wide"}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-900">
                    ${parseFloat(expense.amount).toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No expenses found for this period
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {expenses && expenses.length > 0 && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center justify-end gap-6">
            <div>
              <p className="text-xs text-slate-600 font-medium">Fixed Total</p>
              <p className="text-lg font-bold text-slate-900">
                ${expenses
                  .filter((e) => e.category === "FIXED")
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  .toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-600 font-medium">Variable Total</p>
              <p className="text-lg font-bold text-slate-900">
                ${expenses
                  .filter((e) => e.category === "VARIABLE")
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  .toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="border-l border-slate-200 pl-6">
              <p className="text-xs text-slate-600 font-medium">Total</p>
              <p className="text-lg font-bold text-slate-900">
                ${expenses
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                  .toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
