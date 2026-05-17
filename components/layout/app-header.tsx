"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Settings, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useUnreadCount } from "@/lib/hooks/use-notifications"
import { useTheme } from "@/lib/theme-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useCompany } from "@/lib/hooks/use-company"

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
  return name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

function getRoleMeta(role: string, isDark: boolean): { label: string; color: string; bg: string } {
  const r = role.toUpperCase()
  if (r === "ADMIN")   return { label: "Admin",   color: "#c9a87c",  bg: isDark ? "rgba(201,168,124,0.18)" : "rgba(201,168,124,0.15)" }
  if (r === "DRIVER")  return { label: "Driver",  color: isDark ? "#6ee7b7" : "#059669", bg: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)" }
  if (r === "MANAGER") return { label: "Manager", color: isDark ? "#c4b5fd" : "#7c3aed", bg: isDark ? "rgba(139,92,246,0.1)" : "rgba(139,92,246,0.08)" }
  return { label: role, color: "var(--lc-text-dim)", bg: "var(--lc-bg-glass)" }
}

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="5" y="5" width="12" height="12" stroke="rgba(201,168,124,0.75)" strokeWidth="1.2" transform="rotate(45 11 11)" fill="none" />
      <circle cx="11" cy="11" r="2.2" fill="#c9a87c" />
    </svg>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ initials, logo, size = 28 }: { initials: string; logo?: string | null; size?: number }) {
  const radius = Math.round(size * 0.28) // ~rounded-lg squircle, scales with size
  if (logo) {
    return (
      <div
        aria-hidden="true"
        style={{
          width: size, height: size, borderRadius: radius,
          border: "1px solid rgba(201,168,124,0.30)",
          overflow: "hidden", flexShrink: 0,
          background: "rgba(201,168,124,0.08)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        }}
      >
        <img
          src={logo}
          alt="Company logo"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    )
  }
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: radius,
        background: "rgba(201,168,124,0.12)",
        border: "1px solid rgba(201,168,124,0.30)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.round(size * 0.38), fontWeight: 700,
        color: "#c9a87c", letterSpacing: "-0.01em",
        flexShrink: 0, userSelect: "none",
      }}
    >
      {initials}
    </div>
  )
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({ href, onClick, label, children, badgeCount = 0 }: {
  href?: string; onClick?: () => void; label: string; children: React.ReactNode; badgeCount?: number
}) {
  const [hovered, setHovered] = useState(false)
  const style: React.CSSProperties = {
    position: "relative", width: 36, height: 36,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: 10, border: "1px solid",
    borderColor: hovered ? "rgba(201,168,124,0.30)" : "var(--lc-border)",
    background: "none",
    color: hovered ? "#c9a87c" : "var(--lc-text-secondary)",
    cursor: "pointer",
    transition: "background 0.15s ease, color 0.15s ease, border-color 0.15s ease",
    backgroundColor: hovered ? "rgba(201,168,124,0.08)" : "var(--lc-bg-card)",
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
          position: "absolute", top: 4, right: 4,
          minWidth: 15, height: 15, borderRadius: 99,
          background: "#ef4444", fontSize: 9, fontWeight: 700,
          color: "white", display: "flex", alignItems: "center",
          justifyContent: "center", padding: "0 3px",
          boxShadow: "0 0 0 2px var(--lc-header-bg)", lineHeight: 1,
        }}
      >
        {badgeCount > 9 ? "9+" : badgeCount}
      </motion.span>
    </AnimatePresence>
  ) : null

  if (href) {
    return (
      <Link href={href} aria-label={label} style={style as React.CSSProperties}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {children}{badge}
      </Link>
    )
  }
  return (
    <button onClick={onClick} aria-label={label} style={style}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}{badge}
    </button>
  )
}

// ─── Notification bell with ring animation ────────────────────────────────────
function NotificationBell({ hasUnread }: { hasUnread: boolean }) {
  return (
    <motion.div
      animate={hasUnread ? { rotate: [0, -14, 12, -10, 8, -5, 0] } : { rotate: 0 }}
      transition={hasUnread
        ? { duration: 0.7, ease: "easeInOut", repeat: Infinity, repeatDelay: 4 }
        : {}}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", transformOrigin: "top center" }}
    >
      <Bell style={{ width: 19, height: 19 }} />
    </motion.div>
  )
}

// ─── Dropdown menu item ───────────────────────────────────────────────────────
function DropdownItem({ icon: Icon, label, href, onClick, danger = false, disabled = false }: {
  icon: React.ElementType; label: string; href?: string; onClick?: () => void; danger?: boolean; disabled?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "8px 14px",
    fontSize: 12.5, fontWeight: 500,
    fontFamily: "var(--font-outfit, system-ui)",
    color: danger ? "#e57373" : "var(--lc-text-dim)",
    background: hovered
      ? danger ? "rgba(220,38,38,0.08)" : "var(--lc-bg-glass)"
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
        <Icon style={{ width: 13, height: 13, color: danger ? "#e57373" : "var(--lc-text-muted)", flexShrink: 0 }} />
        {label}
      </Link>
    )
  }
  return (
    <button style={style} onClick={onClick} disabled={disabled} role="menuitem"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Icon style={{ width: 13, height: 13, color: danger ? "#e57373" : "var(--lc-text-muted)", flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ─── App Header ───────────────────────────────────────────────────────────────
export function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.count ?? 0
  const { isDark } = useTheme()

  const { data: company } = useCompany()
  const companyLogo = company?.logo ?? null

  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const pageTitle = getPageTitle(pathname)
  const initials = user ? getInitials(user.name || user.email) : "?"
  const roleMeta = user ? getRoleMeta(user.role, isDark) : null

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 2)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const h = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [dropdownOpen])

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
        background: scrolled ? "var(--lc-header-scrolled)" : "var(--lc-header-bg)",
        backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "none",
        borderBottom: "1px solid var(--lc-header-border)",
        boxShadow: scrolled
          ? isDark
            ? "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(201,168,124,0.06)"
            : "0 2px 16px rgba(0,0,0,0.08)"
          : "none",
        transition: "box-shadow 0.25s ease, background 0.25s ease",
        fontFamily: "var(--font-outfit, system-ui)",
      }}
    >
      {/* ── Left: logo + separator + page title ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
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
              color: "var(--lc-text-secondary)",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              userSelect: "none",
            }}
          >
            Livery Connect
          </span>
        </Link>

        <div aria-hidden="true" style={{ width: 1, height: 14, background: "var(--lc-border)", flexShrink: 0 }} />

        <span
          aria-current="page"
          style={{
            fontSize: "0.6rem", fontWeight: 500,
            letterSpacing: "0.16em", textTransform: "uppercase",
            color: "#c9a87c",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {pageTitle}
        </span>
      </div>

      {/* ── Center: future search slot ── */}
      <div style={{ flex: 1 }} className="hidden lg:flex" aria-hidden="true" />

      {/* ── Right: theme toggle + actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Theme toggle */}
        <ThemeToggle />

        <div aria-hidden="true" style={{ width: 1, height: 16, background: "var(--lc-border)", margin: "0 2px" }} />

        {/* Notification bell */}
        <IconBtn
          href="/notifications"
          label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : "Notifications"}
          badgeCount={unreadCount}
        >
          <NotificationBell hasUnread={unreadCount > 0} />
        </IconBtn>

        <div aria-hidden="true" style={{ width: 1, height: 16, background: "var(--lc-border)", margin: "0 2px" }} />

        {/* User menu */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <UserMenuTrigger
            initials={initials}
            logo={companyLogo}
            userName={user?.name?.split(" ")[0] ?? "Account"}
            open={dropdownOpen}
            onClick={() => setDropdownOpen(v => !v)}
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
                  background: "var(--lc-bg-surface)",
                  border: "1px solid var(--lc-border)",
                  boxShadow: "var(--lc-shadow-card)",
                  overflow: "hidden",
                  transformOrigin: "top right",
                  zIndex: 50,
                }}
              >
                <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--lc-border-subtle)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={initials} logo={companyLogo} size={40} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--lc-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user?.name ?? "User"}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--lc-text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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

                <div style={{ padding: "4px 0" }}>
                  <DropdownItem icon={Settings} label="Settings" href="/settings" onClick={() => setDropdownOpen(false)} />
                </div>

                <div style={{ height: 1, margin: "0 10px", background: "var(--lc-border-subtle)" }} />

                <div style={{ padding: "4px 0" }}>
                  <DropdownItem icon={LogOut} label={loggingOut ? "Signing out…" : "Sign out"} danger disabled={loggingOut} onClick={handleLogout} />
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
function UserMenuTrigger({ initials, logo, userName, open, onClick }: {
  initials: string; logo?: string | null; userName: string; open: boolean; onClick: () => void
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
        background: hovered ? "rgba(201,168,124,0.08)" : "transparent",
        cursor: "pointer",
        transition: "background 0.15s ease",
        outline: "none",
      }}
    >
      <Avatar initials={initials} logo={logo} size={34} />
      <span
        className="hidden md:block"
        style={{
          fontSize: "0.82rem", fontWeight: 600,
          letterSpacing: "0.01em",
          color: hovered ? "#d4b688" : "var(--lc-text-primary)",
          maxWidth: 96, overflow: "hidden",
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
          color: hovered ? "rgba(201,168,124,0.55)" : "var(--lc-text-muted)",
          flexShrink: 0,
          transition: "transform 0.2s cubic-bezier(0.16,1,0.3,1), color 0.15s ease",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }}
      />
    </button>
  )
}
