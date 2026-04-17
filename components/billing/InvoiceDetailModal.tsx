"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InvoicePreview } from "./InvoicePreview"
import { InvoiceSendEmailModal } from "./InvoiceSendEmailModal"
import { useTripBilling, useBillingSettings } from "@/lib/hooks/use-billing"
import { useCompany } from "@/lib/hooks/use-company"
import { useTrip } from "@/lib/hooks/use-trips"
import type { Invoice } from "@/types"
import { Loader2, X, Download, Mail } from "lucide-react"
import { toast } from "sonner"

interface InvoiceDetailModalProps {
  open: boolean
  onClose: () => void
  invoice: Invoice | null
}

export function InvoiceDetailModal({
  open,
  onClose,
  invoice,
}: InvoiceDetailModalProps) {
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const tripId = open && invoice?.tripId ? invoice.tripId : undefined

  const { data: tripBilling, isLoading: billingLoading } = useTripBilling(tripId)
  const { data: trip, isLoading: tripLoading } = useTrip(tripId || "")
  const { data: billingSettings, isLoading: settingsLoading } = useBillingSettings()
  const { data: company, isLoading: companyLoading } = useCompany()

  const isLoading = billingLoading || tripLoading || settingsLoading || companyLoading

  if (!invoice) return null

  // Build company object from settings and company data
  const companyData = {
    name: company?.name || billingSettings?.companyName || "Company",
    address: company?.address || billingSettings?.address,
    phone: company?.phone || billingSettings?.phone,
    email: company?.email || billingSettings?.billingEmail,
    logoUrl: company?.logo || billingSettings?.logoUrl,
  }

  // Build trip object from trip data
  const tripData = trip ? {
    tripNumber: trip.tripNumber,
    passengerName: trip.passengerName,
    passengerEmail: trip.passengerEmail,
    passengerPhone: trip.passengerPhone,
    pickupDate: trip.pickupDate?.toString(),
    pickupTime: trip.pickupTime,
    pickupAddress: trip.pickupAddress,
    dropoffAddress: trip.dropoffAddress,
    vehicleType: trip.vehicleType,
    tripType: trip.tripType,
  } : undefined

  const handleDownload = async () => {
    if (!tripId) {
      toast.error("Unable to download invoice")
      return
    }

    try {
      setIsDownloading(true)
      const response = await fetch(`/api/trips/${tripId}/invoice/pdf`)

      if (!response.ok) {
        throw new Error("Failed to download invoice")
      }

      // Create blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`

      // Trigger download
      document.body.appendChild(link)
      link.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)

      toast.success("Invoice downloaded")
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download invoice")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh] p-0 flex flex-col overflow-hidden" showCloseButton={false}>
          {/* Header */}
          <DialogHeader className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-xl">Invoice {invoice.invoiceNumber}</DialogTitle>
                <p className="text-xs text-slate-500 mt-1">
                  {invoice.customer?.name || "Unknown"}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close invoice"
                className="absolute right-6 top-6 flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            ) : tripBilling && tripData ? (
              <InvoicePreview
                billingData={tripBilling.billingData}
                invoiceNumber={invoice.invoiceNumber}
                trip={tripData}
                company={companyData}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Failed to load invoice details</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-200 flex items-center justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Downloading..." : "Download"}
              </Button>
              <Button
                onClick={() => setShowEmailModal(true)}
                disabled={isLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      {tripId && (
        <InvoiceSendEmailModal
          tripId={tripId}
          invoice={invoice}
          trip={tripData}
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
        />
      )}
    </>
  )
}
