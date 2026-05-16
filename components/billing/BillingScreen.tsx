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
import { FileText, X } from "lucide-react"

export function BillingScreen() {
  const [activeTab, setActiveTab] = useState<"OPEN" | "SETTLED">("OPEN")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState<Invoice | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const { filters, setSearch, setDateRange, setAccountId, clearFilters } = useBillingFilters()
  const debouncedSearch = useDebounce(filters.search, 300)

  const apiFilters = { ...filters, search: debouncedSearch }

  const { data: openInvoices,    isLoading: openLoading,    isError: openError    } = useBillingInvoices("OPEN",    apiFilters)
  const { data: settledInvoices, isLoading: settledLoading, isError: settledError } = useBillingInvoices("SETTLED", apiFilters)
  const { data: accountsData, isLoading: accountsLoading } = useBillingAccounts()
  const { mutate: settleInvoice, isPending: isSettling } = useSettleInvoiceMutation()

  const dropdownAccounts = useMemo(() => {
    if (!accountsData) return []
    return [
      ...accountsData.customers.map((c) => ({ id: c.id, name: c.name, type: "CUSTOMER" as const })),
      ...accountsData.affiliates.map((a) => ({ id: a.id, name: a.name, type: "AFFILIATE" as const })),
    ]
  }, [accountsData])

  const currentInvoices = activeTab === "OPEN" ? openInvoices : settledInvoices
  const isLoading       = activeTab === "OPEN" ? openLoading  : settledLoading
  const isError         = activeTab === "OPEN" ? openError    : settledError

  const openCount    = openInvoices?.length    ?? 0
  const settledCount = settledInvoices?.length ?? 0

  const totalOutstanding = openInvoices?.reduce(
    (sum, inv) => sum + parseFloat(String((inv as { total?: string | number }).total || 0)), 0
  ) ?? 0

  const handleViewDetails  = useCallback((invoice: Invoice) => { setSelectedDetailInvoice(invoice); setShowDetailModal(true) }, [])
  const handleMarkSettled  = useCallback((invoice: Invoice) => { setSelectedInvoice(invoice); setShowConfirmModal(true) }, [])

  const handleConfirmSettle = useCallback(() => {
    if (!selectedInvoice) return
    settleInvoice(selectedInvoice.id, {
      onSuccess: () => {
        toast.success(`Invoice ${selectedInvoice.invoiceNumber} marked as settled`)
        setShowConfirmModal(false)
        setSelectedInvoice(null)
        if (openCount <= 1) setActiveTab("SETTLED")
      },
      onError: () => toast.error("Failed to settle invoice"),
    })
  }, [selectedInvoice, settleInvoice, openCount])

  const hasActiveFilters = filters.search || filters.dateStart || filters.dateEnd || filters.accountId

  return (
    <>
      {/* Dark backdrop behind dock nav */}
      <div
        className="fixed bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "var(--lc-bg-page)", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "var(--lc-bg-page)", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-6xl mx-auto space-y-3">

          {/* ── Header card ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            {/* Title row */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <FileText className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Billing
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}>
                    {isLoading ? "Loading…" : openCount === 0 ? "All invoices are settled" : `${openCount} open invoice${openCount !== 1 ? "s" : ""} · $${totalOutstanding.toFixed(2)} outstanding`}
                  </p>
                </div>
              </div>

              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {[
                  { label: "Open",    value: openCount,    bg: "rgba(251,191,36,0.10)", color: "rgba(251,191,36,0.90)", dot: "#fbbf24" },
                  { label: "Settled", value: settledCount, bg: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399" },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: s.bg, color: s.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums">{s.value}</span>
                    <span className="font-medium" style={{ opacity: 0.7 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            {/* Controls row */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 flex-wrap">
              <div className="flex-1 min-w-[160px] max-w-xs">
                <BillingSearchBar value={filters.search} onChange={setSearch} />
              </div>

              <BillingDatePicker
                startDate={filters.dateStart}
                endDate={filters.dateEnd}
                onChange={setDateRange}
              />

              <AccountFilterDropdown
                accounts={dropdownAccounts}
                value={filters.accountId}
                onChange={setAccountId}
                isLoading={accountsLoading}
              />

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer"
                  style={{ color: "var(--lc-text-dim)", background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = "#f87171"
                    ;(e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = "var(--lc-text-dim)"
                    ;(e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)"
                  }}
                >
                  Clear
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            {/* Tabs row */}
            <div className="px-3">
              <InvoiceTabs
                activeTab={activeTab}
                onTabChange={(t) => setActiveTab(t)}
                openCount={openCount}
                settledCount={settledCount}
              />
            </div>
          </div>

          {/* ── Invoice list ── */}
          <InvoiceList
            invoices={currentInvoices}
            isLoading={isLoading}
            isError={isError}
            onMarkSettled={(invoiceId) => {
              const inv = currentInvoices?.find((i) => i.id === invoiceId)
              if (inv) handleMarkSettled(inv)
            }}
            onViewDetails={handleViewDetails}
            onClearFilters={clearFilters}
            isSettledTab={activeTab === "SETTLED"}
          />
        </div>
      </div>

      <SettleConfirmModal
        isOpen={showConfirmModal}
        invoice={selectedInvoice}
        isLoading={isSettling}
        onConfirm={handleConfirmSettle}
        onCancel={() => { setShowConfirmModal(false); setSelectedInvoice(null) }}
      />

      <InvoiceDetailModal
        open={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedDetailInvoice(null) }}
        invoice={selectedDetailInvoice}
      />
    </>
  )
}
