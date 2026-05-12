"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, BellOff, CheckCheck, UserCheck, UserX, UserPlus,
  ArrowRightLeft, Clock, MapPin, FileText, Activity, XCircle,
  Car, ArrowUpRight, Inbox, MessageSquare, Trash2, ChevronDown, X,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { AppNotification, AppNotificationType } from "@prisma/client"
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useUnreadCount,
  useDeleteNotifications,
  type NotificationTab,
} from "@/lib/hooks/use-notifications"
import { cn } from "@/lib/utils"

// ── Type metadata ─────────────────────────────────────────────────────────────

type TypeMeta = {
  icon: React.ElementType
  gradient: string
  accent: string
  accentBg: string       // dark tint for unread card background
  chipDarkBg: string     // rgba for dark chip bg
  chipDarkColor: string  // rgba for dark chip text
  label: string
}

const TYPE_META: Record<string, TypeMeta> = {
  AFFILIATE_INVITE_RECEIVED: {
    icon: UserPlus,
    gradient: "from-violet-500 to-purple-600",
    accent: "#a78bfa",
    accentBg: "rgba(124,58,237,0.09)",
    chipDarkBg: "rgba(167,139,250,0.12)", chipDarkColor: "rgba(167,139,250,0.90)",
    label: "Affiliates",
  },
  AFFILIATE_INVITE_ACCEPTED: {
    icon: UserCheck,
    gradient: "from-emerald-400 to-teal-500",
    accent: "#34d399",
    accentBg: "rgba(5,150,105,0.09)",
    chipDarkBg: "rgba(52,211,153,0.12)", chipDarkColor: "rgba(52,211,153,0.90)",
    label: "Affiliates",
  },
  AFFILIATE_INVITE_DECLINED: {
    icon: UserX,
    gradient: "from-rose-400 to-red-500",
    accent: "#f87171",
    accentBg: "rgba(225,29,72,0.09)",
    chipDarkBg: "rgba(248,113,113,0.12)", chipDarkColor: "rgba(248,113,113,0.90)",
    label: "Affiliates",
  },
  FARM_OUT_RECEIVED: {
    icon: ArrowRightLeft,
    gradient: "from-amber-400 to-orange-500",
    accent: "#fbbf24",
    accentBg: "rgba(217,119,6,0.09)",
    chipDarkBg: "rgba(251,191,36,0.12)", chipDarkColor: "rgba(251,191,36,0.90)",
    label: "Farm-in",
  },
  FARM_OUT_CANCELLED: {
    icon: XCircle,
    gradient: "from-orange-400 to-red-400",
    accent: "#fb923c",
    accentBg: "rgba(234,88,12,0.09)",
    chipDarkBg: "rgba(253,186,116,0.12)", chipDarkColor: "rgba(253,186,116,0.85)",
    label: "Farm-in",
  },
  FARM_OUT_ACCEPTED: {
    icon: CheckCheck,
    gradient: "from-emerald-400 to-green-500",
    accent: "#4ade80",
    accentBg: "rgba(22,163,74,0.09)",
    chipDarkBg: "rgba(74,222,128,0.12)", chipDarkColor: "rgba(74,222,128,0.90)",
    label: "Farm-out",
  },
  FARM_OUT_DECLINED: {
    icon: XCircle,
    gradient: "from-red-400 to-rose-500",
    accent: "#f87171",
    accentBg: "rgba(220,38,38,0.09)",
    chipDarkBg: "rgba(248,113,113,0.12)", chipDarkColor: "rgba(248,113,113,0.90)",
    label: "Farm-out",
  },
  TRIP_PICKUP_TIME_CHANGED: {
    icon: Clock,
    gradient: "from-blue-500 to-blue-600",
    accent: "#60a5fa",
    accentBg: "rgba(37,99,235,0.09)",
    chipDarkBg: "rgba(96,165,250,0.12)", chipDarkColor: "rgba(96,165,250,0.90)",
    label: "Reservations",
  },
  TRIP_PICKUP_ADDRESS_CHANGED: {
    icon: MapPin,
    gradient: "from-blue-400 to-indigo-500",
    accent: "#818cf8",
    accentBg: "rgba(67,56,202,0.09)",
    chipDarkBg: "rgba(129,140,248,0.12)", chipDarkColor: "rgba(129,140,248,0.90)",
    label: "Reservations",
  },
  TRIP_DROPOFF_ADDRESS_CHANGED: {
    icon: MapPin,
    gradient: "from-indigo-500 to-violet-500",
    accent: "#a78bfa",
    accentBg: "rgba(109,40,217,0.09)",
    chipDarkBg: "rgba(167,139,250,0.12)", chipDarkColor: "rgba(167,139,250,0.90)",
    label: "Reservations",
  },
  TRIP_NOTES_CHANGED: {
    icon: FileText,
    gradient: "from-slate-400 to-slate-600",
    accent: "#94a3b8",
    accentBg: "rgba(71,85,105,0.09)",
    chipDarkBg: "rgba(148,163,184,0.10)", chipDarkColor: "rgba(148,163,184,0.75)",
    label: "Reservations",
  },
  TRIP_STATUS_CHANGED: {
    icon: Activity,
    gradient: "from-indigo-400 to-violet-600",
    accent: "#a78bfa",
    accentBg: "rgba(124,58,237,0.09)",
    chipDarkBg: "rgba(167,139,250,0.12)", chipDarkColor: "rgba(167,139,250,0.90)",
    label: "Reservations",
  },
  TRIP_DRIVER_CHANGED: {
    icon: Car,
    gradient: "from-sky-400 to-blue-500",
    accent: "#38bdf8",
    accentBg: "rgba(2,132,199,0.09)",
    chipDarkBg: "rgba(56,189,248,0.12)", chipDarkColor: "rgba(56,189,248,0.90)",
    label: "Reservations",
  },
  TRIP_CANCELLED: {
    icon: XCircle,
    gradient: "from-red-400 to-rose-600",
    accent: "#f87171",
    accentBg: "rgba(225,29,72,0.09)",
    chipDarkBg: "rgba(248,113,113,0.12)", chipDarkColor: "rgba(248,113,113,0.90)",
    label: "Reservations",
  },
  QUOTE_REQUEST_RECEIVED: {
    icon: MessageSquare,
    gradient: "from-blue-500 to-indigo-600",
    accent: "#60a5fa",
    accentBg: "rgba(37,99,235,0.09)",
    chipDarkBg: "rgba(96,165,250,0.12)", chipDarkColor: "rgba(96,165,250,0.90)",
    label: "Quote Requests",
  },
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS: { id: NotificationTab; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "affiliates",   label: "Affiliates" },
  { id: "farmin",       label: "Farm-in" },
  { id: "farmout",      label: "Farm-out" },
  { id: "reservations", label: "Reservations" },
  { id: "quotes",       label: "Quotes" },
  { id: "unread",       label: "Unread" },
]

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onChange, unreadCount }: {
  active: NotificationTab
  onChange: (t: NotificationTab) => void
  unreadCount: number
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === active)
    const el = tabRefs.current[idx]
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [active])

  return (
    <div className="relative flex items-center overflow-x-auto">
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[i] = el }}
          onClick={() => onChange(tab.id)}
          className="relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 select-none cursor-pointer whitespace-nowrap"
          style={active === tab.id ? { color: "rgba(255,255,255,0.92)" } : { color: "rgba(200,212,228,0.50)" }}
        >
          {tab.label}
          {tab.id === "unread" && unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none bg-red-500 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      ))}
      {indicator.ready && (
        <div
          className="absolute bottom-0 h-[2px] rounded-full pointer-events-none"
          style={{
            left: indicator.left,
            width: indicator.width,
            background: "#c9a87c",
            transition: "left 0.28s cubic-bezier(0.23,1,0.32,1), width 0.28s cubic-bezier(0.23,1,0.32,1)",
          }}
        />
      )}
    </div>
  )
}

// ── Notification card ─────────────────────────────────────────────────────────

function NotificationCard({ notif, onRead, selectMode, selected, onToggleSelect }: {
  notif: AppNotification
  onRead: (id: string) => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const router   = useRouter()
  const meta     = TYPE_META[notif.type] ?? TYPE_META.TRIP_NOTES_CHANGED
  const Icon     = meta.icon
  const isUnread = !notif.readAt
  const [hovered, setHovered] = useState(false)

  function handleCardClick() {
    if (selectMode) { onToggleSelect(notif.id); return }
    if (isUnread) onRead(notif.id)
    if (notif.entityType === "trip") router.push(`/dispatch?open=${notif.entityId}`)
    else if (notif.entityType === "affiliate") router.push("/affiliates")
    else if (notif.entityType === "quote_request") router.push(`/quote-requests?open=${notif.entityId}`)
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleSelect(notif.id)
  }

  const cardBg =
    selected  ? "rgba(201,168,124,0.09)" :
    isUnread  ? meta.accentBg :
    hovered   ? "#111e35" :
    "rgba(255,255,255,0.04)"

  const cardBorderColor =
    selected  ? "rgba(201,168,124,0.28)" :
    isUnread  ? "rgba(255,255,255,0.09)" :
    hovered   ? "rgba(255,255,255,0.11)" :
    "rgba(255,255,255,0.07)"

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorderColor}`,
        borderLeftWidth:  isUnread && !selected ? "3px" : "1px",
        borderLeftColor:  isUnread && !selected ? meta.accent : cardBorderColor,
        transform: !selectMode && hovered ? "translateY(-1px)" : "none",
        boxShadow: !selectMode && hovered ? "0 8px 24px rgba(0,0,0,0.30)" : "none",
      }}
    >
      {/* Checkbox */}
      <div
        onClick={handleCheckboxClick}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 transition-all duration-150",
          selectMode || selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div
          className="w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-150"
          style={selected
            ? { background: "#c9a87c", borderColor: "#c9a87c" }
            : { background: "transparent", borderColor: "rgba(255,255,255,0.25)" }
          }
        >
          {selected && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
              <path d="M1 3.5L3.5 6.5L9 1" stroke="#080c16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Icon */}
      <div className={cn(
        "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 transition-all duration-200",
        "ring-2 shadow-lg",
        meta.gradient,
        !selectMode && "group-hover:scale-110",
        selectMode || selected ? "ml-6" : "group-hover:ml-6"
      )}
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
      >
        <Icon className="text-white drop-shadow-sm" style={{ width: 18, height: 18 }} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p
            className="text-[13.5px] leading-snug"
            style={isUnread
              ? { fontWeight: 600, color: "rgba(255,255,255,0.92)" }
              : { fontWeight: 500, color: "rgba(200,212,228,0.60)" }
            }
          >
            {notif.title}
          </p>
          <span className="text-[11px] whitespace-nowrap font-medium flex-shrink-0 mt-0.5" style={{ color: "rgba(200,212,228,0.38)" }}>
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p
          className="text-[12.5px] leading-relaxed mb-2.5"
          style={isUnread ? { color: "rgba(200,212,228,0.68)" } : { color: "rgba(200,212,228,0.45)" }}
        >
          {notif.body}
        </p>

        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: meta.chipDarkBg, color: meta.chipDarkColor }}
          >
            {meta.label}
          </span>
          {!selectMode && notif.entityId && notif.entityType && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: isUnread ? "rgba(200,212,228,0.45)" : "rgba(200,212,228,0.30)" }}
            >
              {notif.entityType === "trip" ? "View reservation" : notif.entityType === "quote_request" ? "View quote" : "View affiliate"}
              <ArrowUpRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!selectMode && !selected && isUnread && (
        <div
          className="absolute top-4 right-4 w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta.accent, boxShadow: `0 0 0 3px ${meta.accent}25` }}
        />
      )}
    </div>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel, isPending }: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative rounded-2xl w-full max-w-sm p-6 z-10"
        style={{
          background: "#0d1526",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.60)",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.20)" }}
          >
            <Trash2 className="w-4 h-4" style={{ color: "#f87171" }} />
          </div>
          <div>
            <p className="font-semibold text-[15px]" style={{ color: "rgba(255,255,255,0.92)" }}>{title}</p>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "rgba(200,212,228,0.60)" }}>{body}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer"
            style={{ color: "rgba(200,212,228,0.65)", background: "transparent" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.65)"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isPending ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Date grouping ─────────────────────────────────────────────────────────────

function groupByDate(notifications: AppNotification[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  const thisWeek  = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7)

  const groups: { label: string; items: AppNotification[] }[] = []
  const buckets: Record<string, AppNotification[]> = {}

  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0)
    const label =
      d >= today     ? "Today" :
      d >= yesterday ? "Yesterday" :
      d >= thisWeek  ? "This Week" : "Earlier"

    if (!buckets[label]) { buckets[label] = []; groups.push({ label, items: buckets[label] }) }
    buckets[label].push(n)
  }
  return groups
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: NotificationTab }) {
  const msgs: Record<NotificationTab, { icon: React.ElementType; title: string; body: string }> = {
    all:          { icon: Inbox,          title: "All caught up",           body: "No notifications yet. Activity will appear here as it happens." },
    affiliates:   { icon: UserCheck,      title: "No affiliate updates",    body: "Connection accepts, declines, and new invites will show here." },
    farmin:       { icon: ArrowRightLeft, title: "No farm-in jobs",         body: "Jobs sent to you by affiliates will appear here." },
    farmout:      { icon: ArrowRightLeft, title: "No farm-out updates",     body: "Responses to jobs you've farmed out to affiliates will appear here." },
    reservations: { icon: Clock,          title: "No reservation changes",  body: "Pickup time changes, address updates, and status shifts show here." },
    quotes:       { icon: MessageSquare,  title: "No quote requests",       body: "New quote requests from your public profile will appear here." },
    unread:       { icon: BellOff,        title: "Nothing unread",          body: "You're all caught up — great job staying on top of things." },
  }
  const { icon: Icon, title, body } = msgs[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.15)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "rgba(201,168,124,0.50)" }} />
      </div>
      <p className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.70)" }}>{title}</p>
      <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: "rgba(200,212,228,0.45)" }}>{body}</p>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="flex gap-4 p-4 rounded-2xl animate-pulse"
      style={{
        animationDelay: `${delay}ms`,
        background: "#0d1526",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="flex justify-between gap-4">
          <div className="h-3.5 rounded-full w-2/5" style={{ background: "rgba(255,255,255,0.07)" }} />
          <div className="h-3 rounded-full w-14"   style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
        <div className="h-3 rounded-full w-4/5" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-3 rounded-full w-3/5" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-5 rounded-md w-20 mt-1" style={{ background: "rgba(255,255,255,0.05)" }} />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab]                         = useState<NotificationTab>("all")
  const [selectMode, setSelectMode]           = useState(false)
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [clearDropdownOpen, setClearDropdownOpen] = useState(false)
  const [confirm, setConfirm] = useState<{
    type: "range"
    range: "24h" | "week" | "all"
  } | {
    type: "selected"
  } | null>(null)

  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? 0

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useNotifications(tab)
  const markAsRead    = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotifications = useDeleteNotifications()

  function toggleSelect(id: string) {
    setSelectMode(true)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      if (next.size === 0) setSelectMode(false)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === allNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(allNotifications.map((n) => n.id)))
    }
  }

  function handleConfirmDelete() {
    if (!confirm) return
    if (confirm.type === "range") {
      deleteNotifications.mutate({ range: confirm.range }, {
        onSuccess: () => { setConfirm(null); setClearDropdownOpen(false) },
      })
    } else {
      deleteNotifications.mutate({ ids: Array.from(selectedIds) }, {
        onSuccess: () => { setConfirm(null); setSelectMode(false); setSelectedIds(new Set()) },
      })
    }
  }

  const allNotifications = data?.pages.flatMap((p) => p.notifications) ?? []
  const groups = groupByDate(allNotifications)

  const todayCount = allNotifications.filter((n) => {
    const d = new Date(n.createdAt)
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth()    === today.getMonth() &&
      d.getDate()     === today.getDate()
    )
  }).length

  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!node) return
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage()
      })
      observerRef.current.observe(node)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  const allSelected = allNotifications.length > 0 && selectedIds.size === allNotifications.length

  return (
    <>
      {/* Dark backdrop behind dock nav */}
      <div
        className="fixed bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "#080c16", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "#080c16", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-5xl mx-auto space-y-3">

          {/* ── Confirm dialog ── */}
          <AnimatePresence>
            {confirm && (
              <ConfirmDialog
                title={
                  confirm.type === "selected"
                    ? `Delete ${selectedIds.size} notification${selectedIds.size !== 1 ? "s" : ""}?`
                    : confirm.range === "24h"  ? "Clear notifications older than 24h?"
                    : confirm.range === "week" ? "Clear notifications older than 1 week?"
                    : "Clear all notifications?"
                }
                body={
                  confirm.type === "selected"
                    ? "The selected notifications will be permanently removed."
                    : "This action cannot be undone."
                }
                confirmLabel="Delete"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirm(null)}
                isPending={deleteNotifications.isPending}
              />
            )}
          </AnimatePresence>

          {/* ── Header card ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            {/* Title row + stat pills */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <Bell className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Notifications
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em" }}>
                    {unreadCount > 0
                      ? `${unreadCount} update${unreadCount !== 1 ? "s" : ""} waiting for review`
                      : "Stay on top of affiliate and reservation activity"}
                  </p>
                </div>
              </div>

              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {([
                  { label: "All",    value: allNotifications.length, bg: "rgba(201,168,124,0.10)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c",  tabId: "all"    as NotificationTab },
                  { label: "Unread", value: unreadCount,             bg: "rgba(248,113,113,0.10)", color: "rgba(248,113,113,0.90)", dot: "#f87171",  tabId: "unread" as NotificationTab },
                  { label: "Today",  value: todayCount,              bg: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399",  tabId: "all"    as NotificationTab },
                ] as const).map((stat) => (
                  <button
                    key={stat.label}
                    onClick={() => setTab(stat.tabId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer"
                    style={{ background: stat.bg, color: stat.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: stat.dot }} />
                    <span className="tabular-nums">{stat.value}</span>
                    <span className="font-medium" style={{ opacity: 0.7 }}>{stat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "rgba(255,255,255,0.06)" }} />

            {/* Tab bar + action buttons */}
            <div className="flex items-center justify-between gap-4 px-2">
              <TabBar
                active={tab}
                onChange={(t) => { setTab(t); setSelectMode(false); setSelectedIds(new Set()) }}
                unreadCount={unreadCount}
              />

              <div className="flex items-center gap-2 py-3 pr-3 shrink-0">
                {/* Mark all read */}
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className="flex items-center gap-1.5 text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                    style={{ color: "#c9a87c" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1" }}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}

                {/* Clear dropdown */}
                {allNotifications.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setClearDropdownOpen((v) => !v)}
                      className="flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                      style={{ color: "rgba(200,212,228,0.50)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "#f87171"
                        ;(e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.50)"
                        ;(e.currentTarget as HTMLElement).style.background = "transparent"
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    <AnimatePresence>
                      {clearDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setClearDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.14 }}
                            className="absolute right-0 top-full mt-1 w-52 rounded-xl z-20 overflow-hidden py-1"
                            style={{
                              background: "#0d1526",
                              border: "1px solid rgba(255,255,255,0.10)",
                              boxShadow: "0 16px 48px rgba(0,0,0,0.60)",
                            }}
                          >
                            {([
                              { label: "Older than 24 hours", range: "24h"  as const },
                              { label: "Older than 1 week",   range: "week" as const },
                              { label: "All notifications",   range: "all"  as const },
                            ]).map((item) => (
                              <button
                                key={item.range}
                                onClick={() => { setClearDropdownOpen(false); setConfirm({ type: "range", range: item.range }) }}
                                className="w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors cursor-pointer"
                                style={{ color: "rgba(200,212,228,0.70)" }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"
                                  ;(e.currentTarget as HTMLElement).style.color = "#f87171"
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = "transparent"
                                  ;(e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.70)"
                                }}
                              >
                                {item.label}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.div
                key={`skeleton-${tab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-2.5"
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} delay={i * 60} />
                ))}
              </motion.div>
            ) : allNotifications.length === 0 ? (
              <motion.div
                key={`empty-${tab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl"
                style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <EmptyState tab={tab} />
              </motion.div>
            ) : (
              <motion.div
                key={`list-${tab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {groups.map((group) => (
                  <div key={group.label}>
                    {/* Date label + divider */}
                    <div className="flex items-center gap-3 mb-3 px-1">
                      <span
                        className="text-[11px] font-bold uppercase tracking-[0.08em] whitespace-nowrap"
                        style={{ color: "rgba(200,212,228,0.38)" }}
                      >
                        {group.label}
                      </span>
                      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                      <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "rgba(200,212,228,0.28)" }}>
                        {group.items.length} {group.items.length !== 1 ? "updates" : "update"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.items.map((notif) => (
                        <NotificationCard
                          key={notif.id}
                          notif={notif}
                          onRead={(id) => markAsRead.mutate(id)}
                          selectMode={selectMode}
                          selected={selectedIds.has(notif.id)}
                          onToggleSelect={toggleSelect}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Infinite scroll sentinel */}
                <div ref={loadMoreRef} className="py-2 flex justify-center">
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "rgba(201,168,124,0.40)" }}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {/* ── Floating selection action bar ── */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{
                background: "#0d1526",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.60), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Select all */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[13px] font-medium transition-colors pr-3 cursor-pointer"
                style={{ color: "rgba(200,212,228,0.80)", borderRight: "1px solid rgba(255,255,255,0.12)" }}
              >
                <div
                  className="w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all"
                  style={allSelected
                    ? { background: "#c9a87c", borderColor: "#c9a87c" }
                    : { borderColor: "rgba(255,255,255,0.30)" }
                  }
                >
                  {allSelected && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                      <path d="M1 3.5L3.5 6.5L9 1" stroke="#080c16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                All
              </button>

              {/* Count */}
              <span className="text-[13px] font-semibold min-w-[80px] text-center" style={{ color: "rgba(255,255,255,0.88)" }}>
                {selectedIds.size === 0 ? "Select items" : `${selectedIds.size} selected`}
              </span>

              {/* Delete */}
              <button
                onClick={() => setConfirm({ type: "selected" })}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              {/* Cancel */}
              <button
                onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                className="w-7 h-7 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                style={{ color: "rgba(200,212,228,0.50)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)"
                  ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.50)"
                  ;(e.currentTarget as HTMLElement).style.background = "transparent"
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
