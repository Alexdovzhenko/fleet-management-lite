import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Invoice } from "@/types"
import type { BillingFilters } from "./use-billing-filters"

export function useBillingInvoices(status: "OPEN" | "SETTLED", filters: BillingFilters) {
  const queryKey = ["billing-invoices", status, filters]

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        status,
        ...(filters.search && { search: filters.search }),
        ...(filters.date && { date: filters.date }),
        ...(filters.accountId && { accountId: filters.accountId }),
      })

      const response = await fetch(`/api/billing/invoices?${params}`)
      if (!response.ok) throw new Error("Failed to fetch invoices")
      return response.json() as Promise<Invoice[]>
    },
    staleTime: 30_000, // 30 seconds
  })
}

export function useSettleInvoiceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/settle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settledAt: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error("Failed to settle invoice")
      return response.json() as Promise<Invoice>
    },
    onSuccess: () => {
      // Invalidate both OPEN and SETTLED queries
      queryClient.invalidateQueries({ queryKey: ["billing-invoices"] })
    },
  })
}

export function useBillingAccounts() {
  return useQuery({
    queryKey: ["billing-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/billing/accounts")
      if (!response.ok) throw new Error("Failed to fetch accounts")
      return response.json() as Promise<{
        customers: Array<{ id: string; name: string; company?: string }>
        affiliates: Array<{ id: string; name: string; company?: null }>
      }>
    },
    staleTime: 5 * 60_000, // 5 minutes
  })
}
