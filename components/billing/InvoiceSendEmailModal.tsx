"use client"

import { useState, useEffect, useRef } from "react"
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
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  ChevronDown,
  X,
} from "lucide-react"
import { useSenderEmails } from "@/lib/hooks/use-sender-emails"
import { cn } from "@/lib/utils"
import type { Invoice } from "@/types"
import { toast } from "sonner"

interface InvoiceSendEmailModalProps {
  tripId: string
  invoice: Invoice
  trip?: {
    tripNumber?: string
    passengerName?: string
    passengerEmail?: string
    passengerPhone?: string
  }
  open: boolean
  onOpenChange: (v: boolean) => void
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─── Sender selector component ───────────────────────────────────────────────

function SenderSelector({
  senders,
  selected,
  onChange,
}: {
  senders: any[]
  selected: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const current = senders.find(s => s.id === selected) ?? senders[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all",
          open
            ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
            : "border-gray-200 bg-white hover:border-gray-300"
        )}
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Mail className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{current?.email ?? "Select sender"}</p>
          {current?.label && <p className="text-[11px] text-gray-400 leading-tight">{current.label}</p>}
        </div>
        {current?.isDefault && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0">
            Default
          </span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-gray-400 flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {senders.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onChange(s.id); setOpen(false) }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left transition-colors",
                s.id === selected
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", s.id === selected ? "bg-blue-500" : "bg-gray-200")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{s.email}</p>
                {s.label && <p className="text-[11px] text-gray-400">{s.label}</p>}
              </div>
              {s.isDefault && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Default</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function InvoiceSendEmailModal({
  tripId,
  invoice,
  trip,
  open,
  onOpenChange,
}: InvoiceSendEmailModalProps) {
  const [primaryEmail, setPrimaryEmail] = useState("")
  const [secondaryEmail, setSecondaryEmail] = useState("")
  const [showCC, setShowCC] = useState(false)
  const [message, setMessage] = useState("")
  const [senderEmailId, setSenderEmailId] = useState<string>("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [touched, setTouched] = useState({ primary: false, secondary: false })
  const primaryInputRef = useRef<HTMLInputElement>(null)

  const { data: senders = [] } = useSenderEmails()

  // Set default sender and recipient email when modal opens
  useEffect(() => {
    if (open) {
      // Pre-fill recipient with passenger email
      const passengerEmail = trip?.passengerEmail || invoice.customer?.email
      if (passengerEmail) {
        setPrimaryEmail(passengerEmail)
      }

      setSecondaryEmail("")
      setShowCC(false)
      setMessage("")
      setStatus("idle")
      setErrorMsg("")
      setTouched({ primary: false, secondary: false })

      const defaultSender = senders.find((s) => s.isDefault) ?? senders[0]
      if (defaultSender) setSenderEmailId(defaultSender.id)

      // Focus primary email input after a short delay
      setTimeout(() => primaryInputRef.current?.focus(), 100)
    }
  }, [open, senders, trip, invoice])

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

    try {
      const response = await fetch(`/api/trips/${tripId}/invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail: primaryEmail.trim(),
          secondaryEmail: secondaryEmail.trim() ? secondaryEmail.trim() : undefined,
          message: message.trim() || undefined,
          senderEmailId: senderEmailId || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to send invoice")
      }

      setStatus("success")
      toast.success("Invoice sent successfully")
    } catch (error) {
      setStatus("error")
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send invoice"
      setErrorMsg(errorMessage)
      toast.error(errorMessage)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  {invoice.invoiceNumber}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
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
              Invoice {invoice.invoiceNumber} was sent to:
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
              onClick={() => onOpenChange(false)}
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

            {/* Sent From (Reply-To) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900 uppercase tracking-widest">
                Sent From (Reply-To)
              </Label>
              {senders.length > 0 ? (
                <SenderSelector
                  senders={senders}
                  selected={senderEmailId}
                  onChange={setSenderEmailId}
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-400">Loading sender emails…</p>
                </div>
              )}
              <p className="text-[11px] text-gray-400 leading-snug">
                Replies from recipients will go to this address.
              </p>
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
              onClick={() => onOpenChange(false)}
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
                  <Mail className="w-4 h-4" />
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
