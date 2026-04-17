import { useState, useCallback } from "react"

export interface BillingFilters {
  search: string
  dateStart: string | null
  dateEnd: string | null
  accountId: string | null
}

export function useBillingFilters() {
  const [filters, setFilters] = useState<BillingFilters>({
    search: "",
    dateStart: null,
    dateEnd: null,
    accountId: null,
  })

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }))
  }, [])

  const setDateRange = useCallback((startDate: string | null, endDate: string | null) => {
    setFilters((prev) => ({ ...prev, dateStart: startDate, dateEnd: endDate }))
  }, [])

  const setAccountId = useCallback((accountId: string | null) => {
    setFilters((prev) => ({ ...prev, accountId }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      dateStart: null,
      dateEnd: null,
      accountId: null,
    })
  }, [])

  return {
    filters,
    setSearch,
    setDateRange,
    setAccountId,
    clearFilters,
  }
}
