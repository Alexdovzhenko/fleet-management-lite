"use client"

import { useState } from "react"
import { Search, Plus, Phone, Mail, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
    <div className="space-y-4 max-w-6xl mx-auto">

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">

        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", boxShadow: "0 4px 12px rgba(37,99,235,0.20)" }}
            >
              <Users className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 leading-tight">Customer Directory</h1>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-tight">
                {isLoading ? "Loading..." : totalCount === 0 ? "No customers yet" : `${totalCount} customer${totalCount !== 1 ? "s" : ""} in your directory`}
              </p>
            </div>
          </div>

          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "Total",     value: totalCount,     dot: "bg-blue-500" },
              { label: "Corporate", value: corporateCount, dot: "bg-violet-500" },
              { label: "Repeat",    value: repeatCount,    dot: "bg-emerald-500" },
            ]).map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center px-5 py-3 min-w-[80px]">
                <span className="text-[22px] font-bold leading-none tracking-tight text-gray-800">{stat.value}</span>
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stat.dot)} />
                  <span className="text-[11px] text-gray-400 font-medium leading-none whitespace-nowrap">{stat.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        <div className="flex items-center gap-3 px-6 py-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              className="w-full h-9 pl-8 pr-8 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 placeholder:text-gray-300 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                  filter === tab.id
                    ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <Button
            onClick={openForm}
            className="h-9 text-sm font-semibold text-white gap-1.5 px-4"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <TableSkeleton rows={6} />
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
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => setSelectedId(customer.id)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all text-left"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ backgroundColor: "#2E4369" }}
                >
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {customer.name}
                  </span>
                  {customer.customerNumber && (
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                      #{customer.customerNumber}
                    </span>
                  )}
                  {customer.company && (
                    <span className="text-xs text-gray-500 truncate hidden sm:block">
                      · {customer.company}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {customer.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {formatPhone(customer.phone)}
                    </span>
                  )}
                  {customer.email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 hidden sm:flex">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400 hidden md:block">
                  Added {formatDate(customer.createdAt)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {(customer as never as { _count: { trips: number } })._count?.trips || 0} trips
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

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
    </div>
  )
}
