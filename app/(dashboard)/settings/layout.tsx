"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Building2, BookMarked, Settings2, Zap, LayoutGrid, Mail, ExternalLink, User, Users, LogOut, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Section = "profile" | "address-book" | "service-types" | "status-actions" | "grid-columns" | "personal" | "team" | "sender-emails" | "pdf-branding" | "billing"

const NAV_GROUPS: { label: string; items: { key: Section; label: string; icon: React.ElementType }[] }[] = [
  {
    label: "Company",
    items: [
      { key: "profile",      label: "Profile",      icon: Building2 },
      { key: "address-book", label: "Address Book",  icon: BookMarked },
    ],
  },
  {
    label: "Dispatch",
    items: [
      { key: "service-types",   label: "Service Types",   icon: Settings2 },
      { key: "status-actions",  label: "Status Actions",  icon: Zap },
      { key: "grid-columns",    label: "Grid Columns",    icon: LayoutGrid },
    ],
  },
  {
    label: "Email & PDFs",
    items: [
      { key: "sender-emails", label: "Sender Emails", icon: Mail },
      { key: "pdf-branding",  label: "PDF Branding",  icon: ExternalLink },
      { key: "billing",       label: "Billing",       icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "personal", label: "Personal",     icon: User },
      { key: "team",     label: "Team",         icon: Users },
    ],
  },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentSection = pathname.split("/").pop() as Section || "profile"

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const allItems = NAV_GROUPS.flatMap(g => g.items)
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false })

  useEffect(() => {
    const idx = allItems.findIndex(i => i.key === currentSection)
    const el = tabRefs.current[idx]
    if (el) setIndicator({ x: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [currentSection])

  const handleSectionChange = (s: Section) => router.push(`/settings/${s}`)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <div
      className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 flex flex-col md:flex-row"
      style={{
        background: "var(--lc-bg-page)",
        minHeight: "calc(100dvh - 56px)",
        marginBottom: "max(-121px, calc(-121px - env(safe-area-inset-bottom)))",
      }}
    >
      {/* ── Mobile Tab Bar ── */}
      <div
        className="md:hidden relative overflow-hidden"
        style={{ borderBottom: "1px solid var(--lc-bg-glass)" }}
      >
        <div className="flex px-2 py-2 gap-0.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {indicator.ready && (
            <div
              className="absolute bottom-0 left-0 h-[2px] rounded-full pointer-events-none"
              style={{
                width: indicator.width,
                transform: `translateX(${indicator.x}px)`,
                background: "#c9a87c",
                transition: "transform 0.25s cubic-bezier(0.23,1,0.32,1), width 0.25s cubic-bezier(0.23,1,0.32,1)",
                willChange: "transform",
              }}
            />
          )}
          {allItems.map((item, idx) => {
            const active = currentSection === item.key
            return (
              <button
                key={item.key}
                ref={el => { tabRefs.current[idx] = el }}
                onClick={() => handleSectionChange(item.key)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0"
                style={{ color: active ? "#c9a87c" : "var(--lc-text-label)" }}
              >
                <item.icon className="w-[13px] h-[13px] flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
        <div className="px-2 py-2" style={{ borderTop: "1px solid var(--lc-bg-glass)" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style={{ color: "var(--lc-text-muted)" }}
          >
            <LogOut className="w-[13px] h-[13px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="hidden md:flex md:w-[212px] md:shrink-0 md:flex-col"
        style={{
          borderRight: "1px solid var(--lc-bg-glass)",
          background: "#0a1120",
        }}
      >
        {/* Header */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--lc-bg-glass)" }}>
          <p className="text-[13px] font-bold tracking-tight" style={{ color: "var(--lc-text-primary)" }}>Settings</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--lc-text-muted)" }}>Manage your workspace</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest px-2.5 mb-2"
                style={{ color: "var(--lc-text-muted)", letterSpacing: "0.12em" }}
              >
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = currentSection === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSectionChange(item.key)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] text-left transition-all relative group"
                      style={{
                        background: active ? "rgba(201,168,124,0.10)" : "transparent",
                        color: active ? "#c9a87c" : "var(--lc-text-dim)",
                        fontWeight: active ? 600 : 400,
                        borderLeft: active ? "2px solid #c9a87c" : "2px solid transparent",
                      }}
                      onMouseEnter={e => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-card)"
                      }}
                      onMouseLeave={e => {
                        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"
                      }}
                    >
                      <item.icon
                        className="w-[15px] h-[15px] flex-shrink-0"
                        style={{ color: active ? "#c9a87c" : "var(--lc-text-muted)" }}
                      />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign Out — pinned to the visual bottom of the sidebar */}
        <div className="px-3 pt-3 mt-auto" style={{ paddingBottom: "max(121px, calc(121px + env(safe-area-inset-bottom)))" }}>
          {/* Separator with fade */}
          <div
            className="mb-3 h-px"
            style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)" }}
          />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-[13px] font-medium text-left"
            style={{
              color: "rgba(255,255,255,0.35)",
              border: "1px solid transparent",
              transition: "background 180ms ease-out, color 180ms ease-out, border-color 180ms ease-out, transform 120ms ease-out",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "rgba(248,113,113,0.08)"
              el.style.color = "rgba(248,113,113,0.90)"
              el.style.borderColor = "rgba(248,113,113,0.18)"
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.background = "transparent"
              el.style.color = "rgba(255,255,255,0.35)"
              el.style.borderColor = "transparent"
              el.style.transform = "scale(1)"
            }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)" }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)" }}
          >
            {/* Icon container */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <LogOut className="w-3.5 h-3.5" />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div
        className="flex-1 min-w-0 overflow-y-auto"
        style={{
          "--border": "var(--lc-bg-glass-hover)",
          "--input": "var(--lc-bg-glass)",
          "--ring": "#c9a87c",
          "--foreground": "var(--lc-text-primary)",
          "--muted-foreground": "var(--lc-text-label)",
          color: "var(--lc-text-primary)",
        } as React.CSSProperties}
      >
        {/* md:pr-[212px] mirrors the sidebar width on the right so mx-auto
            centers content relative to the full screen, not just this column */}
        <div className="md:pr-[212px]">
          {children}
        </div>
      </div>
    </div>
  )
}
