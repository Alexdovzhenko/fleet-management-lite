"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, Check } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

interface Account {
  id: string
  name: string
  type: "CUSTOMER" | "AFFILIATE"
}

interface AccountFilterDropdownProps {
  accounts: Account[]
  value: string | null
  onChange: (value: string | null) => void
  isLoading?: boolean
}

export function AccountFilterDropdown({ accounts, value, onChange, isLoading }: AccountFilterDropdownProps) {
  const { isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)

  const customers  = accounts.filter((a) => a.type === "CUSTOMER")
  const affiliates = accounts.filter((a) => a.type === "AFFILIATE")
  const selectedLabel = accounts.find((a) => a.id === value)?.name || "All Accounts"
  const isActive = !!value

  function openDropdown() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: Math.max(rect.width, 200),
      zIndex: 9999,
    })
    setIsOpen(true)
  }

  // Close on outside mousedown
  useEffect(() => {
    if (!isOpen) return
    function handle(e: MouseEvent) {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) return
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [isOpen])

  // Close on scroll
  useEffect(() => {
    if (!isOpen) return
    function handle() { setIsOpen(false) }
    window.addEventListener("scroll", handle, { passive: true, capture: true })
    return () => window.removeEventListener("scroll", handle, { capture: true })
  }, [isOpen])

  const panelStyle: React.CSSProperties = {
    ...popupStyle,
    background: "var(--lc-bg-surface)",
    border: "1px solid var(--lc-border)",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: isDark ? "0 16px 48px rgba(0,0,0,0.55)" : "0 8px 32px rgba(0,0,0,0.10)",
  }

  const sectionDividerStyle: React.CSSProperties = {
    color: "var(--lc-text-muted)",
    letterSpacing: "0.12em",
    borderTop: "1px solid var(--lc-border)",
    marginTop: "2px",
    paddingTop: "8px",
    paddingBottom: "4px",
    paddingLeft: "16px",
    paddingRight: "16px",
    fontSize: "10px",
    fontWeight: 600,
    textTransform: "uppercase",
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => isOpen ? setIsOpen(false) : openDropdown()}
        disabled={isLoading}
        className="flex items-center gap-2 h-9 px-3 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 whitespace-nowrap"
        style={isActive
          ? { background: "rgba(201,168,124,0.15)", border: "1px solid rgba(201,168,124,0.30)", color: "#c9a87c" }
          : { background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-secondary)" }
        }
      >
        <span className="max-w-[120px] truncate">{selectedLabel}</span>
        <ChevronDown
          className="w-3.5 h-3.5 shrink-0 transition-transform duration-150"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {isOpen && createPortal(
        <div style={panelStyle}>
          {/* All Accounts */}
          <div className="pt-1 pb-1">
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(null); setIsOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
              style={{ color: "var(--lc-text-secondary)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <span className="font-medium">All Accounts</span>
              {!value && <Check className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />}
            </button>
          </div>

          {/* Customers */}
          {customers.length > 0 && (
            <>
              <div style={sectionDividerStyle}>Customers</div>
              <div className="pb-1">
                {customers.map((a) => (
                  <button
                    key={a.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(a.id); setIsOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
                    style={{ color: value === a.id ? "#c9a87c" : "var(--lc-text-secondary)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <span className="truncate max-w-[200px]">{a.name}</span>
                    {value === a.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#c9a87c" }} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Affiliates */}
          {affiliates.length > 0 && (
            <>
              <div style={sectionDividerStyle}>Affiliates</div>
              <div className="pb-1">
                {affiliates.map((a) => (
                  <button
                    key={a.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(a.id); setIsOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between transition-colors duration-100 cursor-pointer"
                    style={{ color: value === a.id ? "#c9a87c" : "var(--lc-text-secondary)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-mid)" }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
                  >
                    <span className="truncate max-w-[200px]">{a.name}</span>
                    {value === a.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#c9a87c" }} />}
                  </button>
                ))}
              </div>
            </>
          )}

          {customers.length === 0 && affiliates.length === 0 && (
            <div className="px-4 py-4 text-[13px] text-center" style={{ color: "var(--lc-text-muted)" }}>
              No accounts available
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
