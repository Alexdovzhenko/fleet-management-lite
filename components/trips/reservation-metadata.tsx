"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { cn } from "@/lib/utils"

// ── Role display helpers ─────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  OWNER:      "Admin",
  DISPATCHER: "Dispatcher",
  VIEWER:     "Viewer",
}

const ROLE_STYLE: Record<string, React.CSSProperties> = {
  OWNER:      { background: "rgba(99,102,241,0.15)", color: "rgba(165,180,252,0.90)" },
  DISPATCHER: { background: "rgba(14,165,233,0.12)", color: "rgba(125,211,252,0.90)" },
  VIEWER:     { background: "var(--lc-bg-glass)", color: "var(--lc-text-dim)" },
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
    <div className={cn("rounded-2xl overflow-hidden", className)} style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--lc-bg-glass)", background: "var(--lc-bg-card)" }}>
        <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: "#c9a87c" }} />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lc-text-dim)" }}>
          {isNew ? "Creating As" : "Reservation Details"}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3.5 space-y-3">

        {/* Date + Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lc-text-label)" }}>
              {isNew ? "Today" : "Created"}
            </p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--lc-text-primary)" }}>{date}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--lc-text-label)" }}>Time</p>
            <p className="text-sm font-semibold tabular-nums" style={{ color: "var(--lc-text-primary)" }}>{time}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" style={{ borderColor: "var(--lc-bg-glass)" }} />

        {/* Creator row */}
        {displayUser ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", boxShadow: "0 2px 8px rgba(99,102,241,0.35)" }}>
              <span className="text-[10px] font-bold text-white leading-none">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight" style={{ color: "var(--lc-text-primary)" }}>{name}</p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--lc-text-label)" }}>
                {isNew ? "Creating this reservation" : "Created this reservation"}
              </p>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={roleStyle}>
              {roleLabel}
            </span>
          </div>
        ) : !isNew ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} style={{ color: "var(--lc-text-muted)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate leading-tight" style={{ color: "var(--lc-text-dim)" }}>Not recorded</p>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--lc-text-muted)" }}>Created before tracking was enabled</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
