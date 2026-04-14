"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { ChevronDown, DollarSign, Plus, TrendingUp } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
  type?: "primary" | "additional" | "farmout"
}

// Config: colors and icons per section type
const sectionConfig = {
  primary: {
    accentColor: "#475569",
    accentClass: "bg-slate-100 hover:bg-slate-50",
    borderClass: "border-slate-700",
    hoverGlow: "hover:bg-slate-50",
    icon: DollarSign,
    bgGradient: "bg-white",
  },
  additional: {
    accentColor: "#6366F1",
    accentClass: "bg-slate-100 hover:bg-slate-50",
    borderClass: "border-indigo-400",
    hoverGlow: "hover:bg-slate-50",
    icon: Plus,
    bgGradient: "bg-white",
  },
  farmout: {
    accentColor: "#0D9488",
    accentClass: "bg-slate-100 hover:bg-slate-50",
    borderClass: "border-teal-600",
    hoverGlow: "hover:bg-slate-50",
    icon: TrendingUp,
    bgGradient: "bg-white",
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
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  )

  const config = sectionConfig[type]
  const IconComponent = config.icon

  // Measure content height when opening
  useEffect(() => {
    if (isOpen && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          setContentHeight(contentRef.current.scrollHeight)
        }
      })
    } else {
      setContentHeight(0)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div
      className={`rounded-[10px] overflow-hidden transition-all duration-200`}
      style={{
        border: `1px solid #E5E7EB`,
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.06)`,
      }}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${title}`}
        className={`w-full px-6 py-5 flex items-center justify-between gap-4 bg-white transition-all duration-200 group ${config.hoverGlow}`}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Accent bar + icon */}
          <div
            className={`w-1 h-8 rounded transition-all duration-200`}
            style={{
              width: '3px',
              backgroundColor: config.accentColor,
            }}
          />

          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <IconComponent
              className="w-5 h-5 flex-shrink-0 text-slate-700"
              strokeWidth={1.5}
            />
            <h3 className="text-sm font-medium text-slate-900 uppercase tracking-wide">
              {title}
            </h3>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className="w-5 h-5 flex-shrink-0 text-slate-700 transition-transform duration-200"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          strokeWidth={1.5}
        />
      </button>

      {/* Content Wrapper */}
      <div
        id={`section-${title}`}
        role="region"
        style={{
          maxHeight: contentHeight ?? 0,
          overflow: "hidden",
          transition: `max-height 250ms ease-out`,
        }}
      >
        {/* Inner Content */}
        <div
          ref={contentRef}
          className="space-y-4 lg:space-y-5 px-6 py-5"
          style={{
            background: "#FFFFFF",
            borderTop: `1px solid #E5E7EB`,
            opacity: isOpen ? 1 : 0,
            transition: `opacity 250ms ease-out`,
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </div>

    </div>
  )
}
