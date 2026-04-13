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
import { useUpdateTripBilling, useTripBilling } from "@/lib/hooks/use-billing"
import { getDefaultBillingData, type BillingData } from "@/lib/billing-calculations"
import { X } from "lucide-react"

interface BillingModalProps {
  open: boolean
  onClose: () => void
  tripId: string
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
}

export function BillingModal({
  open,
  onClose,
  tripId,
  trip,
  company,
}: BillingModalProps) {
  const [billingData, setBillingData] = useState<Partial<BillingData>>(getDefaultBillingData())
  const [isDirty, setIsDirty] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

  // Fetch existing billing data
  const { data: existingData, isLoading } = useTripBilling(open ? tripId : undefined)
  const updateMutation = useUpdateTripBilling(tripId)

  // Load existing data when modal opens
  useEffect(() => {
    if (open && existingData?.billingData) {
      setBillingData(existingData.billingData)
      setIsDirty(false)
    }
  }, [open, existingData])

  const handleFieldChange = useCallback((field: string, value: any) => {
    setBillingData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setIsDirty(true)
  }, [])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(billingData)
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
        <DialogContent className="max-w-6xl h-[92vh] p-0 flex flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">Billing Details</DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Trip #{trip?.tripNumber || "N/A"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                className="absolute right-4 top-4"
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Content - Two Column Layout */}
          <div className="flex-1 flex overflow-hidden gap-6 px-8 py-6">
            {/* Left Panel - Form */}
            <div className="flex-1 overflow-y-auto pr-4">
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
            <div className="w-px bg-slate-200"></div>

            {/* Right Panel - Invoice Preview */}
            <div className="w-[45%] flex flex-col">
              <InvoicePreview
                billingData={billingData}
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
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
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
    </>
  )
}
