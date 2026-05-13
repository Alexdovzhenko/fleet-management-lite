"use client"

import { useState, useCallback, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BillingFormBlocks } from "./BillingFormBlocks"
import { InvoicePreview } from "./InvoicePreview"
import { DownloadInvoicePdfButton } from "./DownloadInvoicePdfButton"
import { SendInvoiceModal } from "./SendInvoiceModal"
import { useUpdateTripBilling, useTripBilling, useCreateTripInvoice, useTripInvoice } from "@/lib/hooks/use-billing"
import { getDefaultBillingData, type BillingData } from "@/lib/billing-calculations"
import { X, Send, DollarSign, AlertTriangle, Save } from "lucide-react"

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
    pickupDate?: string
    pickupTime?: string
    pickupAddress?: string
    dropoffAddress?: string
    vehicleType?: string | null
    tripType?: string | null
    stops?: Array<{ order: number; address: string; notes?: string | null; role?: string | null }>
    customer?: {
      name?: string
      email?: string
      phone?: string
    }
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

  const { data: existingData, isLoading } = useTripBilling(open && mode === 'edit' && tripId ? tripId : undefined)
  const { data: tripInvoice } = useTripInvoice(open && tripId ? tripId : undefined)
  const updateMutation = useUpdateTripBilling(tripId || '')
  const createInvoiceMutation = useCreateTripInvoice(tripId || '')

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
    setBillingData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  const handleSave = async () => {
    try {
      if (mode === 'create' && onSave) {
        onSave(billingData as BillingData)
      } else if (mode === 'edit') {
        await updateMutation.mutateAsync(billingData)
        try {
          await createInvoiceMutation.mutateAsync()
        } catch (invoiceError) {
          console.log("Invoice creation info:", invoiceError)
        }
      }
      setIsDirty(false)
    } catch (error) {
      console.error("Failed to save billing data:", error)
    }
  }

  const handleClose = () => {
    if (isDirty) setShowUnsavedWarning(true)
    else onClose()
  }

  const handleConfirmClose = () => { setShowUnsavedWarning(false); onClose() }
  const handleCancelClose = () => setShowUnsavedWarning(false)

  if (!open) return null

  const isSaving = updateMutation.isPending || createInvoiceMutation.isPending

  return (
    <>
      <Dialog open={open && !showUnsavedWarning} onOpenChange={handleClose}>
        <DialogContent
          className="w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh] p-0 flex flex-col overflow-hidden rounded-2xl"
          showCloseButton={false}
          style={{ background: "#080c16", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 24px 80px rgba(0,0,0,0.70)" }}
        >
          {/* Header */}
          <DialogHeader
            className="px-7 py-5 flex-shrink-0 border-b"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0d1526" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(201,168,124,0.12)", border: "1px solid rgba(201,168,124,0.22)" }}
              >
                <DollarSign className="w-4.5 h-4.5" style={{ color: "#c9a87c" }} />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-bold" style={{ color: "rgba(255,255,255,0.92)" }}>
                  Billing Details
                </DialogTitle>
                <p className="text-xs mt-0.5" style={{ color: "rgba(200,212,228,0.50)" }}>
                  Trip #{trip?.tripNumber || "N/A"}
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close billing details"
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                style={{ color: "rgba(200,212,228,0.45)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)"
                  ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.45)"
                  ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
                }}
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </DialogHeader>

          {/* Two-column body */}
          <div
            className="flex-1 flex flex-col md:flex-row overflow-hidden"
            style={{ background: "#080c16" }}
          >
            {/* Left panel — form */}
            <div
              className="w-full md:w-[42%] flex-shrink-0 overflow-y-auto px-6 py-5"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-sm" style={{ color: "rgba(200,212,228,0.45)" }}>Loading…</p>
                </div>
              ) : (
                <BillingFormBlocks data={billingData} onChange={handleFieldChange} />
              )}
            </div>

            {/* Right panel — invoice preview */}
            <div className="w-full md:flex-1 flex flex-col overflow-hidden px-6 py-5">
              <InvoicePreview
                billingData={billingData}
                invoiceNumber={tripInvoice?.invoiceNumber}
                trip={trip && tripInvoice?.trip ? { ...trip, ...tripInvoice.trip } : trip}
                company={company}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter
            className="px-7 py-4 flex-shrink-0 border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0d1526" }}
          >
            <div className="flex items-center justify-between w-full gap-4">
              {/* Status indicator */}
              <div className="text-xs font-medium">
                {isDirty ? (
                  <span style={{ color: "rgba(251,191,36,0.85)" }}>Unsaved changes</span>
                ) : (
                  <span style={{ color: "rgba(52,211,153,0.70)" }}>All changes saved</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                <DownloadInvoicePdfButton
                  tripId={tripId || ''}
                  invoiceNumber={tripInvoice?.invoiceNumber}
                  invoiceTotal={tripInvoice?.summary?.total}
                  isLoading={isLoading}
                />

                {/* Send Invoice */}
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={!tripInvoice?.invoiceNumber || isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.80)", border: "1px solid rgba(255,255,255,0.10)" }}
                  onMouseEnter={e => { if (!e.currentTarget.disabled) { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)" } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)" }}
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Invoice
                </button>

                {/* Cancel */}
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: "transparent", color: "rgba(200,212,228,0.65)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.65)" }}
                >
                  Cancel
                </button>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: isDirty ? "#c9a87c" : "rgba(201,168,124,0.25)", color: isDirty ? "#0d1526" : "rgba(201,168,124,0.50)", boxShadow: isDirty ? "0 2px 12px rgba(201,168,124,0.30)" : "none" }}
                  onMouseEnter={e => { if (isDirty && !isSaving) (e.currentTarget as HTMLElement).style.background = "#d4b688" }}
                  onMouseLeave={e => { if (isDirty) (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Warning */}
      <Dialog open={showUnsavedWarning} onOpenChange={handleCancelClose}>
        <DialogContent
          className="max-w-sm rounded-2xl p-0 overflow-hidden"
          showCloseButton={false}
          style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 16px 48px rgba(0,0,0,0.60)" }}
        >
          <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.20)" }}>
                <AlertTriangle className="w-4 h-4" style={{ color: "rgba(251,191,36,0.85)" }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>Discard changes?</h3>
            </div>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm" style={{ color: "rgba(200,212,228,0.65)" }}>
              You have unsaved changes. Are you sure you want to close without saving?
            </p>
          </div>
          <div className="px-6 pb-5 flex gap-3 justify-end">
            <button
              onClick={handleCancelClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.80)", border: "1px solid rgba(255,255,255,0.10)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
            >
              Keep editing
            </button>
            <button
              onClick={handleConfirmClose}
              className="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              style={{ background: "rgba(248,113,113,0.15)", color: "rgba(248,113,113,0.90)", border: "1px solid rgba(248,113,113,0.22)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.15)")}
            >
              Discard
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <SendInvoiceModal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        tripId={tripId || ''}
        invoiceNumber={tripInvoice?.invoiceNumber}
        defaultEmail={trip?.passengerEmail || trip?.customer?.email}
        companyName={company?.name}
      />
    </>
  )
}
