"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

// ── Role display helpers ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  OWNER:      "Admin",
  DISPATCHER: "Dispatcher",
  VIEWER:     "Viewer",
}

const ROLE_STYLE: Record<string, string> = {
  OWNER:      "bg-indigo-50 text-indigo-600",
  DISPATCHER: "bg-sky-50 text-sky-600",
  VIEWER:     "bg-gray-100 text-gray-500",
}

// ── Date/time helpers ────────────────────────────────────────────────────────

function formatMetaDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatMetaTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ReservationMetadataProps {
  /** ISO date string. If omitted (new reservation), uses current time. */
  createdAt?: string
  /** User who created the reservation. If omitted, fetches current user. */
  createdByUser?: { id: string; name: string; role: string } | null
  className?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export function ReservationMetadata({ createdAt, createdByUser, className }: ReservationMetadataProps) {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null)

  // If no createdByUser provided, fetch the logged-in user (Create page case)
  useEffect(() => {
    if (createdByUser !== undefined) return
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser({ name: data.user.name ?? "", role: data.user.role ?? "DISPATCHER" })
      })
      .catch(() => {})
  }, [createdByUser])

  const displayUser = createdByUser ?? currentUser
  const displayDate = createdAt ?? new Date().toISOString()
  const isNew = !createdAt

  // On create page: hide until we have the current user
  if (isNew && !displayUser) return null

  const date = formatMetaDate(displayDate)
  const time = formatMetaTime(displayDate)
  const role = displayUser?.role ?? "DISPATCHER"
  const name = displayUser?.name ?? ""
  const initials = getInitials(name)
  const roleLabel = ROLE_LABEL[role] ?? role
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.DISPATCHER

  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-gray-50/40">
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.14em]">
          {isNew ? "Creating As" : "Reservation Details"}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-3">

        {/* Date + Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.12em]">
              {isNew ? "Today" : "Created"}
            </p>
            <p className="text-sm font-semibold text-gray-800 tabular-nums">{date}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.12em]">Time</p>
            <p className="text-sm font-semibold text-gray-800 tabular-nums">{time}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Creator row */}
        {displayUser ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-[10px] font-bold text-white leading-none">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{name}</p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                {isNew ? "Creating this reservation" : "Created this reservation"}
              </p>
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", roleStyle)}>
              {roleLabel}
            </span>
          </div>
        ) : !isNew ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-400 truncate leading-tight">Not recorded</p>
              <p className="text-[10px] text-gray-300 leading-tight mt-0.5">Created before tracking was enabled</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
