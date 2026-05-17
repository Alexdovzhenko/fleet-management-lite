"use client"

import { useState } from "react"
import { Search, Plus, Phone, Mail, Users, X, Building2 } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useCustomers, useCreateCustomer } from "@/lib/hooks/use-customers"
import { CustomerForm } from "@/components/customers/customer-form"
import { CustomerDetailDialog } from "@/components/customers/customer-detail-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { getInitials, formatPhone, formatDate, cn } from "@/lib/utils"
import { useDebounce } from "@/lib/hooks/use-debounce"

const FILTER_TABS = [
  { id: "",           label: "All" },
  { id: "corporate",  label: "Corporate" },
  { id: "repeat",     label: "Repeat" },
] as const

type FilterId = typeof FILTER_TABS[number]["id"]

export default function CustomersPage() {
  const { isDark } = useTheme()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterId>("")
  const [showForm, setShowForm] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [nextNumber, setNextNumber] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 300)

  const { data: allCustomers, isLoading, refetch } = useCustomers(debouncedSearch)
  const createCustomer = useCreateCustomer()

  const totalCount     = allCustomers?.length ?? 0
  const corporateCount = allCustomers?.filter(c => !!c.company).length ?? 0
  const repeatCount    = allCustomers?.filter(c => (c as never as { _count: { trips: number } })._count?.trips >= 2).length ?? 0

  const customers = allCustomers?.filter(c => {
    if (filter === "corporate") return !!c.company
    if (filter === "repeat")    return (c as never as { _count: { trips: number } })._count?.trips >= 2
    return true
  })

  async function openForm() {
    setShowForm(true)
    setNextNumber(null)
    try {
      const res = await fetch("/api/customers/next-number")
      if (res.ok) {
        const { nextNumber: n } = await res.json()
        setNextNumber(n)
      }
    } catch {}
  }

  async function handleCreate(data: object) {
    setCreateError(null)
    try {
      await createCustomer.mutateAsync(data as never)
      setShowForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create customer")
    }
  }

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
            {/* Top row */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <Users className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Customers
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}>
                    {isLoading ? "Loading…" : totalCount === 0 ? "No customers yet" : `${totalCount} customer${totalCount !== 1 ? "s" : ""} in your directory`}
                  </p>
                </div>
              </div>

              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {(isDark ? [
                  { label: "Total",     value: totalCount,     bg: "rgba(201,168,124,0.14)", border: "rgba(201,168,124,0.25)", color: "#e8c898", dot: "#c9a87c" },
                  { label: "Corporate", value: corporateCount, bg: "rgba(139,92,246,0.14)",  border: "rgba(139,92,246,0.28)",  color: "#c4b5fd", dot: "#a78bfa" },
                  { label: "Repeat",    value: repeatCount,    bg: "rgba(52,211,153,0.14)",  border: "rgba(52,211,153,0.28)",  color: "#6ee7b7", dot: "#34d399" },
                ] : [
                  { label: "Total",     value: totalCount,     bg: "#FEF3C7", border: "#FCD34D", color: "#92400E", dot: "#D97706" },
                  { label: "Corporate", value: corporateCount, bg: "#EDE9FE", border: "#C4B5FD", color: "#4C1D95", dot: "#7C3AED" },
                  { label: "Repeat",    value: repeatCount,    bg: "#D1FAE5", border: "#6EE7B7", color: "#065F46", dot: "#059669" },
                ]).map(s => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums font-bold">{s.value}</span>
                    <span className="font-medium opacity-75">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            {/* Controls row */}
            <div className="flex items-center gap-2.5 px-5 py-3.5">

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="h-9 pl-8.5 pr-8 w-full text-[13px] rounded-xl outline-none transition-all duration-200 font-medium"
                  style={{
                    background: "var(--lc-bg-glass)",
                    border: "1px solid var(--lc-bg-glass-hover)",
                    color: "var(--lc-text-primary)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: "var(--lc-text-muted)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div
                className="flex items-center gap-0.5 rounded-[11px] p-1"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
              >
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                    style={filter === tab.id
                      ? { background: "var(--lc-border)", color: "var(--lc-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                      : { color: "var(--lc-text-dim)" }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              {/* Add Customer CTA */}
              <button
                onClick={openForm}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 select-none cursor-pointer"
                style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Customer</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* ── Customer list ── */}
          {isLoading ? (
            <TableSkeleton rows={6} dark />
          ) : !customers?.length ? (
            <EmptyState
              icon={Users}
              title="No customers yet"
              description="Add your first customer to start booking trips."
              actionLabel="Add Customer"
              onAction={openForm}
            />
          ) : (
            <div className="space-y-2">
              {customers.map((customer) => {
                const tripCount = (customer as never as { _count: { trips: number } })._count?.trips || 0
                return (
                  <button
                    key={customer.id}
                    onClick={() => setSelectedId(customer.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-150 text-left cursor-pointer"
                    style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#111e35"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-border)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-surface)"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-bg-glass-mid)"
                    }}
                  >
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback
                        className="text-sm font-semibold"
                        style={{ background: "rgba(201,168,124,0.12)", color: "#c9a87c", border: "1px solid rgba(201,168,124,0.25)" }}
                      >
                        {getInitials(customer.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name + contact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold truncate" style={{ color: "var(--lc-text-primary)" }}>
                          {customer.name}
                        </span>
                        {customer.customerNumber && (
                          <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "var(--lc-text-muted)" }}>
                            #{customer.customerNumber}
                          </span>
                        )}
                        {customer.company && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium flex-shrink-0" style={{ color: "var(--lc-text-dim)" }}>
                            <Building2 className="w-3 h-3" />
                            {customer.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {customer.phone && (
                          <span className="text-[12px] flex items-center gap-1" style={{ color: "var(--lc-text-dim)" }}>
                            <Phone className="w-3 h-3" />
                            {formatPhone(customer.phone)}
                          </span>
                        )}
                        {customer.email && (
                          <span className="hidden sm:flex text-[12px] items-center gap-1" style={{ color: "var(--lc-text-dim)" }}>
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: date + trip count */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] hidden md:block" style={{ color: "var(--lc-text-muted)" }}>
                        Added {formatDate(customer.createdAt)}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: tripCount >= 2 ? "rgba(52,211,153,0.10)" : "var(--lc-bg-glass-mid)",
                          color: tripCount >= 2 ? "rgba(52,211,153,0.90)" : "var(--lc-text-dim)",
                        }}
                      >
                        {tripCount} {tripCount === 1 ? "trip" : "trips"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

        </div>
      </div>

      {/* Customer Detail Dialog */}
      <CustomerDetailDialog
        customerId={selectedId}
        onClose={() => setSelectedId(null)}
        onDeleted={() => refetch()}
      />

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setCreateError(null) }}
            isLoading={createCustomer.isPending}
            error={createError}
            nextNumber={nextNumber ?? undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
