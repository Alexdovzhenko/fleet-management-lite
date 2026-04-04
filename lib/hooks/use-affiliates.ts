import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AffiliateProfile, AffiliateConnection } from "@/types"

// ─── List all affiliates (directory / browse) ───────────────────────────────

export interface AffiliateFilters {
  search?: string
  locations?: string[]
  vehicleTypes?: string[]
  minCapacity?: number
  enabled?: boolean
}

export function useAffiliates(filters: AffiliateFilters = {}) {
  const { search = "", locations = [], vehicleTypes = [], minCapacity = 0, enabled = true } = filters
  return useQuery<AffiliateProfile[]>({
    queryKey: ["affiliates", search, locations.join("|"), vehicleTypes.join(","), minCapacity],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (search)               sp.set("search",       search)
      locations.forEach((l) =>  sp.append("locations", l))
      if (vehicleTypes.length)  sp.set("vehicleTypes", vehicleTypes.join(","))
      if (minCapacity > 0)      sp.set("minCapacity",  String(minCapacity))
      const qs = sp.toString()
      const res = await fetch(`/api/affiliates${qs ? `?${qs}` : ""}`)
      if (!res.ok) throw new Error("Failed to fetch affiliates")
      return res.json()
    },
    staleTime: 30_000,
    enabled,
  })
}

// ─── Single affiliate public profile ────────────────────────────────────────

export function useAffiliate(id: string) {
  return useQuery<AffiliateProfile>({
    queryKey: ["affiliate", id],
    queryFn: async () => {
      const res = await fetch(`/api/affiliates/${id}`)
      if (!res.ok) throw new Error("Failed to fetch affiliate")
      return res.json()
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

// ─── Connections by type ─────────────────────────────────────────────────────

export function useAffiliateConnections(type: "pending" | "sent" | "connected" | "all" = "all") {
  return useQuery<AffiliateConnection[]>({
    queryKey: ["affiliate-connections", type],
    queryFn: async () => {
      const res = await fetch(`/api/affiliates/connections?type=${type}`)
      if (!res.ok) throw new Error("Failed to fetch connections")
      return res.json()
    },
    staleTime: 20_000,
  })
}

// ─── Pending count (for notification badge) ──────────────────────────────────

export function useAffiliatePendingCount() {
  return useQuery<{ count: number }>({
    queryKey: ["affiliate-pending-count"],
    queryFn: async () => {
      const res = await fetch("/api/affiliates/connections/pending-count")
      if (!res.ok) return { count: 0 }
      return res.json()
    },
    staleTime: 30_000,
    refetchInterval: 60_000, // poll every 60s
  })
}

// ─── Send connection request ─────────────────────────────────────────────────

export function useSendConnectionRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (receiverId: string) => {
      const res = await fetch("/api/affiliates/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to send request")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliates"] })
      qc.invalidateQueries({ queryKey: ["affiliate-connections"] })
      qc.invalidateQueries({ queryKey: ["affiliate-pending-count"] })
    },
  })
}

// ─── Respond to / cancel a connection ────────────────────────────────────────

type ConnectionAction = "accept" | "decline" | "cancel"

export function useRespondToConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: string; action: ConnectionAction }) => {
      const res = await fetch(`/api/affiliates/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update connection")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliates"] })
      qc.invalidateQueries({ queryKey: ["affiliate-connections"] })
      qc.invalidateQueries({ queryKey: ["affiliate-pending-count"] })
      // Refresh any open profile pages
      qc.invalidateQueries({ queryKey: ["affiliate"] })
    },
  })
}

// ─── Favorites ───────────────────────────────────────────────────────────────

type FavoriteEntry = { id: string; favoriteId: string; createdAt: string }

/** Returns the current company's favorites as a Set of favoriteId strings for O(1) lookup. */
export function useAffiliateFavorites() {
  const query = useQuery<FavoriteEntry[]>({
    queryKey: ["affiliate-favorites"],
    queryFn: async () => {
      const res = await fetch("/api/affiliates/favorites")
      if (!res.ok) throw new Error("Failed to fetch favorites")
      return res.json()
    },
    staleTime: 30_000,
  })
  const favoriteIds = new Set((query.data ?? []).map((f) => f.favoriteId))
  return { ...query, favoriteIds }
}

export function useToggleAffiliateFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ affiliateId, isFavorite }: { affiliateId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        // Remove
        const res = await fetch(`/api/affiliates/favorites/${affiliateId}`, { method: "DELETE" })
        if (!res.ok) throw new Error("Failed to remove favorite")
        return res.json()
      } else {
        // Add
        const res = await fetch("/api/affiliates/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favoriteId: affiliateId }),
        })
        if (!res.ok) throw new Error("Failed to add favorite")
        return res.json()
      }
    },
    // Optimistic update — flip the cached favorites list immediately
    onMutate: async ({ affiliateId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: ["affiliate-favorites"] })
      const prev = qc.getQueryData<FavoriteEntry[]>(["affiliate-favorites"]) ?? []
      if (isFavorite) {
        qc.setQueryData(["affiliate-favorites"], prev.filter((f) => f.favoriteId !== affiliateId))
      } else {
        qc.setQueryData(["affiliate-favorites"], [
          ...prev,
          { id: `optimistic-${affiliateId}`, favoriteId: affiliateId, createdAt: new Date().toISOString() },
        ])
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["affiliate-favorites"], ctx.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["affiliate-favorites"] })
    },
  })
}

// ─── Remove an accepted connection ──────────────────────────────────────────

export function useRemoveConnection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const res = await fetch(`/api/affiliates/connections/${connectionId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to remove connection")
      }
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affiliates"] })
      qc.invalidateQueries({ queryKey: ["affiliate-connections"] })
      qc.invalidateQueries({ queryKey: ["affiliate-pending-count"] })
      qc.invalidateQueries({ queryKey: ["affiliate"] })
    },
  })
}
