"use client"

import { useState } from "react"
import { Search, Plus, Phone, Mail, Building2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCustomers, useCreateCustomer } from "@/lib/hooks/use-customers"
import { CustomerForm } from "@/components/customers/customer-form"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { getInitials, formatPhone, formatDate } from "@/lib/utils"
import Link from "next/link"
import { useDebounce } from "@/lib/hooks/use-debounce"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  const { data: customers, isLoading } = useCustomers(debouncedSearch)
  const createCustomer = useCreateCustomer()

  function handleCreate(data: object) {
    createCustomer.mutate(data as never, {
      onSuccess: () => setShowForm(false),
    })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers..."
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="text-white gap-2"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
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
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="space-y-2">
          {customers.map((customer) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border hover:border-blue-300 hover:shadow-sm transition-all group"
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
                  {(customer as never as { customerNumber?: string }).customerNumber && (
                    <span className="text-xs font-mono text-gray-400 flex-shrink-0">
                      #{(customer as never as { customerNumber: string }).customerNumber}
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
            </Link>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createCustomer.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
