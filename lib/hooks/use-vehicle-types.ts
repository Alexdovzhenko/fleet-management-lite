import { useQuery } from "@tanstack/react-query"

export interface VehicleTypeOption {
  value: string
  label: string
}

async function fetchVehicleTypes(): Promise<VehicleTypeOption[]> {
  const res = await fetch("/api/vehicles/types")
  if (!res.ok) throw new Error("Failed to fetch vehicle types")
  return res.json()
}

export function useVehicleTypes() {
  return useQuery({
    queryKey: ["vehicle-types"],
    queryFn: fetchVehicleTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
