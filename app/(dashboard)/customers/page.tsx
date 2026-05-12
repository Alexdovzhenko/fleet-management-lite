"use client"

import { useState } from "react"
import { Search, Plus, Phone, Mail, Users, X, Building2 } from "lucide-react"
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
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "#080c16", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "#080c16", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-6xl mx-auto space-y-3">

          {/* ── Header card ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
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
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em" }}>
                    {isLoading ? "Loading…" : totalCount === 0 ? "No customers yet" : `${totalCount} customer${totalCount !== 1 ? "s" : ""} in your directory`}
                  </p>
                </div>
              </div>

              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {[
                  { label: "Total",     value: totalCount,     bg: "rgba(201,168,124,0.10)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c" },
                  { label: "Corporate", value: corporateCount, bg: "rgba(139,92,246,0.10)",  color: "rgba(167,139,250,0.90)", dot: "#a78bfa" },
                  { label: "Repeat",    value: repeatCount,    bg: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399" },
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
            <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Controls row */}
            <div className="flex items-center gap-2.5 px-5 py-3.5">

              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(200,212,228,0.38)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="h-9 pl-8.5 pr-8 w-full text-[13px] rounded-xl outline-none transition-all duration-200 font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(255,255,255,0.09)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: "rgba(200,212,228,0.38)" }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div
                className="flex items-center gap-0.5 rounded-[11px] p-1"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                    style={filter === tab.id
                      ? { background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.92)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                      : { color: "rgba(200,212,228,0.55)" }
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
                style={{ background: "#c9a87c", color: "#080c16", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
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
                    style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#111e35"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "#0d1526"
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"
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
                        <span className="text-[13px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>
                          {customer.name}
                        </span>
                        {customer.customerNumber && (
                          <span className="text-[11px] font-mono flex-shrink-0" style={{ color: "rgba(200,212,228,0.38)" }}>
                            #{customer.customerNumber}
                          </span>
                        )}
                        {customer.company && (
                          <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium flex-shrink-0" style={{ color: "rgba(200,212,228,0.55)" }}>
                            <Building2 className="w-3 h-3" />
                            {customer.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        {customer.phone && (
                          <span className="text-[12px] flex items-center gap-1" style={{ color: "rgba(200,212,228,0.55)" }}>
                            <Phone className="w-3 h-3" />
                            {formatPhone(customer.phone)}
                          </span>
                        )}
                        {customer.email && (
                          <span className="hidden sm:flex text-[12px] items-center gap-1" style={{ color: "rgba(200,212,228,0.55)" }}>
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: date + trip count */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[11px] hidden md:block" style={{ color: "rgba(200,212,228,0.38)" }}>
                        Added {formatDate(customer.createdAt)}
                      </span>
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: tripCount >= 2 ? "rgba(52,211,153,0.10)" : "rgba(255,255,255,0.07)",
                          color: tripCount >= 2 ? "rgba(52,211,153,0.90)" : "rgba(200,212,228,0.55)",
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
