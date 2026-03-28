"use client"

import { useState, useRef, useCallback } from "react"
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
  accent: string       // hex, used for left border + glow
  accentBg: string     // rgba, used for unread card tint
  chipBg: string
  chipText: string
  label: string
}

const TYPE_META: Record<string, TypeMeta> = {
  AFFILIATE_INVITE_RECEIVED: {
    icon: UserPlus,
    gradient: "from-violet-500 to-purple-600",
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.03)",
    chipBg: "bg-violet-50", chipText: "text-violet-700",
    label: "Affiliates",
  },
  AFFILIATE_INVITE_ACCEPTED: {
    icon: UserCheck,
    gradient: "from-emerald-400 to-teal-500",
    accent: "#059669",
    accentBg: "rgba(5,150,105,0.03)",
    chipBg: "bg-emerald-50", chipText: "text-emerald-700",
    label: "Affiliates",
  },
  AFFILIATE_INVITE_DECLINED: {
    icon: UserX,
    gradient: "from-rose-400 to-red-500",
    accent: "#e11d48",
    accentBg: "rgba(225,29,72,0.03)",
    chipBg: "bg-rose-50", chipText: "text-rose-700",
    label: "Affiliates",
  },
  FARM_OUT_RECEIVED: {
    icon: ArrowRightLeft,
    gradient: "from-amber-400 to-orange-500",
    accent: "#d97706",
    accentBg: "rgba(217,119,6,0.03)",
    chipBg: "bg-amber-50", chipText: "text-amber-700",
    label: "Farm-in",
  },
  FARM_OUT_CANCELLED: {
    icon: XCircle,
    gradient: "from-orange-400 to-red-400",
    accent: "#ea580c",
    accentBg: "rgba(234,88,12,0.03)",
    chipBg: "bg-orange-50", chipText: "text-orange-700",
    label: "Farm-in",
  },
  FARM_OUT_ACCEPTED: {
    icon: CheckCheck,
    gradient: "from-emerald-400 to-green-500",
    accent: "#16a34a",
    accentBg: "rgba(22,163,74,0.03)",
    chipBg: "bg-emerald-50", chipText: "text-emerald-700",
    label: "Farm-out",
  },
  FARM_OUT_DECLINED: {
    icon: XCircle,
    gradient: "from-red-400 to-rose-500",
    accent: "#dc2626",
    accentBg: "rgba(220,38,38,0.03)",
    chipBg: "bg-red-50", chipText: "text-red-700",
    label: "Farm-out",
  },
  TRIP_PICKUP_TIME_CHANGED: {
    icon: Clock,
    gradient: "from-blue-500 to-blue-600",
    accent: "#2563eb",
    accentBg: "rgba(37,99,235,0.03)",
    chipBg: "bg-blue-50", chipText: "text-blue-700",
    label: "Reservations",
  },
  TRIP_PICKUP_ADDRESS_CHANGED: {
    icon: MapPin,
    gradient: "from-blue-400 to-indigo-500",
    accent: "#4338ca",
    accentBg: "rgba(67,56,202,0.03)",
    chipBg: "bg-indigo-50", chipText: "text-indigo-700",
    label: "Reservations",
  },
  TRIP_DROPOFF_ADDRESS_CHANGED: {
    icon: MapPin,
    gradient: "from-indigo-500 to-violet-500",
    accent: "#6d28d9",
    accentBg: "rgba(109,40,217,0.03)",
    chipBg: "bg-violet-50", chipText: "text-violet-700",
    label: "Reservations",
  },
  TRIP_NOTES_CHANGED: {
    icon: FileText,
    gradient: "from-slate-400 to-slate-600",
    accent: "#475569",
    accentBg: "rgba(71,85,105,0.03)",
    chipBg: "bg-slate-50", chipText: "text-slate-600",
    label: "Reservations",
  },
  TRIP_STATUS_CHANGED: {
    icon: Activity,
    gradient: "from-indigo-400 to-violet-600",
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.03)",
    chipBg: "bg-violet-50", chipText: "text-violet-700",
    label: "Reservations",
  },
  TRIP_DRIVER_CHANGED: {
    icon: Car,
    gradient: "from-sky-400 to-blue-500",
    accent: "#0284c7",
    accentBg: "rgba(2,132,199,0.03)",
    chipBg: "bg-sky-50", chipText: "text-sky-700",
    label: "Reservations",
  },
  TRIP_CANCELLED: {
    icon: XCircle,
    gradient: "from-red-400 to-rose-600",
    accent: "#e11d48",
    accentBg: "rgba(225,29,72,0.03)",
    chipBg: "bg-rose-50", chipText: "text-rose-700",
    label: "Reservations",
  },
  QUOTE_REQUEST_RECEIVED: {
    icon: MessageSquare,
    gradient: "from-blue-500 to-indigo-600",
    accent: "#2563eb",
    accentBg: "rgba(37,99,235,0.03)",
    chipBg: "bg-blue-50", chipText: "text-blue-700",
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
  { id: "quotes",       label: "Quote Requests" },
  { id: "unread",       label: "Unread" },
]

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  unreadCount,
}: {
  active: NotificationTab
  onChange: (t: NotificationTab) => void
  unreadCount: number
}) {
  return (
    <div className="flex items-center">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 select-none",
            active === tab.id ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
          )}
        >
          {tab.label}
          {tab.id === "unread" && unreadCount > 0 && (
            <span className={cn(
              "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
              active === tab.id ? "bg-blue-600 text-white" : "bg-red-500 text-white"
            )}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          {active === tab.id && (
            <motion.div
              layoutId="notifications-tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ── Notification card ─────────────────────────────────────────────────────────

function NotificationCard({
  notif,
  onRead,
  selectMode,
  selected,
  onToggleSelect,
}: {
  notif: AppNotification
  onRead: (id: string) => void
  selectMode: boolean
  selected: boolean
  onToggleSelect: (id: string) => void
}) {
  const router = useRouter()
  const meta = TYPE_META[notif.type] ?? TYPE_META.TRIP_NOTES_CHANGED
  const Icon = meta.icon
  const isUnread = !notif.readAt

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

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200",
        !selectMode && "hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        selected
          ? "border-blue-300 bg-blue-50/40"
          : isUnread
            ? "bg-white border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
            : "bg-gray-50/60 border-gray-100 shadow-none hover:bg-white"
      )}
      style={!selected && isUnread ? {
        borderLeftWidth: "3px",
        borderLeftColor: meta.accent,
        background: meta.accentBg,
        boxShadow: `0 2px 12px rgba(0,0,0,0.05)`,
      } : undefined}
    >
      {/* Checkbox — visible on hover or when selectMode is active */}
      <div
        onClick={handleCheckboxClick}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-5 h-5 transition-all duration-150",
          selectMode || selected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        )}
      >
        <div className={cn(
          "w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center transition-all duration-150",
          selected
            ? "bg-blue-600 border-blue-600"
            : "bg-white border-gray-300 group-hover:border-gray-400"
        )}>
          {selected && (
            <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
              <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {/* Icon — shifts right when checkbox is visible */}
      <div className={cn(
        "w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm transition-all duration-200",
        !selectMode && "group-hover:scale-105",
        selectMode || selected ? "ml-6" : "group-hover:ml-6"
      )}>
        <Icon className="text-white" style={{ width: 17, height: 17 }} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className={cn(
            "text-[13.5px] leading-snug",
            isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-500"
          )}>
            {notif.title}
          </p>
          <span className="text-[11px] text-gray-400 whitespace-nowrap font-medium flex-shrink-0 mt-0.5">
            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
          </span>
        </div>

        <p className={cn(
          "text-[12.5px] leading-relaxed mb-2.5",
          isUnread ? "text-gray-500" : "text-gray-400"
        )}>
          {notif.body}
        </p>

        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-md",
            meta.chipBg, meta.chipText
          )}>
            {meta.label}
          </span>
          {!selectMode && notif.entityId && notif.entityType && (
            <span className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium transition-colors",
              isUnread ? "text-gray-400 group-hover:text-gray-600" : "text-gray-300 group-hover:text-gray-500"
            )}>
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
          style={{ backgroundColor: meta.accent, boxShadow: `0 0 0 3px ${meta.accent}20` }}
        />
      )}
    </div>
  )
}

// ── Confirm dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[15px]">{title}</p>
            <p className="text-[13px] text-gray-500 mt-1 leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-60"
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
  const thisWeek = new Date(today); thisWeek.setDate(thisWeek.getDate() - 7)

  const groups: { label: string; items: AppNotification[] }[] = []
  const buckets: Record<string, AppNotification[]> = {}

  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0)
    const label =
      d >= today ? "Today" :
      d >= yesterday ? "Yesterday" :
      d >= thisWeek ? "This Week" : "Earlier"

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
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-300" />
      </div>
      <p className="font-semibold text-gray-500 text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">{body}</p>
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-11 h-11 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2 py-0.5">
        <div className="flex justify-between gap-4">
          <div className="h-3.5 bg-gray-100 rounded-full w-2/5" />
          <div className="h-3 bg-gray-100 rounded-full w-14" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
        <div className="h-3 bg-gray-100 rounded-full w-3/5" />
        <div className="h-5 bg-gray-100 rounded-md w-20 mt-1" />
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [tab, setTab] = useState<NotificationTab>("all")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()
  const deleteNotifications = useDeleteNotifications()

  function toggleSelect(id: string) {
    setSelectMode(true)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      // Exit select mode if nothing remains selected
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
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
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
    <div className="max-w-5xl mx-auto space-y-5">

      {/* ── Confirm dialog ── */}
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            title={
              confirm.type === "selected"
                ? `Delete ${selectedIds.size} notification${selectedIds.size !== 1 ? "s" : ""}?`
                : confirm.range === "24h" ? "Clear notifications older than 24h?"
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
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] relative">

        {/* Title row + metric strip */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">

          {/* Left: icon + title + description */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
                boxShadow: "0 4px 12px rgba(37,99,235,0.18)",
              }}
            >
              <Bell className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">
                Notifications
              </h1>
              <p className="text-[13px] text-gray-400 mt-0.5 leading-snug">
                {unreadCount > 0
                  ? `${unreadCount} update${unreadCount !== 1 ? "s" : ""} waiting for your review`
                  : "Stay on top of affiliate and reservation activity"}
              </p>
            </div>
          </div>

          {/* Right: metric strip */}
          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "All",    value: allNotifications.length, dot: "bg-blue-500",    tabId: "all"    as NotificationTab },
              { label: "Unread", value: unreadCount,             dot: "bg-red-400",     tabId: "unread" as NotificationTab },
              { label: "Today",  value: todayCount,              dot: "bg-emerald-500", tabId: "all"    as NotificationTab },
            ] as const).map((stat) => (
              <button
                key={stat.label}
                onClick={() => setTab(stat.tabId)}
                className={cn(
                  "flex flex-col items-center justify-center px-5 py-3 min-w-[88px] transition-all duration-150",
                  tab === stat.tabId && stat.label !== "Today"
                    ? "bg-white shadow-[0_0_0_1px_rgba(37,99,235,0.08)] relative"
                    : "hover:bg-white/70"
                )}
              >
                <span className={cn(
                  "text-[22px] font-bold leading-none tracking-tight",
                  tab === stat.tabId && stat.label !== "Today" ? "text-blue-600" : "text-gray-800"
                )}>
                  {stat.value}
                </span>
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stat.dot)} />
                  <span className="text-[11px] text-gray-400 font-medium leading-none whitespace-nowrap">
                    {stat.label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        {/* Tab bar + action buttons */}
        <div className="flex items-center justify-between gap-4 px-6">
          <TabBar active={tab} onChange={(t) => { setTab(t); setSelectMode(false); setSelectedIds(new Set()) }} unreadCount={unreadCount} />

          <div className="flex items-center gap-2 py-3 shrink-0">
            {/* Mark all read */}
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
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
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-red-600 transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50"
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
                        className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden py-1"
                      >
                        {([
                          { label: "Older than 24 hours", range: "24h" as const },
                          { label: "Older than 1 week",   range: "week" as const },
                          { label: "All notifications",   range: "all" as const },
                        ]).map((item) => (
                          <button
                            key={item.range}
                            onClick={() => { setClearDropdownOpen(false); setConfirm({ type: "range", range: item.range }) }}
                            className="w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
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
            className="bg-white rounded-2xl border border-gray-100 shadow-sm"
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
                {/* Date label */}
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[11px] text-gray-300 font-medium whitespace-nowrap">
                    {group.items.length} {group.items.length !== 1 ? "updates" : "update"}
                  </span>
                </div>

                {/* Cards */}
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
                      className="w-1.5 h-1.5 rounded-full bg-gray-300"
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

      {/* ── Floating selection action bar ── */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl shadow-black/25 border border-white/10">
              {/* Select all checkbox */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors pr-3 border-r border-white/15"
              >
                <div className={cn(
                  "w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all",
                  allSelected ? "bg-blue-500 border-blue-500" : "border-white/40 hover:border-white/70"
                )}>
                  {allSelected && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2" fill="none">
                      <path d="M1 3.5L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                All
              </button>

              {/* Count */}
              <span className="text-[13px] font-semibold text-white min-w-[80px] text-center">
                {selectedIds.size === 0
                  ? "Select items"
                  : `${selectedIds.size} selected`}
              </span>

              {/* Delete */}
              <button
                onClick={() => setConfirm({ type: "selected" })}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-1.5 text-[13px] font-semibold bg-red-500 hover:bg-red-600 transition-colors px-3 py-1.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>

              {/* Cancel */}
              <button
                onClick={() => { setSelectMode(false); setSelectedIds(new Set()) }}
                className="w-7 h-7 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
