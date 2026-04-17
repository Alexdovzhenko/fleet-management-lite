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
import { InvoiceDetailModal } from "./InvoiceDetailModal"
import { X } from "lucide-react"

export function BillingScreen() {
  const [activeTab, setActiveTab] = useState<"OPEN" | "SETTLED">("OPEN")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<Invoice | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

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

  // Handle view invoice details
  const handleViewDetails = useCallback(
    (invoice: Invoice) => {
      setSelectedDetailInvoice(invoice)
      setShowDetailModal(true)
    },
    []
  )

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

  const hasActiveFilters = filters.search || filters.date || filters.accountId

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Apple-style Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/50">
        <div className="px-6 py-4 space-y-4">
          {/* Title Row */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track payment status</p>
          </div>

          {/* Search Bar - Primary Action */}
          <div className="flex-1">
            <BillingSearchBar value={filters.search} onChange={setSearch} />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <BillingDatePicker value={filters.date} onChange={setDate} />
            <AccountFilterDropdown
              accounts={dropdownAccounts}
              value={filters.accountId}
              onChange={setAccountId}
              isLoading={accountsLoading}
            />

            {/* Clear filters button */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-full transition-colors duration-150"
                aria-label="Clear all filters"
              >
                <span>Clear</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-t border-slate-200/50">
          <InvoiceTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            openCount={openCount}
            settledCount={settledCount}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <InvoiceList
            invoices={currentInvoices}
            isLoading={isLoading}
            isError={isError}
            onMarkSettled={(invoiceId) => {
              const invoice = currentInvoices?.find((i) => i.id === invoiceId)
              if (invoice) handleMarkSettled(invoice)
            }}
            onViewDetails={handleViewDetails}
            onClearFilters={clearFilters}
            isSettledTab={activeTab === "SETTLED"}
          />
        </div>
      </div>

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

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedDetailInvoice(null)
        }}
        invoice={selectedDetailInvoice}
      />
    </div>
  )
}
