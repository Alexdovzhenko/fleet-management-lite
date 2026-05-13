"use client"

import { useState, useRef, useEffect } from "react"

interface InvoiceTabsProps {
  activeTab: "OPEN" | "SETTLED"
  onTabChange: (tab: "OPEN" | "SETTLED") => void
  openCount: number
  settledCount: number
}

const TABS: { id: "OPEN" | "SETTLED"; label: string }[] = [
  { id: "OPEN",    label: "Open"    },
  { id: "SETTLED", label: "Settled" },
]

export function InvoiceTabs({ activeTab, onTabChange, openCount, settledCount }: InvoiceTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false })

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab)
    const el = tabRefs.current[idx]
    if (el) setIndicator({ x: el.offsetLeft, width: el.offsetWidth, ready: true })
  }, [activeTab])

  const counts: Record<"OPEN" | "SETTLED", number> = { OPEN: openCount, SETTLED: settledCount }

  return (
    <div className="relative flex items-center">
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[i] = el }}
          onClick={() => onTabChange(tab.id)}
          className="flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors duration-150 select-none cursor-pointer whitespace-nowrap"
          style={activeTab === tab.id ? { color: "rgba(255,255,255,0.92)" } : { color: "rgba(200,212,228,0.50)" }}
        >
          {tab.label}
          {counts[tab.id] > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold leading-none tabular-nums"
              style={activeTab === tab.id
                ? tab.id === "OPEN"
                  ? { background: "rgba(251,191,36,0.15)", color: "rgba(251,191,36,0.90)" }
                  : { background: "rgba(52,211,153,0.12)", color: "rgba(52,211,153,0.90)" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(200,212,228,0.50)" }
              }
            >
              {counts[tab.id]}
            </span>
          )}
        </button>
      ))}
      {indicator.ready && (
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-full pointer-events-none"
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.x}px)`,
            background: "#c9a87c",
            transition: "transform 0.28s cubic-bezier(0.23,1,0.32,1), width 0.28s cubic-bezier(0.23,1,0.32,1)",
            willChange: "transform",
          }}
        />
      )}
    </div>
  )
}
