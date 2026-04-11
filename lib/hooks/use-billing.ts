import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { TripPayment } from "@/types"

async function fetchPayments(tripId: string): Promise<TripPayment[]> {
  const res = await fetch(`/api/trips/${tripId}/payments`)
  if (!res.ok) throw new Error("Failed to fetch payments")
  return res.json()
}

async function addPayment(
  tripId: string,
  data: { amount: number; method: string; notes?: string; paidAt?: string }
): Promise<TripPayment> {
  const res = await fetch(`/api/trips/${tripId}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to add payment")
  return res.json()
}

async function deletePayment(tripId: string, paymentId: string): Promise<void> {
  const res = await fetch(`/api/trips/${tripId}/payments/${paymentId}`, {
    method: "DELETE",
  })
  if (!res.ok) throw new Error("Failed to delete payment")
}

export function usePayments(tripId: string | undefined) {
  return useQuery({
    queryKey: ["payments", tripId],
    queryFn: () => fetchPayments(tripId!),
    enabled: !!tripId,
  })
}

export function useAddPayment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { amount: number; method: string; notes?: string; paidAt?: string }) =>
      addPayment(tripId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", tripId] })
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
    },
  })
}

export function useDeletePayment(tripId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (paymentId: string) => deletePayment(tripId, paymentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments", tripId] })
      qc.invalidateQueries({ queryKey: ["trips", tripId] })
    },
  })
}
