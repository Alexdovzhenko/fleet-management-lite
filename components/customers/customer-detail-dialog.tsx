"use client"

import { useState } from "react"
import { Phone, Mail, Building2, MapPin, Pencil, X, Trash2, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useCustomer, useDeleteCustomer, useUpdateCustomer } from "@/lib/hooks/use-customers"
import { CustomerForm } from "@/components/customers/customer-form"
import { getInitials, formatPhone } from "@/lib/utils"

interface CustomerDetailDialogProps {
  customerId: string | null
  onClose: () => void
  onDeleted: () => void
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

export function CustomerDetailDialog({ customerId, onClose, onDeleted }: CustomerDetailDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const { data: customer, isLoading, refetch } = useCustomer(customerId ?? "")
  const deleteCustomer = useDeleteCustomer()
  const updateCustomer = useUpdateCustomer()

  function handleClose() {
    onClose()
    setConfirmDelete(false)
    setIsEditing(false)
    setEditError(null)
  }

  async function handleDelete() {
    if (!customerId) return
    try {
      await deleteCustomer.mutateAsync(customerId)
      onDeleted()
      handleClose()
    } catch {}
  }

  async function handleEdit(data: object) {
    if (!customerId) return
    setEditError(null)
    try {
      await updateCustomer.mutateAsync({ id: customerId, ...(data as object) } as never)
      await refetch()
      setIsEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save changes")
    }
  }

  const cityStateLine = [
    [customer?.city, customer?.state].filter(Boolean).join(", "),
    customer?.zip,
  ].filter(Boolean).join(" ")

  const address = [
    customer?.homeAddress,
    customer?.addressLine2,
    cityStateLine,
    customer?.country,
  ].filter(Boolean).join("\n")

  const accountTypes = [
    customer?.isBillingContact && "Billing Contact",
    customer?.isPassenger && "Passenger",
    customer?.isBookingContact && "Booking Contact",
  ].filter(Boolean) as string[]

  return (
    <Dialog open={!!customerId} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" showCloseButton={false}>
        {isLoading || !customer || Array.isArray(customer) ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
        ) : isEditing ? (
          <>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              defaultValues={customer}
              onSubmit={handleEdit}
              onCancel={() => { setIsEditing(false); setEditError(null) }}
              isLoading={updateCustomer.isPending}
              error={editError}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarFallback className="text-base font-semibold text-white" style={{ backgroundColor: "#2E4369" }}>
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-lg">{customer.name}</DialogTitle>
                    {customer.customerNumber && (
                      <span className="text-sm font-mono font-semibold text-gray-900">#{customer.customerNumber}</span>
                    )}
                  </div>
                  {customer.company && (
                    <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {customer.company}
                    </p>
                  )}
                  {accountTypes.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {accountTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={handleClose}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 mt-2">
              {/* Contact */}
              <div className="space-y-3">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {formatPhone(customer.phone)}
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {customer.email}
                  </div>
                )}
              </div>

              {/* Address */}
              {address && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{address}</span>
                </div>
              )}

              {/* Notes */}
              {(customer.notes || customer.specialRequests || customer.driverNotes) && (
                <div className="space-y-3 pt-1 border-t">
                  <DetailRow label="Internal / Private Notes" value={customer.notes} />
                  <DetailRow label="Preferences / Trip Notes" value={customer.specialRequests} />
                  <DetailRow label="Notes for Drivers" value={customer.driverNotes} />
                </div>
              )}

              {/* Delete */}
              <div className="pt-2 border-t">
                {!confirmDelete ? (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>This will permanently delete <strong>{customer.name}</strong> and all their data. This cannot be undone.</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleDelete}
                        disabled={deleteCustomer.isPending}
                      >
                        {deleteCustomer.isPending ? "Deleting..." : "Yes, Delete"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
