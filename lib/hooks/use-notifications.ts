"use client"

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import type { AppNotification } from "@prisma/client"

export type NotificationTab = "all" | "affiliates" | "farmouts" | "reservations" | "unread"

async function fetchNotifications(tab: NotificationTab, cursor?: string) {
  const params = new URLSearchParams({ tab })
  if (cursor) params.set("cursor", cursor)
  const res = await fetch(`/api/notifications?${params}`)
  if (!res.ok) throw new Error("Failed to fetch notifications")
  return res.json() as Promise<{ notifications: AppNotification[]; nextCursor: string | null }>
}

async function fetchUnreadCount() {
  const res = await fetch("/api/notifications/unread-count")
  if (!res.ok) throw new Error("Failed to fetch unread count")
  return res.json() as Promise<{ count: number }>
}

export function useNotifications(tab: NotificationTab) {
  return useInfiniteQuery({
    queryKey: ["notifications", tab],
    queryFn: ({ pageParam }) => fetchNotifications(tab, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
}

export function useMarkAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notifId: string) => {
      const res = await fetch(`/api/notifications/${notifId}/read`, { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark as read")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
  })
}

export function useMarkAllAsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" })
      if (!res.ok) throw new Error("Failed to mark all as read")
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
  })
}
