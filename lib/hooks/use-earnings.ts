import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Expense, ExpenseTemplate } from "@/types"

export interface EarningsSummary {
  period: { start: string; end: string }
  metrics: {
    totalRevenue: number
    collectedRevenue: number
    uncollectedRevenue: number
    totalExpenses: number
    fixedExpenses: number
    variableExpenses: number
    profit: number
  }
  deltas: {
    revenue: { pct: number; amount: number }
    expenses: { pct: number; amount: number }
  }
}

export interface EarningsBreakdown {
  revenueTrend?: Array<{ date: string; revenue: number }>
  collectionPie?: { collected: number; uncollected: number }
  expenseBreakdown?: { fixed: number; variable: number }
  fleetRanking?: Array<{
    vehicleId: string
    name: string
    type: string
    trips: number
    revenue: number
  }>
  fixedExpenses?: Array<{ subcategory: string; amount: number }>
  variableExpenses?: Array<{ subcategory: string; amount: number }>
  expenseDetails?: Array<{
    id: string
    category: string
    subcategory: string
    amount: number
    date: string
    vehicle: string
    notes?: string
  }>
  fleetPerformance?: Array<{
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

export function useEarningsSummary(
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["earnings-summary", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) throw new Error("Dates required")

      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/earnings/summary?${params}`)
      if (!response.ok) throw new Error("Failed to fetch earnings summary")
      return response.json() as Promise<EarningsSummary>
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60_000, // 5 minutes
  })
}

export function useEarningsBreakdown(
  tab: "overview" | "expenses" | "fleet" | "compare",
  startDate: string | null,
  endDate: string | null
) {
  return useQuery({
    queryKey: ["earnings-breakdown", tab, startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) throw new Error("Dates required")

      const params = new URLSearchParams({
        startDate,
        endDate,
        tab,
      })

      const response = await fetch(`/api/earnings/breakdown?${params}`)
      if (!response.ok) throw new Error("Failed to fetch earnings breakdown")
      return response.json() as Promise<EarningsBreakdown>
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60_000,
  })
}

export function useCreateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      category: "FIXED" | "VARIABLE"
      subcategory: string
      amount: string
      date: string
      vehicleId?: string | null
      isRecurring?: boolean
      recurrenceDay?: number | null
      notes?: string
    }) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create expense")
      return response.json() as Promise<Expense>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earnings-breakdown"] })
      queryClient.invalidateQueries({ queryKey: ["earnings-summary"] })
    },
  })
}

export function useUpdateExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      expenseId,
      data,
    }: {
      expenseId: string
      data: Partial<{
        category: "FIXED" | "VARIABLE"
        subcategory: string
        amount: string
        date: string
        vehicleId?: string | null
        isRecurring?: boolean
        recurrenceDay?: number | null
        notes?: string
      }>
    }) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update expense")
      return response.json() as Promise<Expense>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earnings-breakdown"] })
      queryClient.invalidateQueries({ queryKey: ["earnings-summary"] })
    },
  })
}

export function useDeleteExpenseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete expense")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earnings-breakdown"] })
      queryClient.invalidateQueries({ queryKey: ["earnings-summary"] })
    },
  })
}

export function useExpensesList(
  startDate: string | null,
  endDate: string | null,
  category?: "FIXED" | "VARIABLE"
) {
  return useQuery({
    queryKey: ["expenses-list", startDate, endDate, category],
    queryFn: async () => {
      if (!startDate || !endDate) throw new Error("Dates required")

      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(category && { category }),
      })

      const response = await fetch(`/api/expenses?${params}`)
      if (!response.ok) throw new Error("Failed to fetch expenses")
      return response.json() as Promise<Expense[]>
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60_000,
  })
}

// Expense Templates

export function useExpenseTemplates() {
  return useQuery({
    queryKey: ["expense-templates"],
    queryFn: async () => {
      const response = await fetch("/api/expense-templates")
      if (!response.ok) throw new Error("Failed to fetch templates")
      return response.json() as Promise<ExpenseTemplate[]>
    },
    staleTime: 10 * 60_000,
  })
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      category: "FIXED" | "VARIABLE"
      subcategory: string
      defaultAmount: string
      vehicleId?: string | null
    }) => {
      const response = await fetch("/api/expense-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create template")
      return response.json() as Promise<ExpenseTemplate>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-templates"] })
    },
  })
}

export function useUseTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      date,
      amount,
    }: {
      templateId: string
      date?: string
      amount?: string
    }) => {
      const response = await fetch(`/api/expense-templates/${templateId}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, amount }),
      })

      if (!response.ok) throw new Error("Failed to use template")
      return response.json() as Promise<Expense>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses-list"] })
      queryClient.invalidateQueries({ queryKey: ["expense-templates"] })
      queryClient.invalidateQueries({ queryKey: ["earnings-breakdown"] })
      queryClient.invalidateQueries({ queryKey: ["earnings-summary"] })
    },
  })
}

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await fetch(`/api/expense-templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete template")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-templates"] })
    },
  })
}
