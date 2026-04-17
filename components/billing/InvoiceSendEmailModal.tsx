"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export function InvoiceSendEmailModal({
  tripId,
  invoice,
  trip,
  open,
  onOpenChange,
}: InvoiceSendEmailModalProps) {
  const [senderEmailId, setSenderEmailId] = useState<string>("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  )
  const [errorMsg, setErrorMsg] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { data: senders = [] } = useSenderEmails()

  // Set default sender and recipient email when modal opens
  useEffect(() => {
    if (open) {
      const defaultSender = senders.find((s) => s.isDefault) ?? senders[0]
      if (defaultSender) setSenderEmailId(defaultSender.id)

      // Pre-fill recipient with passenger email
      const passengerEmail = trip?.passengerEmail || invoice.customer?.email
      if (passengerEmail) {
        setRecipientEmail(passengerEmail)
      }

      setStatus("idle")
      setErrorMsg("")
    }
  }, [open, senders, trip, invoice])

  const currentSender = senders.find((s) => s.id === senderEmailId) ?? senders[0]

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      setErrorMsg("Please enter a recipient email")
      return
    }

    if (status === "sending") return

    try {
      setStatus("sending")
      setErrorMsg("")

      const response = await fetch(`/api/trips/${tripId}/invoice/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryEmail: recipientEmail.trim(),
          senderEmailId: senderEmailId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send invoice")
      }

      setStatus("success")
      toast.success("Invoice sent successfully")
    } catch (error) {
      setStatus("error")
      const message =
        error instanceof Error ? error.message : "Failed to send invoice"
      setErrorMsg(message)
      toast.error(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-md overflow-hidden rounded-2xl border border-gray-200 shadow-2xl">
        {/* Header */}
        <DialogHeader className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-gray-900">
                Send Invoice Email
              </DialogTitle>
              <p className="text-[11px] text-gray-400">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Success State */}
        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Invoice Sent
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              The invoice was sent to{" "}
              <span className="font-medium text-gray-700">{recipientEmail}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStatus("idle")
                  setRecipientEmail("")
                }}
              >
                Send Another
              </Button>
              <Button
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Recipient Email */}
            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">
                Send To
              </Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="h-10 text-sm"
              />
              {trip?.passengerName && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {trip.passengerName}
                </p>
              )}
            </div>

            {/* Sender Email */}
            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">
                Sent From (Reply-To)
              </Label>
              {senders.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left text-sm transition-all",
                      isDropdownOpen
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {currentSender?.email}
                      </p>
                      {currentSender?.label && (
                        <p className="text-[11px] text-gray-400 truncate">
                          {currentSender.label}
                        </p>
                      )}
                    </div>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {senders.map((sender) => (
                        <button
                          key={sender.id}
                          type="button"
                          onClick={() => {
                            setSenderEmailId(sender.id)
                            setIsDropdownOpen(false)
                          }}
                          className={cn(
                            "w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                            sender.id === senderEmailId
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full flex-shrink-0",
                              sender.id === senderEmailId
                                ? "bg-blue-500"
                                : "bg-gray-200"
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 truncate">
                              {sender.email}
                            </p>
                            {sender.label && (
                              <p className="text-[11px] text-gray-400 truncate">
                                {sender.label}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-400">Loading sender emails…</p>
                </div>
              )}
              <p className="text-[11px] text-gray-400 mt-1.5">
                Replies will go to this address
              </p>
            </div>

            {/* Error State */}
            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!recipientEmail.trim() || status === "sending"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {status === "sending" ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Invoice
                </span>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
