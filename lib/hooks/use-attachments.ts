import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { TripAttachment } from "@/types"

/**
 * Edit mode: upload directly to /api/trips/[tripId]/attachments
 * Returns the newly created TripAttachment record
 */
export function useUploadAttachment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File): Promise<TripAttachment> => {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/trips/${tripId}/attachments`, {
        method: "POST",
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? "Upload failed")
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips", tripId] }),
  })
}

/**
 * Edit mode: delete an existing attachment
 */
export function useDeleteAttachment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (attachmentId: string): Promise<void> => {
      const res = await fetch(`/api/trips/${tripId}/attachments/${attachmentId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete attachment")
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trips", tripId] }),
  })
}

/**
 * Create mode: pre-upload to staging bucket
 * Returns metadata that can be passed to the trip creation API
 */
export async function preUploadAttachment(file: File): Promise<{
  url: string
  storagePath: string
  name: string
  mimeType: string
  size: number
}> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/uploads/trip-attachment", {
    method: "POST",
    body: fd,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? "Pre-upload failed")
  }
  return res.json()
}
