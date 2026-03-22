"use client"

import { use, useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Globe, Phone, MapPin, Mail, Calendar,
  CheckCircle2, Clock, UserPlus, X, Check, Network,
  ExternalLink, Trash2, Hash, Copy, Car,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  useAffiliate,
  useSendConnectionRequest,
  useRespondToConnection,
  useRemoveConnection,
} from "@/lib/hooks/use-affiliates"
import type { AffiliateProfile, AffiliateVehicle, ConnectionView } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  SEDAN: "Sedan", SUV: "SUV", STRETCH_LIMO: "Stretch Limo",
  SPRINTER: "Sprinter", PARTY_BUS: "Party Bus", COACH: "Coach", OTHER: "Other",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  if (digits.length === 11 && digits[0] === "1") return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`
  return phone
}

// ─── Connection action panel ──────────────────────────────────────────────────

function ConnectionPanel({ affiliate }: { affiliate: AffiliateProfile }) {
  const send = useSendConnectionRequest()
  const respond = useRespondToConnection()
  const remove = useRemoveConnection()
  const [justSent, setJustSent] = useState(false)

  const status: ConnectionView = affiliate.connectionStatus
  const connectionId = affiliate.connectionId

  if (status === "CONNECTED") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
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

  if (status === "SENT" || justSent) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="sent"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-600">Request sent</span>
          </div>
          {(connectionId || justSent) && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 gap-1.5 transition-all"
              onClick={() => {
                if (connectionId) respond.mutate({ connectionId, action: "cancel" })
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

  if (status === "RECEIVED") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-600">Wants to connect</span>
        </div>
        <Button
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "accept" })}
          disabled={respond.isPending}
        >
          <Check className="w-4 h-4" /> Accept
        </Button>
        <Button
          variant="outline"
          className="gap-1.5 text-gray-500"
          onClick={() => connectionId && respond.mutate({ connectionId, action: "decline" })}
          disabled={respond.isPending}
        >
          <X className="w-4 h-4" /> Decline
        </Button>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key="connect" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <Button
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 h-10 font-semibold"
          onClick={() => {
            setJustSent(true)
            send.mutate(affiliate.id, { onError: () => setJustSent(false) })
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

// ─── Vehicle showcase card ────────────────────────────────────────────────────

function VehicleCard({ vehicle }: { vehicle: AffiliateVehicle }) {
  const photo = vehicle.photoUrl || vehicle.photos?.[0]
  return (
    <div className="group rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-default">
      <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={vehicle.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}
          >
            <Car className="w-8 h-8 text-gray-200" />
          </div>
        )}
      </div>
      <div className="px-3.5 py-3 bg-white">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{vehicle.name}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {[vehicle.year, VEHICLE_TYPE_LABELS[vehicle.type] || vehicle.type].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  )
}

// ─── Contact row ──────────────────────────────────────────────────────────────

function ContactRow({
  icon: Icon, label, value, href,
}: {
  icon: React.ElementType
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5 font-medium"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
          </a>
        ) : (
          <p className="text-sm text-gray-900 mt-0.5 font-medium truncate">{value}</p>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="h-5 w-28 bg-gray-100 rounded-lg animate-pulse mb-5" />
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="h-56 bg-gray-100 animate-pulse" />
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gray-200 animate-pulse border-4 border-white" />
            <div className="h-10 w-32 rounded-xl bg-gray-100 animate-pulse" />
          </div>
          <div className="h-8 w-56 bg-gray-100 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="h-32 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
        </div>
        <div className="h-48 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
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

  if (isLoading) return <ProfileSkeleton />

  if (error || !affiliate) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4">
          <Network className="w-6 h-6 text-gray-300" />
        </div>
        <p className="font-medium text-gray-500">Affiliate not found</p>
        <p className="text-sm text-gray-400 mt-1">This profile may have been removed.</p>
        <Link
          href="/affiliates"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Affiliates
        </Link>
      </div>
    )
  }

  const location = [affiliate.city, affiliate.state].filter(Boolean).join(", ")
  const vehicles = affiliate.vehicles ?? []

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back nav */}
      <Link
        href="/affiliates"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Affiliates Network
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── PROFILE CARD ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Banner */}
          <div
            className="h-44 w-full"
            style={{
              background: affiliate.banner
                ? `url(${affiliate.banner}) center/cover no-repeat`
                : "linear-gradient(135deg, #dbeafe 0%, #ede9fe 55%, #fce7f3 100%)",
            }}
          />

          {/* Hero: logo + actions */}
          <div className="px-8 pt-4 pb-6">
            <div className="flex items-center justify-between gap-4 -mt-14 mb-4">
              {/* Logo */}
              {affiliate.logo ? (
                <div
                  className="w-20 h-20 rounded-2xl bg-white overflow-hidden flex-shrink-0"
                  style={{ border: "4px solid white", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
                >
                  <img src={affiliate.logo} alt={affiliate.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, rgb(37,99,235) 0%, rgb(79,70,229) 100%)",
                    border: "4px solid white",
                    boxShadow: "0 4px 20px rgba(37,99,235,0.25)",
                  }}
                >
                  {getInitials(affiliate.name)}
                </div>
              )}

              {/* Connection actions */}
              <div className="flex-shrink-0">
                <ConnectionPanel affiliate={affiliate} />
              </div>
            </div>

            {/* Company name */}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
              {affiliate.name}
            </h1>

            {/* Location + Member since */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
              {location && (
                <span className="text-sm text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />{location}
                </span>
              )}
              <span className="text-sm text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Member since {formatMemberSince(affiliate.createdAt)}
              </span>
            </div>

            {/* Affiliate ID badge */}
            {affiliate.affiliateCode && (
              <div
                className={cn(
                  "mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer group transition-all",
                  copied
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/40"
                )}
                onClick={copyCode}
                title="Click to copy"
              >
                <Hash className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Affiliate ID</span>
                <span className="text-sm font-bold text-blue-600 font-mono tracking-wider">
                  {affiliate.affiliateCode}
                </span>
                {copied ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <Check className="w-3 h-3" /> Copied
                  </span>
                ) : (
                  <Copy className="w-3 h-3 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Two-column body: Fleet + Contact */}
          <div className="flex">
            {/* Fleet */}
            <div className="flex-1 p-8 pr-6 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Fleet</p>
              <p className="text-sm font-semibold text-gray-800 mb-4">
                {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
              </p>
              {vehicles.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {vehicles.map((v) => (
                    <VehicleCard key={v.id} vehicle={v} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-300">No vehicles listed</p>
              )}
            </div>

            {/* Vertical divider */}
            <div className="w-px bg-gray-100 self-stretch" />

            {/* Contact */}
            <div className="w-80 flex-shrink-0 p-8 pl-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Contact</p>
              <div className="divide-y divide-gray-100">
                <ContactRow icon={Mail} label="Email" value={affiliate.email} href={`mailto:${affiliate.email}`} />
                {affiliate.phone && (
                  <ContactRow icon={Phone} label="Phone" value={formatPhone(affiliate.phone)} href={`tel:${affiliate.phone}`} />
                )}
                {location && (
                  <ContactRow icon={MapPin} label="Location" value={location} />
                )}
                {affiliate.website && (
                  <ContactRow
                    icon={Globe}
                    label="Website"
                    value={affiliate.website.replace(/^https?:\/\//, "")}
                    href={affiliate.website.startsWith("http") ? affiliate.website : `https://${affiliate.website}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* About (below two columns) */}
          {affiliate.about && (
            <>
              <div className="border-t border-gray-100" />
              <div className="px-8 py-6">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{affiliate.about}</p>
              </div>
            </>
          )}
        </div>

        {/* Connected note */}
        <AnimatePresence>
          {affiliate.connectionStatus === "CONNECTED" && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-emerald-500 text-center mt-5 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3" />
              You and {affiliate.name} are connected
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
