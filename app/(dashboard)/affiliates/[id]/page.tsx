"use client"

import { use, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Globe, Phone, MapPin, Mail, Building2,
  Calendar, CheckCircle2, Clock, UserPlus, X, Check,
  Network, ExternalLink, Trash2, Hash, Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  useAffiliate,
  useSendConnectionRequest,
  useRespondToConnection,
  useRemoveConnection,
} from "@/lib/hooks/use-affiliates"
import type { AffiliateProfile, ConnectionView } from "@/types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
  return phone
}

// ─── Connection action panel ──────────────────────────────────────────────────

function ConnectionPanel({ affiliate }: { affiliate: AffiliateProfile }) {
  const send = useSendConnectionRequest()
  const respond = useRespondToConnection()
  const remove = useRemoveConnection()
  // optimistic "just sent" flag so the button turns green immediately on click
  const [justSent, setJustSent] = useState(false)

  const status: ConnectionView = affiliate.connectionStatus
  const connectionId = affiliate.connectionId

  // ── Connected ──
  if (status === "CONNECTED") {
    return (
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.20)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600">Connected</span>
        </div>
        {connectionId && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 gap-1.5 transition-all"
            onClick={() => remove.mutate(connectionId)}
            disabled={remove.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </Button>
        )}
      </div>
    )
  }

  // ── Sent (or just clicked Connect) ──
  if (status === "SENT" || justSent) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="sent"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2.5"
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.20)",
            }}
          >
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600">Request sent</span>
          </div>
          {(connectionId || justSent) && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 gap-1.5 transition-all"
              onClick={() => {
                if (connectionId) {
                  respond.mutate({ connectionId, action: "cancel" })
                }
                setJustSent(false)
              }}
              disabled={respond.isPending}
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </Button>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  // ── Received (they sent to us) ──
  if (status === "RECEIVED") {
    return (
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl mr-1"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.20)",
          }}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600">Wants to connect</span>
        </div>
        <Button
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "accept" })}
          disabled={respond.isPending}
        >
          <Check className="w-4 h-4" />
          Accept
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-gray-500"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "decline" })}
          disabled={respond.isPending}
        >
          <X className="w-4 h-4" />
          Decline
        </Button>
      </div>
    )
  }

  // ── NONE / DECLINED — show Connect ──
  return (
    <AnimatePresence mode="wait">
      <motion.div key="connect" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          onClick={() => {
            setJustSent(true)
            send.mutate(affiliate.id, {
              onError: () => setJustSent(false),
            })
          }}
          disabled={send.isPending}
        >
          <UserPlus className="w-4 h-4" />
          Connect
        </Button>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Profile info row ─────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 font-medium"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : (
          <p className="text-sm text-gray-900 mt-0.5 font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Profile skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="h-5 w-28 bg-gray-100 rounded-lg animate-pulse mb-5" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="h-40 rounded-t-2xl bg-gray-100 animate-pulse" />
        <div className="px-6 pt-4 pb-6">
          <div className="flex items-start justify-between mb-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse -mt-12 border-4 border-white" />
            <div className="h-10 w-32 rounded-xl bg-gray-100 animate-pulse mt-2" />
          </div>
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-2" />
          <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-5" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AffiliateProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: affiliate, isLoading, error } = useAffiliate(id)
  const [copied, setCopied] = useState(false)

  const copyCode = useCallback(() => {
    if (!affiliate?.affiliateCode) return
    navigator.clipboard.writeText(affiliate.affiliateCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [affiliate?.affiliateCode])

  if (isLoading) return (
    <div className="max-w-2xl mx-auto">
      <ProfileSkeleton />
    </div>
  )

  if (error || !affiliate) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <Network className="w-6 h-6 text-gray-300" />
        </div>
        <p className="font-medium text-gray-500">Affiliate not found</p>
        <p className="text-sm text-gray-400 mt-1">This profile may have been removed.</p>
        <Link href="/affiliates" className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Affiliates
        </Link>
      </div>
    )
  }

  const location = [affiliate.city, affiliate.state].filter(Boolean).join(", ")

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/affiliates"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Affiliates Network
      </Link>

      {/* Profile card — no overflow-hidden so logo isn't clipped */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm"
      >
        {/* Banner — clipped separately so border-radius applies */}
        <div
          className="h-40 md:h-48 rounded-t-2xl"
          style={{
            background: affiliate.banner
              ? `url(${affiliate.banner}) center/cover no-repeat`
              : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 50%, #fce7f3 100%)",
          }}
        />

        {/* Logo + action row — sits below banner, logo floats up via negative margin */}
        <div className="px-5 md:px-7">
          <div className="flex items-start justify-between gap-4 -mt-10">
            {/* Logo — pulled up to overlap banner, white border creates floating effect */}
            {affiliate.logo ? (
              <div
                className="w-20 h-20 md:w-[88px] md:h-[88px] rounded-2xl bg-white flex-shrink-0"
                style={{
                  border: "3px solid white",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={affiliate.logo}
                  alt={affiliate.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 md:w-[88px] md:h-[88px] rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)",
                  border: "3px solid white",
                  boxShadow: "0 4px 16px rgba(37,99,235,0.25)",
                }}
              >
                {getInitials(affiliate.name)}
              </div>
            )}

            {/* Connection button — right side, vertically centered in its column */}
            <div className="mt-12 md:mt-14">
              <ConnectionPanel affiliate={affiliate} />
            </div>
          </div>

          {/* Name + meta */}
          <div className="mt-4 mb-5">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{affiliate.name}</h1>
            <div className="flex flex-col gap-1 mt-1.5">
              {location && (
                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </p>
              )}
              <p className="text-xs text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Member since {formatMemberSince(affiliate.createdAt)}
              </p>
            </div>
          </div>

          {/* Affiliate ID — shown when connected */}
          {affiliate.affiliateCode && (
            <div className="mb-5">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer group transition-all"
                style={{
                  background: copied ? "rgba(16,185,129,0.07)" : "rgba(37,99,235,0.06)",
                  border: copied ? "1px solid rgba(16,185,129,0.20)" : "1px solid rgba(37,99,235,0.14)",
                }}
                onClick={copyCode}
                title="Click to copy"
              >
                <Hash className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Affiliate ID</span>
                <span className="font-mono text-sm font-bold text-blue-700 tracking-wider">{affiliate.affiliateCode}</span>
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <Copy className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Info rows */}
          <div className="divide-y divide-gray-50 mb-2">
            <InfoRow icon={Building2} label="Company" value={affiliate.name} />
            <InfoRow icon={Mail} label="Email" value={affiliate.email} href={`mailto:${affiliate.email}`} />
            {affiliate.phone && (
              <InfoRow icon={Phone} label="Phone" value={formatPhone(affiliate.phone)} href={`tel:${affiliate.phone}`} />
            )}
            {location && (
              <InfoRow icon={MapPin} label="Location" value={location} />
            )}
            {affiliate.website && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={affiliate.website.replace(/^https?:\/\//, "")}
                href={affiliate.website.startsWith("http") ? affiliate.website : `https://${affiliate.website}`}
              />
            )}
          </div>

          <div className="h-4" />
        </div>
      </motion.div>

      {/* Contextual note below card */}
      <AnimatePresence>
        {affiliate.connectionStatus === "CONNECTED" && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-emerald-500 text-center mt-4 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3 h-3" />
            You and {affiliate.name} are connected
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
