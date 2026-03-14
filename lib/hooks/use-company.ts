import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Company } from "@/types"

async function fetchCompany(): Promise<Company> {
  const res = await fetch("/api/company")
  if (!res.ok) throw new Error("Failed to fetch company")
  return res.json()
}

async function updateCompany(data: Partial<Company>): Promise<Company> {
  const res = await fetch("/api/company", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update company")
  return res.json()
}

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: fetchCompany,
    staleTime: 60_000,
  })
}

export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (company) => qc.setQueryData(["company"], company),
  })
}
