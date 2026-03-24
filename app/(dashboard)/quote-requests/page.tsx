"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  MessageSquare, MapPin, User, Phone, Mail, Calendar, Car,
  Users, Clock, DollarSign, CheckCircle2, XCircle, ChevronRight,
  Loader2, X, FileText, ArrowRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuoteRequests, useUpdateQuoteRequest, useAcceptQuoteRequest } from "@/lib/hooks/use-quote-requests"
import { formatCurrency } from "@/lib/utils"
import type { QuoteRequest } from "@/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const VEHICLE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter Van", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Other",
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NEW:      { label: "New",      bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  PENDING:  { label: "Pending",  bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  ACCEPTED: { label: "Accepted", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  DECLINED: { label: "Declined", bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400"     },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.NEW
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

// ── Quote Detail Modal ────────────────────────────────────────────────────────

function QuoteDetailModal({ quote, onClose }: { quote: QuoteRequest; onClose: () => void }) {
  const router = useRouter()
  const update = useUpdateQuoteRequest()
  const accept = useAcceptQuoteRequest()
  const [priceInput, setPriceInput] = useState(quote.price ? parseFloat(quote.price).toFixed(2) : "")
  const [declining, setDeclining] = useState(false)

  const canSetPrice = quote.status === "NEW" || quote.status === "PENDING"
  const canAccept   = quote.status === "PENDING" && !!quote.price
  const isAccepted  = quote.status === "ACCEPTED"
  const isDeclined  = quote.status === "DECLINED"

  async function handleSavePrice() {
    const val = parseFloat(priceInput)
    if (!priceInput || isNaN(val) || val <= 0) return
    await update.mutateAsync({ id: quote.id, price: val })
  }

  async function handleAccept() {
    const result = await accept.mutateAsync(quote.id)
    onClose()
    router.push(`/dispatch?open=${result.trip.id}`)
  }

  async function handleDecline() {
    setDeclining(true)
    await update.mutateAsync({ id: quote.id, status: "DECLINED" })
    setDeclining(false)
    onClose()
  }

  const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value: string; href?: string }) => (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-b-0 border-gray-50">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-blue-600 hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-sm font-medium text-gray-800 truncate">{value}</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h2 className="text-lg font-bold text-gray-900">{quote.clientName}</h2>
              <StatusBadge status={quote.status} />
            </div>
            <p className="text-xs text-gray-400">
              Received {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Accepted — trip created */}
          {isAccepted && quote.tripId && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-800">Reservation created</p>
                <p className="text-xs text-emerald-600">This quote has been converted to a trip.</p>
              </div>
              <button onClick={() => { onClose(); router.push(`/dispatch?open=${quote.tripId}`) }}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 flex-shrink-0">
                View <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Client info */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</p>
            </div>
            <div className="px-4">
              <InfoRow icon={User}  label="Name"  value={quote.clientName} />
              <InfoRow icon={Phone} label="Phone" value={quote.clientPhone} href={`tel:${quote.clientPhone}`} />
              {quote.clientEmail && <InfoRow icon={Mail} label="Email" value={quote.clientEmail} href={`mailto:${quote.clientEmail}`} />}
            </div>
          </div>

          {/* Trip details */}
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trip Details</p>
            </div>
            <div className="px-4">
              <InfoRow icon={Calendar} label="Date"    value={quote.pickupDate + (quote.pickupTime ? ` at ${quote.pickupTime}` : "")} />
              <InfoRow icon={MapPin}   label="Pickup"  value={quote.pickupAddress} />
              <div className="flex items-center gap-3 py-1 pl-11">
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
              </div>
              <InfoRow icon={MapPin}   label="Drop-off" value={quote.dropoffAddress} />
              <InfoRow icon={Users}    label="Passengers" value={`${quote.passengerCount} passenger${quote.passengerCount !== 1 ? "s" : ""}`} />
              {quote.vehicleType && <InfoRow icon={Car} label="Vehicle" value={VEHICLE_LABELS[quote.vehicleType] ?? quote.vehicleType} />}
              {quote.notes && <InfoRow icon={FileText} label="Notes" value={quote.notes} />}
            </div>
          </div>

          {/* Pricing */}
          {!isAccepted && !isDeclined && (
            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Quote Price</p>
              </div>
              <div className="px-4 py-4 space-y-3">
                {quote.status === "PENDING" && quote.price && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">Quoted: {formatCurrency(quote.price)}</span>
                    <span className="text-emerald-500 text-xs">· Awaiting client confirmation</span>
                  </div>
                )}
                {canSetPrice && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number" step="0.01" min="0"
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        placeholder={quote.status === "PENDING" ? "Update price" : "Enter price"}
                        className="pl-7 h-10"
                      />
                    </div>
                    <Button onClick={handleSavePrice} disabled={update.isPending || !priceInput}
                      className="h-10 px-4 text-sm">
                      {update.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : quote.status === "PENDING" ? "Update" : "Set Price"}
                    </Button>
                  </div>
                )}
                <Label className="text-xs text-gray-400 font-normal">
                  {quote.status === "NEW"
                    ? "Set a price to move this quote to Pending status."
                    : "Update the price if needed before accepting."}
                </Label>
              </div>
            </div>
          )}

          {isAccepted && quote.price && (
            <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-sm text-gray-500">Agreed price</span>
              <span className="text-lg font-bold text-gray-900">{formatCurrency(quote.price)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isAccepted && !isDeclined && (
          <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <Button variant="outline" onClick={handleDecline} disabled={declining || update.isPending}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 h-11">
              {declining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><XCircle className="w-3.5 h-3.5 mr-1.5" />Decline</>}
            </Button>
            <Button onClick={handleAccept} disabled={!canAccept || accept.isPending}
              className="flex-2 h-11 text-sm font-semibold flex-1"
              style={{ background: canAccept ? "linear-gradient(135deg,#2563eb,#4f46e5)" : undefined }}>
              {accept.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Accept &amp; Create Reservation</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Quote Row ─────────────────────────────────────────────────────────────────

function QuoteRow({ quote, onClick }: { quote: QuoteRequest; onClick: () => void }) {
  return (
    <tr onClick={onClick} className="cursor-pointer hover:bg-gray-50/80 transition-colors group">
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{quote.clientName}</p>
            <p className="text-xs text-gray-400 truncate">{quote.clientPhone}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 max-w-[220px]">
          <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
          <span className="truncate">{quote.pickupAddress}</span>
          <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
          <span className="truncate">{quote.dropoffAddress}</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
          <Calendar className="w-3 h-3" />{quote.pickupDate}{quote.pickupTime ? ` · ${quote.pickupTime}` : ""}
        </p>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="text-sm font-semibold text-gray-900">
          {quote.price ? formatCurrency(quote.price) : <span className="text-gray-300 font-normal text-xs">—</span>}
        </p>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <StatusBadge status={quote.status} />
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(quote.createdAt), { addSuffix: true })}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 inline ml-2 transition-colors" />
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function QuoteRequestsPageInner() {
  const { data: quotes = [], isLoading } = useQuoteRequests()
  const searchParams = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const openId = searchParams.get("open")
    if (openId) setSelectedId(openId)
  }, [searchParams])

  const selectedQuote = quotes.find(q => q.id === selectedId) ?? null

  const counts = {
    all:      quotes.length,
    new:      quotes.filter(q => q.status === "NEW").length,
    pending:  quotes.filter(q => q.status === "PENDING").length,
    accepted: quotes.filter(q => q.status === "ACCEPTED").length,
  }

  const [filter, setFilter] = useState<string>("all")
  const filtered = filter === "all" ? quotes : quotes.filter(q => q.status.toLowerCase() === filter)

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {selectedQuote && (
        <QuoteDetailModal quote={selectedQuote} onClose={() => setSelectedId(null)} />
      )}

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)", boxShadow: "0 4px 12px rgba(37,99,235,0.18)" }}>
              <MessageSquare className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-gray-900 tracking-tight">Quote Requests</h1>
              <p className="text-[13px] text-gray-400 mt-0.5">
                {counts.new > 0 ? `${counts.new} new request${counts.new !== 1 ? "s" : ""} waiting for review` : "Manage incoming quote requests from clients"}
              </p>
            </div>
          </div>
          {/* Stats */}
          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "New",     value: counts.new,      dot: "bg-blue-500" },
              { label: "Pending", value: counts.pending,  dot: "bg-amber-500" },
              { label: "Accepted",value: counts.accepted, dot: "bg-emerald-500" },
            ] as const).map(stat => (
              <div key={stat.label} className="flex flex-col items-center justify-center px-4 py-3 min-w-[72px]">
                <span className="text-[20px] font-bold text-gray-800 leading-none">{stat.value}</span>
                <span className="flex items-center gap-1 mt-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                  <span className="text-[11px] text-gray-400 font-medium">{stat.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />
        <div className="flex items-center gap-1 px-6 py-2">
          {(["all", "new", "pending", "accepted", "declined"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                filter === f ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No quote requests</p>
            <p className="text-xs text-gray-400 mt-1">Requests submitted through your client profile will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Client", "Trip", "Price", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(q => (
                  <QuoteRow key={q.id} quote={q} onClick={() => setSelectedId(q.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function QuoteRequestsPage() {
  return (
    <Suspense>
      <QuoteRequestsPageInner />
    </Suspense>
  )
}
