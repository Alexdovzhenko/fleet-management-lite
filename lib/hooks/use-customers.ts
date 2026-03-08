import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Customer } from "@/types"

const COMPANY_ID = "demo-company"

async function fetchCustomers(search = ""): Promise<Customer[]> {
  const params = new URLSearchParams({ companyId: COMPANY_ID, search })
  const res = await fetch(`/api/customers?${params}`)
  if (!res.ok) throw new Error("Failed to fetch customers")
  return res.json()
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`)
  if (!res.ok) throw new Error("Failed to fetch customer")
  return res.json()
}

async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, companyId: COMPANY_ID }),
  })
  if (!res.ok) throw new Error("Failed to create customer")
  return res.json()
}

async function updateCustomer({ id, ...data }: Partial<Customer> & { id: string }): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update customer")
  return res.json()
}

async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`/api/customers/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete customer")
}

export function useCustomers(search = "") {
  return useQuery({
    queryKey: ["customers", search],
    queryFn: () => fetchCustomers(search),
    staleTime: 30_000,
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => fetchCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ["customers"] })
      qc.setQueryData(["customers", customer.id], customer)
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  })
}
