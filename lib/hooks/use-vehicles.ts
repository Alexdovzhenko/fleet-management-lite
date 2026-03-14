import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Vehicle } from "@/types"

async function fetchVehicles(status = ""): Promise<Vehicle[]> {
  const params = new URLSearchParams()
  if (status) params.set("status", status)
  const res = await fetch(`/api/vehicles?${params}`)
  if (!res.ok) throw new Error("Failed to fetch vehicles")
  return res.json()
}

async function createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await fetch("/api/vehicles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create vehicle")
  return res.json()
}

async function updateVehicle({ id, ...data }: Partial<Vehicle> & { id: string }): Promise<Vehicle> {
  const res = await fetch(`/api/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update vehicle")
  return res.json()
}

export function useVehicles(status = "") {
  return useQuery({
    queryKey: ["vehicles", status],
    queryFn: () => fetchVehicles(status),
    staleTime: 60_000,
  })
}

export function useCreateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  })
}

export function useUpdateVehicle() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateVehicle,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  })
}
