"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { ChevronDown, DollarSign, Plus, TrendingUp } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  type?: "primary" | "additional" | "farmout"
}

const sectionConfig = {
  primary: {
    accentColor: "#c9a87c",
    iconColor: "#c9a87c",
    iconBg: "rgba(201,168,124,0.12)",
    iconBorder: "rgba(201,168,124,0.20)",
    icon: DollarSign,
  },
  additional: {
    accentColor: "rgba(99,102,241,0.85)",
    iconColor: "rgba(165,180,252,0.85)",
    iconBg: "rgba(99,102,241,0.12)",
    iconBorder: "rgba(99,102,241,0.22)",
    icon: Plus,
  },
  farmout: {
    accentColor: "rgba(20,184,166,0.85)",
    iconColor: "rgba(94,234,212,0.85)",
    iconBg: "rgba(20,184,166,0.10)",
    iconBorder: "rgba(20,184,166,0.22)",
    icon: TrendingUp,
  },
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  type = "primary",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(defaultOpen ? undefined : 0)

  const config = sectionConfig[type]
  const IconComponent = config.icon

  useEffect(() => {
    if (isOpen && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) setContentHeight(contentRef.current.scrollHeight)
      })
    } else {
      setContentHeight(0)
    }
  }, [isOpen])

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 1px 12px rgba(0,0,0,0.25)" }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={`section-${title}`}
        className="w-full px-5 py-4 flex items-center justify-between gap-4 transition-colors"
        style={{ background: isOpen ? "rgba(255,255,255,0.03)" : "#0d1526" }}
        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)" }}
        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "#0d1526" }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: config.accentColor }} />
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: config.iconBg, border: `1px solid ${config.iconBorder}` }}
          >
            <IconComponent className="w-3.5 h-3.5" style={{ color: config.iconColor }} strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>{title}</h3>
        </div>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
          style={{ color: "rgba(200,212,228,0.45)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          strokeWidth={2}
        />
      </button>

      {/* Content */}
      <div
        id={`section-${title}`}
        role="region"
        style={{ maxHeight: contentHeight ?? 0, overflow: "hidden", transition: "max-height 250ms ease-out" }}
      >
        <div
          ref={contentRef}
          className="space-y-1 px-5 py-4"
          style={{
            background: "rgba(255,255,255,0.015)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 250ms ease-out",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
