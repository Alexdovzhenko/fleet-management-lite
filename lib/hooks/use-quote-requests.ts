"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { QuoteRequest } from "@/types"

export function useQuoteRequests() {
  return useQuery<QuoteRequest[]>({
    queryKey: ["quote-requests"],
    queryFn: async () => {
      const res = await fetch("/api/quote-requests")
      if (!res.ok) throw new Error("Failed to fetch quote requests")
      return res.json()
    },
  })
}

export function useUpdateQuoteRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; price?: number; status?: string }) => {
      const res = await fetch(`/api/quote-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update quote request")
      }
      return res.json() as Promise<QuoteRequest>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quote-requests"] }),
  })
}

export function useAcceptQuoteRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/quote-requests/${id}/accept`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to accept quote request")
      }
      return res.json() as Promise<{ quote: QuoteRequest; trip: { id: string; tripNumber: string } }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quote-requests"] })
      qc.invalidateQueries({ queryKey: ["trips"] })
    },
  })
}
