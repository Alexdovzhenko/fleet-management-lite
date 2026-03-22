"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useDebounce } from "./use-debounce"

export interface CompanyAddress {
  id: string
  companyId: string
  name?: string | null
  address1: string
  address2?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  phone?: string | null
  notes?: string | null
  useCount: number
  lastUsedAt: string
  createdAt: string
}

// ── Search (for autocomplete) ──────────────────────────────────────────────────
export function useAddressSearch(query: string) {
  const debouncedQ = useDebounce(query, 180)
  return useQuery<CompanyAddress[]>({
    queryKey: ["addresses", "search", debouncedQ],
    queryFn: async () => {
      if (!debouncedQ.trim()) return []
      const res = await fetch(`/api/addresses?q=${encodeURIComponent(debouncedQ)}&limit=8`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: debouncedQ.trim().length > 0,
    staleTime: 10_000,
  })
}

// ── List all (for settings) ────────────────────────────────────────────────────
export function useAddresses() {
  return useQuery<CompanyAddress[]>({
    queryKey: ["addresses"],
    queryFn: async () => {
      const res = await fetch("/api/addresses")
      if (!res.ok) throw new Error("Failed to fetch addresses")
      return res.json()
    },
    staleTime: 30_000,
  })
}

// ── Upsert (auto-save when stop is added) ─────────────────────────────────────
export function useUpsertAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<CompanyAddress, "id" | "companyId" | "useCount" | "lastUsedAt" | "createdAt">) => {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save address")
      return res.json() as Promise<CompanyAddress>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] })
    },
  })
}

// ── Update ─────────────────────────────────────────────────────────────────────
export function useUpdateAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CompanyAddress> & { id: string }) => {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update address")
      return res.json() as Promise<CompanyAddress>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] })
    },
  })
}

// ── Delete ─────────────────────────────────────────────────────────────────────
export function useDeleteAddress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete address")
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addresses"] })
    },
  })
}
