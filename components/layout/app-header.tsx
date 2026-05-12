"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Settings, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useUnreadCount } from "@/lib/hooks/use-notifications"

// ─── Design tokens (matching login page exactly) ──────────────────────────────
const T = {
  bg:         "#080c16",
  gold:       "#c9a87c",
  goldHover:  "#d4b98c",
  goldDim:    "rgba(201,168,124,0.55)",
  goldGlow:   "rgba(201,168,124,0.18)",
  text:       "rgba(255,255,255,0.88)",
  textDim:    "rgba(200,212,228,0.45)",
  textMuted:  "rgba(200,212,228,0.28)",
  border:     "rgba(255,255,255,0.07)",
  hoverBg:    "rgba(255,255,255,0.05)",
  hoverBgGold:"rgba(201,168,124,0.08)",
}

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES: [string, string][] = [
  ["/trips/new",      "New Trip"],
  ["/settings",       "Settings"],
  ["/dispatch",       "Dispatch"],
  ["/trips",          "Trips"],
  ["/customers",      "Customers"],
  ["/drivers",        "Drivers"],
  ["/vehicles",       "Vehicles"],
  ["/invoices",       "Invoices"],
  ["/earnings",       "Earnings"],
  ["/affiliates",     "Affiliates"],
  ["/notifications",  "Notifications"],
  ["/billing",        "Billing"],
  ["/quote-requests", "Quote Requests"],
]

function getPageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))
  return match ? match[1] : "Dashboard"
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function getRoleMeta(role: string): { label: string; color: string; bg: string } {
  const r = role.toUpperCase()
  if (r === "ADMIN")   return { label: "Admin",   color: T.gold,    bg: T.goldGlow }
  if (r === "DRIVER")  return { label: "Driver",  color: "#6ee7b7", bg: "rgba(16,185,129,0.1)" }
  if (r === "MANAGER") return { label: "Manager", color: "#c4b5fd", bg: "rgba(139,92,246,0.1)" }
  return                      { label: role,       color: T.textDim, bg: "rgba(255,255,255,0.06)" }
}

// ─── Logo mark (matches login page exactly) ───────────────────────────────────
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect
        x="5" y="5" width="12" height="12"
        stroke="rgba(201,168,124,0.75)" strokeWidth="1.2"
        transform="rotate(45 11 11)" fill="none"
      />
      <circle cx="11" cy="11" r="2.2" fill={T.gold} />
    </svg>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: "50%",
        background: "rgba(201,168,124,0.12)",
        border: `1px solid rgba(201,168,124,0.30)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.38), fontWeight: 700,
        color: T.gold, letterSpacing: "-0.01em",
        flexShrink: 0, userSelect: "none",
      }}
    >
      {initials}
    </div>
  )
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({
  href, onClick, label, children, badgeCount = 0,
}: {
  href?: string
  onClick?: () => void
  label: string
  children: React.ReactNode
  badgeCount?: number
}) {
  const [hovered, setHovered] = useState(false)
  const style: React.CSSProperties = {
    position: "relative",
    width: 34, height: 34,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 8, border: "none", background: "none",
    color: hovered ? T.gold : T.textDim,
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease",
    backgroundColor: hovered ? T.hoverBgGold : "transparent",
    flexShrink: 0,
  }

  const badge = badgeCount > 0 ? (
    <AnimatePresence>
      <motion.span
        key="badge"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 600, damping: 24 }}
        aria-hidden="true"
        style={{
          position: "absolute", top: 5, right: 5,
          minWidth: 14, height: 14, borderRadius: 99,
          background: "#ef4444", fontSize: 9, fontWeight: 700,
          color: "white", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "0 3px",
          boxShadow: `0 0 0 1.5px ${T.bg}`, lineHeight: 1,
        }}
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </motion.span>
    </AnimatePresence>
  ) : null

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        style={style as React.CSSProperties}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {children}
        {badge}
      </Link>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {badge}
    </button>
  )
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────
function DropdownItem({
  icon: Icon, label, href, onClick, danger = false, disabled = false,
}: {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "8px 14px",
    fontSize: 12.5, fontWeight: 500,
    fontFamily: "var(--font-outfit, system-ui)",
    color: danger ? "#e57373" : "rgba(200,212,228,0.75)",
    background: hovered
      ? danger ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.05)"
      : "transparent",
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    textDecoration: "none",
    transition: "background 0.12s ease, color 0.12s ease",
    letterSpacing: "0.01em",
  }

  if (href) {
    return (
      <Link href={href} style={style} onClick={onClick} role="menuitem"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        <Icon style={{ width: 13, height: 13, color: danger ? "#e57373" : T.textDim, flexShrink: 0 }} />
        {label}
      </Link>
    )
  }
  return (
    <button style={style} onClick={onClick} disabled={disabled} role="menuitem"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Icon style={{ width: 13, height: 13, color: danger ? "#e57373" : T.textDim, flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ─── App Header ───────────────────────────────────────────────────────────────
export function AppHeader() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { user }  = useAuth()
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? 0

  const [scrolled,     setScrolled]     = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut,   setLoggingOut]   = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const pageTitle = getPageTitle(pathname)
  const initials  = user ? getInitials(user.name || user.email) : "?"
  const roleMeta  = user ? getRoleMeta(user.role) : null

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [dropdownOpen])

  // Close on Escape
  useEffect(() => {
    if (!dropdownOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setDropdownOpen(false) }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [dropdownOpen])

  const handleLogout = useCallback(async () => {
    setLoggingOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }, [router])

  return (
    <header
      role="banner"
      style={{
        position: "sticky", top: 0, zIndex: 40,
        height: 56,
        display: "flex", alignItems: "center",
        paddingLeft:  "clamp(16px, 4vw, 28px)",
        paddingRight: "clamp(16px, 4vw, 28px)",
        background: scrolled ? "rgba(8,12,22,0.97)" : T.bg,
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        borderBottom: `1px solid ${T.border}`,
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(201,168,124,0.06)" : "none",
        transition: "box-shadow 0.25s ease, background 0.25s ease",
        fontFamily: "var(--font-outfit, system-ui)",
      }}
    >
      {/* ── Left: logo + separator + page title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>

        {/* Logo */}
        <Link
          href="/dispatch"
          aria-label="LiveryConnect — Dispatch"
          style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", flexShrink: 0 }}
        >
          <LogoMark size={22} />
          <span
            className="hidden sm:block"
            style={{
              fontFamily: "var(--font-outfit, system-ui)",
              fontSize: "0.6rem", fontWeight: 500,
              color: "rgba(255,255,255,0.82)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            Livery Connect
          </span>
        </Link>

        {/* Separator */}
        <div
          aria-hidden="true"
          style={{ width: 1, height: 14, background: "rgba(255,255,255,0.1)", flexShrink: 0 }}
        />

        {/* Page title */}
        <span
          aria-current="page"
          style={{
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: T.gold,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* ── Center: future global search slot ── */}
      <div style={{ flex: 1 }} className="hidden lg:flex" aria-hidden="true" />

      {/* ── Right: actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>

        {/* Notification bell */}
        <IconBtn
          href="/notifications"
          label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : "Notifications"}
          badgeCount={unreadCount}
        >
          <Bell style={{ width: 15, height: 15 }} />
        </IconBtn>

        {/* Thin divider */}
        <div
          aria-hidden="true"
          style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)", margin: "0 6px" }}
        />

        {/* User menu */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <UserMenuTrigger
            initials={initials}
            userName={user?.name?.split(" ")[0] ?? "Account"}
            open={dropdownOpen}
            onClick={() => setDropdownOpen((v) => !v)}
          />

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                role="menu"
                aria-label="Account menu"
                style={{
                  position: "absolute", right: 0,
                  top: "calc(100% + 8px)",
                  width: 220,
                  borderRadius: 12,
                  background: "#0d1526",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(201,168,124,0.08)",
                  overflow: "hidden",
                  transformOrigin: "top right",
                  zIndex: 50,
                }}
              >
                {/* User info */}
                <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={initials} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.name ?? "User"}
                      </p>
                      <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  {roleMeta && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "inline-flex", alignItems: "center",
                        padding: "2px 8px", borderRadius: 99,
                        background: roleMeta.bg, color: roleMeta.color,
                        fontSize: 10, fontWeight: 600,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}
                    >
                      {roleMeta.label}
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div style={{ padding: "4px 0" }}>
                  <DropdownItem
                    icon={Settings} label="Settings" href="/settings"
                    onClick={() => setDropdownOpen(false)}
                  />
                </div>

                {/* Divider */}
                <div style={{ height: 1, margin: "0 10px", background: "rgba(255,255,255,0.06)" }} />

                {/* Sign out */}
                <div style={{ padding: "4px 0" }}>
                  <DropdownItem
                    icon={LogOut}
                    label={loggingOut ? "Signing out…" : "Sign out"}
                    danger disabled={loggingOut}
                    onClick={handleLogout}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}

// ─── User menu trigger ────────────────────────────────────────────────────────
function UserMenuTrigger({
  initials, userName, open, onClick,
}: {
  initials: string
  userName: string
  open: boolean
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      aria-label="Account menu"
      aria-haspopup="true"
      aria-expanded={open}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 7,
        padding: "4px 8px 4px 4px",
        borderRadius: 10, border: "none",
        background: hovered ? T.hoverBgGold : "transparent",
        cursor: "pointer",
        transition: "background 0.15s ease",
        outline: "none",
      }}
    >
      <Avatar initials={initials} size={27} />
      <span
        className="hidden md:block"
        style={{
          fontSize: "0.72rem", fontWeight: 500,
          letterSpacing: "0.03em",
          color: hovered ? T.goldHover : "rgba(200,212,228,0.62)",
          maxWidth: 88, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap",
          transition: "color 0.15s ease",
          userSelect: "none",
          fontFamily: "var(--font-outfit, system-ui)",
        }}
      >
        {userName}
      </span>
      <ChevronDown
        className="hidden md:block"
        style={{
          width: 12, height: 12,
          color: hovered ? T.goldDim : T.textMuted,
          flexShrink: 0,
          transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), color 0.15s ease",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  )
}
