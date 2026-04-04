"use client"

import { useState, useEffect } from "react"
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import { Label }  from "@/components/ui/label"
import {
  User, Car, ArrowRightLeft, Mail, FileText, ChevronDown,
  CheckCircle2, AlertTriangle, Loader2, Send, Star, X,
} from "lucide-react"
import { useSenderEmails, useSendTripEmail } from "@/lib/hooks/use-sender-emails"
import { cn } from "@/lib/utils"
import type { Trip, SenderEmail } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type RecipientType = "driver" | "client" | "affiliate"

interface TabDef {
  key: RecipientType
  label: string
  Icon: React.ElementType
  getEmail: (trip: Trip) => string | null | undefined
  docType: string
  docDesc: string
  docColor: string
}

const TABS: TabDef[] = [
  {
    key:      "driver",
    label:    "Driver",
    Icon:     Car,
    getEmail: (t) => t.driver?.email ?? null,
    docType:  "Job Order",
    docDesc:  "Operational format — fast to read, driver-optimized",
    docColor: "bg-slate-900 text-slate-100",
  },
  {
    key:      "client",
    label:    "Client",
    Icon:     User,
    getEmail: (t) => t.passengerEmail ?? t.customer?.email ?? null,
    docType:  "Reservation PDF",
    docDesc:  "Full confirmation — branded, professional",
    docColor: "bg-blue-600 text-white",
  },
  {
    key:      "affiliate",
    label:    "Affiliate",
    Icon:     ArrowRightLeft,
    getEmail: (t) => {
      const accepted = t.farmOuts?.find(f => f.status === "ACCEPTED" || (f as { toCompany?: { id: string } }).toCompany)
      return (accepted as { toCompany?: { id: string; name: string } & { email?: string } })?.toCompany?.email ?? null
    },
    docType:  "Reservation PDF",
    docDesc:  "Full trip details — affiliate-professional format",
    docColor: "bg-indigo-600 text-white",
  },
]

// ─── Sender selector ──────────────────────────────────────────────────────────

function SenderSelector({
  senders,
  selected,
  onChange,
}: {
  senders: SenderEmail[]
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

// ─── Document type card ───────────────────────────────────────────────────────

function DocTypeCard({ type, desc, color }: { type: string; desc: string; color: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-gray-100 bg-gray-50">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", color)}>
        <FileText className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{type}</p>
        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SendEmailModalProps {
  trip: Trip
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultRecipient?: RecipientType
}

export function SendEmailModal({ trip, open, onOpenChange, defaultRecipient = "driver" }: SendEmailModalProps) {
  const [activeTab, setActiveTab]       = useState<RecipientType>(defaultRecipient)
  const [senderEmailId, setSenderEmailId] = useState<string>("")
  const [recipientEmailOverride, setRecipientEmailOverride] = useState("")
  const [status, setStatus]             = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg]         = useState("")

  const { data: senders = [] }          = useSenderEmails()
  const sendEmail                       = useSendTripEmail()

  // Set default sender email when senders load
  useEffect(() => {
    const def = senders.find(s => s.isDefault) ?? senders[0]
    if (def && !senderEmailId) setSenderEmailId(def.id)
  }, [senders, senderEmailId])

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStatus("idle")
      setErrorMsg("")
      setRecipientEmailOverride("")
      setActiveTab(defaultRecipient)
    }
  }, [open, defaultRecipient])

  const tab        = TABS.find(t => t.key === activeTab)!
  const resolved   = tab.getEmail(trip)
  const toEmail    = recipientEmailOverride.trim() || resolved

  // Check if affiliate tab should be disabled (no farm-out)
  const hasAffiliate = trip.farmOuts && trip.farmOuts.length > 0

  async function handleSend() {
    if (status === "sending") return
    setStatus("sending")
    setErrorMsg("")

    sendEmail.mutate({
      tripId:         trip.id,
      recipientType:  activeTab,
      recipientEmail: recipientEmailOverride.trim() || undefined,
      senderEmailId:  senderEmailId || undefined,
    }, {
      onSuccess: () => setStatus("success"),
      onError: (err) => {
        setStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to send email")
      },
    })
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
              <h2 className="text-sm font-bold text-gray-900">Send Reservation Email</h2>
              <p className="text-[11px] text-gray-400">{trip.tripNumber}</p>
            </div>
          </div>
        </div>

        {/* ── Success state ── */}
        {status === "success" ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Email Sent</h3>
            <p className="text-sm text-gray-400 mb-6">
              The {tab.docType.toLowerCase()} was sent to <span className="font-medium text-gray-700">{toEmail}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setStatus("idle"); setActiveTab(activeTab) }}
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

            {/* ── Recipient tabs ── */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Recipient</p>
              <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl">
                {TABS.map(({ key, label, Icon }) => {
                  const isDisabled = key === "affiliate" && !hasAffiliate
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && setActiveTab(key)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all",
                        activeTab === key
                          ? "bg-white text-gray-900 shadow-sm"
                          : isDisabled
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Recipient email ── */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">To</p>
              {resolved ? (
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {activeTab === "driver" ? (
                      <Car className="w-3.5 h-3.5 text-gray-500" />
                    ) : activeTab === "affiliate" ? (
                      <ArrowRightLeft className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {activeTab === "driver" ? trip.driver?.name : activeTab === "client" ? (trip.passengerName ?? trip.customer?.name) : "Affiliate"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{resolved}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">
                      {activeTab === "driver" ? "No email on driver record" :
                       activeTab === "client" ? "No email on passenger or customer record" :
                       "No accepted affiliate farm-out found"}
                    </p>
                  </div>
                  {activeTab !== "affiliate" && (
                    <div>
                      <Label className="text-xs text-gray-600 mb-1.5 block">Enter email address manually</Label>
                      <Input
                        type="email"
                        placeholder={activeTab === "driver" ? "driver@example.com" : "client@example.com"}
                        value={recipientEmailOverride}
                        onChange={e => setRecipientEmailOverride(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Document type ── */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2">Attached Document</p>
              <DocTypeCard type={tab.docType} desc={tab.docDesc} color={tab.docColor} />
            </div>

            {/* ── Sender ── */}
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
              className={cn(
                "w-full h-11 font-semibold text-sm transition-all",
                activeTab === "driver"
                  ? "bg-slate-900 hover:bg-slate-800 text-white"
                  : activeTab === "affiliate"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
              disabled={!toEmail || status === "sending"}
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
                  Send {tab.docType} to {tab.label}
                </span>
              )}
            </Button>

          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
