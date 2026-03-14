import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Driver } from "@/types"

async function fetchDrivers(search = "", status = ""): Promise<Driver[]> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (status) params.set("status", status)
  const res = await fetch(`/api/drivers?${params}`)
  if (!res.ok) throw new Error("Failed to fetch drivers")
  return res.json()
}

async function fetchDriver(id: string): Promise<Driver> {
  const res = await fetch(`/api/drivers/${id}`)
  if (!res.ok) throw new Error("Failed to fetch driver")
  return res.json()
}

async function createDriver(data: Partial<Driver>): Promise<Driver> {
  const res = await fetch("/api/drivers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to create driver")
  return res.json()
}

async function updateDriver({ id, ...data }: Partial<Driver> & { id: string }): Promise<Driver> {
  const res = await fetch(`/api/drivers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update driver")
  return res.json()
}

async function deleteDriver(id: string): Promise<void> {
  const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete driver")
}

export function useDrivers(search = "", status = "") {
  return useQuery({
    queryKey: ["drivers", search, status],
    queryFn: () => fetchDrivers(search, status),
    staleTime: 30_000,
  })
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ["drivers", id],
    queryFn: () => fetchDriver(id),
    enabled: !!id,
  })
}

export function useCreateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  })
}

export function useUpdateDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateDriver,
    onSuccess: (driver) => {
      qc.invalidateQueries({ queryKey: ["drivers"] })
      qc.setQueryData(["drivers", driver.id], driver)
    },
  })
}

export function useDeleteDriver() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  })
}
