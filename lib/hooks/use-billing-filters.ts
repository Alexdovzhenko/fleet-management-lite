import { useState, useCallback } from "react"

export interface BillingFilters {
  search: string
  date: string | null
  accountId: string | null
}

export function useBillingFilters() {
  const [filters, setFilters] = useState<BillingFilters>({
    search: "",
    date: null,
    accountId: null,
  })

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setDate = useCallback((date: string | null) => {
    setFilters((prev) => ({ ...prev, date }))
  }, [])

  const setAccountId = useCallback((accountId: string | null) => {
    setFilters((prev) => ({ ...prev, accountId }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      date: null,
      accountId: null,
    })
  }, [])

  return {
    filters,
    setSearch,
    setDate,
    setAccountId,
    clearFilters,
  }
}
