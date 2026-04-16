"use client"

import { useState } from "react"
import { Download, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DownloadInvoicePdfButtonProps {
  tripId: string
  invoiceNumber?: string | null
  invoiceTotal?: number | null
  isLoading?: boolean
}

export function DownloadInvoicePdfButton({
  tripId,
  invoiceNumber,
  invoiceTotal,
  isLoading = false,
}: DownloadInvoicePdfButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const isDisabled = !invoiceTotal || isLoading || isDownloading || !invoiceNumber

  const handleDownload = async () => {
    if (!invoiceNumber) {
      toast.error("Invoice number not available")
      return
    }

    setIsDownloading(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/invoice/pdf`)
      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to download PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `invoice-${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Show success state
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to download PDF"
      console.error("PDF download failed:", error)
      toast.error(message)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isDisabled}
      className="gap-2 text-sm"
      title={!invoiceTotal ? "No invoice data available" : undefined}
      aria-label="Download invoice as PDF"
    >
      {showSuccess ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-600">Downloaded</span>
        </>
      ) : isDownloading ? (
        <>
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          <span>Downloading...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </>
      )}
    </Button>
  )
}
