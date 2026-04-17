"use client"

import { useState } from "react"
import { useCreateExpenseMutation } from "@/lib/hooks/use-earnings"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"

export function ExpenseForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    category: "VARIABLE" as "FIXED" | "VARIABLE",
    subcategory: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vehicleId: "",
    isRecurring: false,
    recurrenceDay: undefined as number | undefined,
    notes: "",
  })

  const { mutate: createExpense, isPending } = useCreateExpenseMutation()

  // Fetch vehicles
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles")
      if (!res.ok) throw new Error("Failed to fetch vehicles")
      return res.json()
    },
    staleTime: 10 * 60_000,
  })

  const subcategoryOptions: Record<"FIXED" | "VARIABLE", string[]> = {
    FIXED: [
      "Car Payment",
      "Insurance",
      "Registration",
      "Maintenance Contract",
      "Lease",
      "Loan Payment",
    ],
    VARIABLE: [
      "Driver Salary",
      "Gas",
      "Maintenance",
      "Repairs",
      "Tolls",
      "Parking",
      "Other",
    ],
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.subcategory || !formData.amount) {
      toast.error("Please fill in all required fields")
      return
    }

    createExpense(
      {
        ...formData,
        amount: parseFloat(formData.amount).toFixed(2),
        recurrenceDay: formData.isRecurring ? formData.recurrenceDay : null,
      },
      {
        onSuccess: () => {
          toast.success("Expense created")
          setIsOpen(false)
          setFormData({
            category: "VARIABLE",
            subcategory: "",
            amount: "",
            date: new Date().toISOString().split("T")[0],
            vehicleId: "",
            isRecurring: false,
            recurrenceDay: undefined,
            notes: "",
          })
        },
        onError: () => {
          toast.error("Failed to create expense")
        },
      }
    )
  }

  return (
    <>
      {/* Add Expense Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Expense
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Add Expense</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as "FIXED" | "VARIABLE"
                    setFormData({
                      ...formData,
                      category: cat,
                      subcategory: "",
                    })
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FIXED">Fixed (Recurring)</option>
                  <option value="VARIABLE">Variable (One-time)</option>
                </select>
              </div>

              {/* Subcategory */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select type...</option>
                  {subcategoryOptions[formData.category].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Vehicle (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Vehicle (Optional)
                </label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Company-wide</option>
                  {vehicles?.map((v: { id: string; name: string }) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring (for Fixed) */}
              {formData.category === "FIXED" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Set as recurring monthly
                    </span>
                  </label>

                  {formData.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Recur on day of month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurrenceDay || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recurrenceDay: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="1-31"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  rows={2}
                  placeholder="Optional notes..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isPending ? "Adding..." : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
