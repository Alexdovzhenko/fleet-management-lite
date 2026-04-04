"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { SenderEmail } from "@/types"

async function fetchSenderEmails(): Promise<SenderEmail[]> {
  const res = await fetch("/api/sender-emails")
  if (!res.ok) throw new Error("Failed to fetch sender emails")
  return res.json()
}

export function useSenderEmails() {
  return useQuery<SenderEmail[]>({
    queryKey: ["sender-emails"],
    queryFn: fetchSenderEmails,
    staleTime: 60_000,
  })
}

export function useCreateSenderEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; label?: string; isDefault?: boolean }) => {
      const res = await fetch("/api/sender-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Failed to create sender email")
      }
      return res.json() as Promise<SenderEmail>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sender-emails"] }),
  })
}

export function useUpdateSenderEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; email?: string; label?: string | null; isDefault?: boolean }) => {
      const res = await fetch(`/api/sender-emails/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? "Failed to update sender email")
      }
      return res.json() as Promise<SenderEmail>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sender-emails"] }),
  })
}

export function useDeleteSenderEmail() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sender-emails/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete sender email")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sender-emails"] }),
  })
}

export function useSendTripEmail() {
  return useMutation({
    mutationFn: async ({
      tripId,
      recipientType,
      recipientEmail,
      senderEmailId,
    }: {
      tripId: string
      recipientType: "driver" | "client" | "affiliate"
      recipientEmail?: string
      senderEmailId?: string
    }) => {
      const res = await fetch(`/api/trips/${tripId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType, recipientEmail, senderEmailId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to send email")
      return data as { success: boolean; messageId?: string }
    },
  })
}
