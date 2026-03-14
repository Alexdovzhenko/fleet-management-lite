import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

const QK = ["service-types"]

export interface ServiceType {
  id: string
  value: string
  label: string
  description: string | null
  iconName: string
  color: string
  isBuiltIn: boolean
  isEnabled: boolean
  sortOrder: number
}

async function fetchServiceTypes(): Promise<ServiceType[]> {
  const res = await fetch("/api/service-types")
  if (!res.ok) throw new Error("Failed to fetch service types")
  return res.json()
}

export function useServiceTypes() {
  return useQuery({ queryKey: QK, queryFn: fetchServiceTypes, staleTime: 30_000 })
}

export function useToggleServiceType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      fetch(`/api/service-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      }).then((r) => r.json()),
    onMutate: async ({ id, isEnabled }) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<ServiceType[]>(QK)
      qc.setQueryData<ServiceType[]>(QK, (old) =>
        old?.map((t) => (t.id === id ? { ...t, isEnabled } : t))
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev)
    },
  })
}

export function useCreateServiceType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { label: string; description?: string; iconName: string; color: string }) =>
      fetch("/api/service-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}

export function useDeleteServiceType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/service-types/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  })
}
