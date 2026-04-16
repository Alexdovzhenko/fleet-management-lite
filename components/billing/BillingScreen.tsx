"use client"

import { useState, useMemo, useCallback } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { useBillingFilters } from "@/lib/hooks/use-billing-filters"
import { useBillingInvoices, useSettleInvoiceMutation, useBillingAccounts } from "@/lib/hooks/use-billing-invoices"
import { toast } from "sonner"
import type { Invoice } from "@/types"
import { BillingSearchBar } from "./BillingSearchBar"
import { BillingDatePicker } from "./BillingDatePicker"
import { AccountFilterDropdown } from "./AccountFilterDropdown"
import { InvoiceTabs } from "./InvoiceTabs"
import { InvoiceList } from "./InvoiceList"
import { SettleConfirmModal } from "./SettleConfirmModal"

export function BillingScreen() {
  const [activeTab, setActiveTab] = useState<"OPEN" | "SETTLED">("OPEN")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const { filters, setSearch, setDate, setAccountId, clearFilters } = useBillingFilters()
  const debouncedSearch = useDebounce(filters.search, 300)

  // Build filters for API
  const apiFilters = {
    ...filters,
    search: debouncedSearch,
  }

  // Fetch invoices for both tabs
  const { data: openInvoices, isLoading: openLoading, isError: openError } = useBillingInvoices("OPEN", apiFilters)
  const { data: settledInvoices, isLoading: settledLoading, isError: settledError } = useBillingInvoices("SETTLED", apiFilters)

  // Fetch accounts for the dropdown
  const { data: accountsData, isLoading: accountsLoading } = useBillingAccounts()

  // Settle invoice mutation
  const { mutate: settleInvoice, isPending: isSettling } = useSettleInvoiceMutation()

  // Format accounts for dropdown
  const dropdownAccounts = useMemo(() => {
    if (!accountsData) return []
    return [
      ...accountsData.customers.map((c) => ({
        id: c.id,
        name: c.name,
        type: "CUSTOMER" as const,
      })),
      ...accountsData.affiliates.map((a) => ({
        id: a.id,
        name: a.name,
        type: "AFFILIATE" as const,
      })),
    ]
  }, [accountsData])

  // Get current tab data
  const currentInvoices = activeTab === "OPEN" ? openInvoices : settledInvoices
  const isLoading = activeTab === "OPEN" ? openLoading : settledLoading
  const isError = activeTab === "OPEN" ? openError : settledError

  // Counts for tabs
  const openCount = openInvoices?.length ?? 0
  const settledCount = settledInvoices?.length ?? 0

  // Handle mark as settled
  const handleMarkSettled = useCallback(
    (invoice: Invoice) => {
      setSelectedInvoice(invoice)
      setShowConfirmModal(true)
    },
    []
  )

  const handleConfirmSettle = useCallback(() => {
    if (!selectedInvoice) return

    settleInvoice(selectedInvoice.id, {
      onSuccess: () => {
        toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as settled`)
        setShowConfirmModal(false)
        setSelectedInvoice(null)
        // Auto-switch to SETTLED tab if no more open invoices
        if (openCount <= 1) {
          setActiveTab("SETTLED")
        }
      },
      onError: () => {
        toast.error("Failed to settle invoice")
      },
    })
  }, [selectedInvoice, settleInvoice, openCount])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <BillingSearchBar value={filters.search} onChange={setSearch} />
          </div>
          <BillingDatePicker value={filters.date} onChange={setDate} />
          <AccountFilterDropdown
            accounts={dropdownAccounts}
            value={filters.accountId}
            onChange={setAccountId}
            isLoading={accountsLoading}
          />
        </div>

        {/* Clear filters hint */}
        {(filters.search || filters.date || filters.accountId) && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Tabs */}
      <InvoiceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openCount={openCount}
        settledCount={settledCount}
      />

      {/* Invoice List */}
      <InvoiceList
        invoices={currentInvoices}
        isLoading={isLoading}
        isError={isError}
        onMarkSettled={(invoiceId) => {
          const invoice = currentInvoices?.find((i) => i.id === invoiceId)
          if (invoice) handleMarkSettled(invoice)
        }}
        onClearFilters={clearFilters}
        isSettledTab={activeTab === "SETTLED"}
      />

      {/* Settle Confirmation Modal */}
      <SettleConfirmModal
        isOpen={showConfirmModal}
        invoice={selectedInvoice}
        isLoading={isSettling}
        onConfirm={handleConfirmSettle}
        onCancel={() => {
          setShowConfirmModal(false)
          setSelectedInvoice(null)
        }}
      />
    </div>
  )
}
