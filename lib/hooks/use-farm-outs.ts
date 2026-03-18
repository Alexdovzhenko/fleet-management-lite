"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { FarmOut } from "@/types"

// ─── Fetch incoming pending farm-ins ───────────────────────────────────────

export function useIncomingFarmOuts() {
  return useQuery<FarmOut[]>({
    queryKey: ["farm-outs", "incoming"],
    queryFn: async () => {
      const res = await fetch("/api/farm-outs/incoming")
      if (!res.ok) throw new Error("Failed to fetch incoming farm-outs")
      return res.json()
    },
    refetchInterval: 30_000, // poll every 30 seconds
    staleTime: 20_000,
  })
}

// ─── Fetch farm-outs for a specific trip ───────────────────────────────────

export function useTripFarmOuts(tripId: string | null) {
  return useQuery<FarmOut[]>({
    queryKey: ["farm-outs", "trip", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/farm-out`)
      if (!res.ok) throw new Error("Failed to fetch trip farm-outs")
      return res.json()
    },
    enabled: !!tripId,
  })
}

// ─── Create a farm-out (send a trip to an affiliate) ───────────────────────

export function useCreateFarmOut(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      toCompanyId: string
      message?: string
      agreedPrice?: number
    }) => {
      const res = await fetch(`/api/trips/${tripId}/farm-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create farm-out")
      }
      return res.json() as Promise<FarmOut>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm-outs", "trip", tripId] })
    },
  })
}

// ─── Respond to a farm-in (accept / decline) ──────────────────────────────

export function useRespondToFarmOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ farmOutId, action }: { farmOutId: string; action: "ACCEPT" | "DECLINE" }) => {
      const res = await fetch(`/api/farm-outs/${farmOutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to respond to farm-out")
      }
      return res.json() as Promise<FarmOut>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm-outs"] })
    },
  })
}

// ─── Cancel a pending farm-out ─────────────────────────────────────────────

export function useCancelFarmOut(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (farmOutId: string) => {
      const res = await fetch(`/api/farm-outs/${farmOutId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to cancel farm-out")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farm-outs", "trip", tripId] })
    },
  })
}
