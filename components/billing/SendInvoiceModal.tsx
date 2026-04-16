"use client"

import { useState, useEffect, useRef } from "react"
import { Mail, Send, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useSendInvoice } from "@/lib/hooks/use-billing"
import { toast } from "sonner"

interface SendInvoiceModalProps {
  open: boolean
  onClose: () => void
  tripId: string
  invoiceNumber?: string | null
  defaultEmail?: string | null
  companyName?: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function SendInvoiceModal({
  open,
  onClose,
  tripId,
  invoiceNumber,
  defaultEmail,
  companyName,
}: SendInvoiceModalProps) {
  const [primaryEmail, setPrimaryEmail] = useState("")
  const [secondaryEmail, setSecondaryEmail] = useState("")
  const [showCC, setShowCC] = useState(false)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [touched, setTouched] = useState({ primary: false, secondary: false })
  const primaryInputRef = useRef<HTMLInputElement>(null)

  const sendInvoice = useSendInvoice(tripId)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      // Set email with proper fallback chain
      const email = defaultEmail || ""
      setPrimaryEmail(email)
      setSecondaryEmail("")
      setShowCC(false)
      setMessage("")
      setStatus("idle")
      setErrorMsg("")
      setTouched({ primary: false, secondary: false })
      // Focus primary email input after a short delay to allow modal animation
      setTimeout(() => primaryInputRef.current?.focus(), 100)
    }
  }, [open])

  // Validation checks
  const isPrimaryEmailValid = primaryEmail.trim() === "" || isValidEmail(primaryEmail)
  const isSecondaryEmailValid = secondaryEmail.trim() === "" || isValidEmail(secondaryEmail)
  const isDuplicateEmail = primaryEmail.trim() && secondaryEmail.trim() && primaryEmail === secondaryEmail
  const canSubmit = primaryEmail.trim() !== "" && isValidEmail(primaryEmail) && status !== "sending"

  const handlePrimaryBlur = () => {
    setTouched((prev) => ({ ...prev, primary: true }))
  }

  const handleSecondaryBlur = () => {
    setTouched((prev) => ({ ...prev, secondary: true }))
  }

  const handleRemoveCC = () => {
    setSecondaryEmail("")
    setShowCC(false)
    setTouched((prev) => ({ ...prev, secondary: false }))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canSubmit) {
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!canSubmit) return

    setStatus("sending")
    setErrorMsg("")

    sendInvoice.mutate(
      {
        primaryEmail: primaryEmail.trim(),
        secondaryEmail: secondaryEmail.trim() ? secondaryEmail.trim() : undefined,
        message: message.trim() || undefined,
      },
      {
        onSuccess: () => {
          setStatus("success")
        },
        onError: (err) => {
          setStatus("error")
          setErrorMsg(err instanceof Error ? err.message : "Failed to send invoice")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[480px] p-0 gap-0 rounded-[20px] border border-gray-200 shadow-2xl overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <DialogHeader className="px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-gray-900">Send Invoice</DialogTitle>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {invoiceNumber || "Draft"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-95 transition-all duration-150"
              aria-label="Close"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </DialogHeader>

        {/* Content */}
        {status === "success" ? (
          <div className="px-6 py-10 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Invoice Sent</h3>
            <p className="text-sm text-gray-500 mb-6">
              Invoice {invoiceNumber} was sent to:
              <br />
              <span className="font-medium text-gray-700">{primaryEmail}</span>
              {secondaryEmail && (
                <>
                  <br />
                  <span className="font-medium text-gray-700">{secondaryEmail}</span>
                </>
              )}
            </p>
            <Button
              onClick={() => onClose()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl font-semibold"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4 max-h-[calc(96vh-200px)] overflow-y-auto">
            {/* Primary Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900 uppercase tracking-widest">
                To <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={primaryInputRef}
                type="email"
                placeholder="recipient@example.com"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                onBlur={handlePrimaryBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                  "h-[44px] rounded-xl border text-sm px-3.5 transition-all",
                  touched.primary && !isValidEmail(primaryEmail)
                    ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                )}
              />
              {touched.primary && primaryEmail && !isValidEmail(primaryEmail) && (
                <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* CC Toggle / CC Input */}
            {!showCC ? (
              <button
                type="button"
                onClick={() => setShowCC(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-0 py-1"
              >
                + Add CC
              </button>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-900 uppercase tracking-widest">
                  CC <span className="text-gray-400">(optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="another@example.com"
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    onBlur={handleSecondaryBlur}
                    onKeyDown={handleKeyDown}
                    className={cn(
                      "h-[44px] rounded-xl border text-sm px-3.5 pr-10 transition-all",
                      touched.secondary && !isValidEmail(secondaryEmail) && secondaryEmail
                        ? "border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : isDuplicateEmail
                        ? "border-amber-300 bg-amber-50 focus:ring-2 focus:ring-amber-200"
                        : "border-gray-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    )}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveCC}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isDuplicateEmail && (
                  <p className="text-xs text-amber-700">Email addresses must be different</p>
                )}
                {touched.secondary && secondaryEmail && !isValidEmail(secondaryEmail) && (
                  <p className="text-xs text-red-600">Please enter a valid email address</p>
                )}
              </div>
            )}

            {/* Message */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900 uppercase tracking-widest">
                Message <span className="text-gray-400">(optional)</span>
              </Label>
              <textarea
                placeholder="Add a message (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm bg-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Attachment Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-sm">📎</span>
              <span className="text-sm text-blue-700 font-medium">
                Invoice PDF attached
              </span>
            </div>

            {/* Error Banner */}
            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {status !== "success" && (
          <DialogFooter className="px-5 py-6 border-t border-gray-100 bg-white flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={status === "sending"}
              className="rounded-lg border-gray-300 h-11 px-6 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSubmit}
              className="gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg h-11 px-6 text-sm font-medium active:scale-[0.97] transition-all duration-150"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
