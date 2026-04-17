"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
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
  const [senderEmailId, setSenderEmailId] = useState<string>("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

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

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Send Invoice Email</h2>
              <p className="text-[11px] text-gray-400">{invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>

        {/* ── Success state ── */}
        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Invoice Sent</h3>
            <p className="text-sm text-gray-400 mb-6">
              The invoice was sent to <span className="font-medium text-gray-700">{recipientEmail}</span>
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

            {/* ── Recipient Email ── */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Send To</p>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="h-10 text-sm"
              />
              {trip?.passengerName && (
                <p className="text-xs text-gray-500 mt-1.5">{trip.passengerName}</p>
              )}
            </div>

            {/* ── Sender Email ── */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Sent From (Reply-To)</p>
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
              <p className="text-[11px] text-gray-400 mt-1.5 leading-snug">
                Replies from recipients will go to this address.
              </p>
            </div>

            {/* ── Error state ── */}
            {status === "error" && errorMsg && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            {/* ── Send button ── */}
            <Button
              type="button"
              className="w-full h-11 font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all"
              disabled={!recipientEmail.trim() || status === "sending"}
              onClick={handleSend}
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
