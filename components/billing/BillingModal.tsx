"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BillingFormBlocks } from "./BillingFormBlocks"
import { InvoicePreview } from "./InvoicePreview"
import { DownloadInvoicePdfButton } from "./DownloadInvoicePdfButton"
import { SendInvoiceModal } from "./SendInvoiceModal"
import { useUpdateTripBilling, useTripBilling, useCreateTripInvoice, useTripInvoice } from "@/lib/hooks/use-billing"
import { getDefaultBillingData, type BillingData } from "@/lib/billing-calculations"
import { X, Send } from "lucide-react"

interface BillingModalProps {
  open: boolean
  onClose: () => void
  mode?: 'create' | 'edit'
  tripId?: string
  trip?: {
    tripNumber: string
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
  }
  company?: {
    name?: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
  initialData?: BillingData | Partial<BillingData>
  onSave?: (data: BillingData) => void
}

export function BillingModal({
  open,
  onClose,
  mode = 'edit',
  tripId,
  trip,
  company,
  initialData,
  onSave,
}: BillingModalProps) {
  const defaultData = getDefaultBillingData()
  const [billingData, setBillingData] = useState<Partial<BillingData>>(
    initialData ? (initialData as Partial<BillingData>) : defaultData
  )
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)

  // Fetch existing billing data (edit mode only)
  const { data: existingData, isLoading } = useTripBilling(open && mode === 'edit' && tripId ? tripId : undefined)
  const { data: tripInvoice } = useTripInvoice(open && tripId ? tripId : undefined)
  const updateMutation = useUpdateTripBilling(tripId || '')
  const createInvoiceMutation = useCreateTripInvoice(tripId || '')

  // Load existing data when modal opens (edit mode)
  useEffect(() => {
    if (open && mode === 'edit' && existingData?.billingData) {
      setBillingData(existingData.billingData as Partial<BillingData>)
      setIsDirty(false)
    } else if (open && mode === 'create' && initialData) {
      setBillingData(initialData as Partial<BillingData>)
      setIsDirty(false)
    }
  }, [open, existingData, mode, initialData])

  const handleFieldChange = useCallback((field: string, value: any) => {
    setBillingData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsDirty(true)
  }, [])

  const handleSave = async () => {
    try {
      if (mode === 'create' && onSave) {
        onSave(billingData as BillingData)
      } else if (mode === 'edit') {
        await updateMutation.mutateAsync(billingData)
        // Auto-create invoice after saving billing data
        try {
          await createInvoiceMutation.mutateAsync()
        } catch (invoiceError) {
          // Invoice creation may fail if one already exists, which is fine
          console.log("Invoice creation info:", invoiceError)
        }
      }
      setIsDirty(false)
      onClose()
    } catch (error) {
      console.error("Failed to save billing data:", error)
    }
  }

  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedWarning(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false)
    onClose()
  }

  const handleCancelClose = () => {
    setShowUnsavedWarning(false)
  }

  if (!open) return null

  return (
    <>
      <Dialog open={open && !showUnsavedWarning} onOpenChange={handleClose}>
        <DialogContent className="w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh] p-0 flex flex-col overflow-hidden" showCloseButton={false}>
          {/* Header */}
          <DialogHeader className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">Billing Details</DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Trip #{trip?.tripNumber || "N/A"}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close billing details"
                className="absolute right-6 top-6 flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </DialogHeader>

          {/* Content - Two Column Layout (Mobile: Single Column) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden gap-0 md:gap-8 px-6 md:px-8 py-6 md:py-6">
            {/* Left Panel - Form */}
            <div className="w-full md:w-[38%] flex-shrink-0 overflow-y-auto pr-0 md:pr-4 pb-6 md:pb-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-sm text-slate-500">Loading...</div>
                </div>
              ) : (
                <BillingFormBlocks
                  data={billingData}
                  onChange={handleFieldChange}
                />
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px bg-slate-200"></div>
            <div className="md:hidden h-px bg-slate-200"></div>

            {/* Right Panel - Invoice Preview */}
            <div className="w-full md:flex-1 flex flex-col overflow-hidden">
              <InvoicePreview
                billingData={billingData}
                invoiceNumber={tripInvoice?.invoiceNumber}
                trip={trip}
                company={company}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-8 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-slate-500">
                {isDirty ? (
                  <span className="text-amber-600">Unsaved changes</span>
                ) : (
                  <span>All changes saved</span>
                )}
              </div>
              <div className="flex gap-3">
                <DownloadInvoicePdfButton
                  tripId={tripId || ''}
                  invoiceNumber={tripInvoice?.invoiceNumber}
                  invoiceTotal={tripInvoice?.summary?.total}
                  isLoading={isLoading}
                />
                <Button
                  variant="outline"
                  onClick={() => setShowSendModal(true)}
                  disabled={!tripInvoice?.invoiceNumber || isLoading}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateMutation.isPending || createInvoiceMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || updateMutation.isPending || createInvoiceMutation.isPending}
                >
                  {updateMutation.isPending || createInvoiceMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning Dialog */}
      <Dialog open={showUnsavedWarning} onOpenChange={handleCancelClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 py-4">
            You have unsaved changes. Are you sure you want to close without saving?
          </p>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancelClose}
            >
              Keep editing
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmClose}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invoice Modal */}
      <SendInvoiceModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        tripId={tripId || ''}
        invoiceNumber={tripInvoice?.invoiceNumber}
        defaultEmail={trip?.passengerEmail}
        companyName={company?.name}
      />
    </>
  )
}
