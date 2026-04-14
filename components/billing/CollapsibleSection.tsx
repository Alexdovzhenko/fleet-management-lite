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
    accentColor: "#3B82F6",
    accentClass: "from-blue-500 to-blue-600",
    borderClass: "border-blue-500",
    hoverGlow: "hover:shadow-lg hover:shadow-blue-500/30",
    icon: DollarSign,
    bgGradient: "from-slate-900 via-slate-900 to-slate-800",
  },
  additional: {
    accentColor: "#8B5CF6",
    accentClass: "from-violet-500 to-violet-600",
    borderClass: "border-violet-500",
    hoverGlow: "hover:shadow-lg hover:shadow-violet-500/30",
    icon: Plus,
    bgGradient: "from-slate-900 via-slate-900 to-slate-800",
  },
  farmout: {
    accentColor: "#10B981",
    accentClass: "from-emerald-500 to-emerald-600",
    borderClass: "border-emerald-500",
    hoverGlow: "hover:shadow-lg hover:shadow-emerald-500/30",
    icon: TrendingUp,
    bgGradient: "from-slate-900 via-slate-900 to-slate-800",
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
      className={`rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${config.hoverGlow}`}
      style={{
        border: `1px solid ${config.accentColor}20`,
      }}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${title}`}
        className={`w-full px-6 py-5 flex items-center justify-between gap-4 bg-gradient-to-r ${config.bgGradient} transition-all duration-300 group`}
      >
        <div className="flex items-center gap-4 flex-1">
          {/* Accent bar + icon */}
          <div
            className={`w-1 h-8 rounded-full transition-all duration-300 ${config.hoverGlow} group-hover:h-10`}
            style={{
              background: `linear-gradient(180deg, ${config.accentColor}, ${config.accentColor}aa)`,
              boxShadow: `0 0 12px ${config.accentColor}40`,
            }}
          />

          {/* Icon + Label */}
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg transition-all duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${config.accentColor}20, ${config.accentColor}10)`,
              }}
            >
              <IconComponent
                className="w-5 h-5 flex-shrink-0"
                style={{ color: config.accentColor }}
                strokeWidth={2.5}
              />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest group-hover:text-opacity-100 transition-colors duration-300">
              {title}
            </h3>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown
          className="w-5 h-5 flex-shrink-0 transition-transform duration-500 ease-out"
          style={{
            color: config.accentColor,
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          strokeWidth={2.5}
        />
      </button>

      {/* Content Wrapper */}
      <div
        id={`section-${title}`}
        role="region"
        style={{
          maxHeight: contentHeight ?? 0,
          overflow: "hidden",
          transition: `max-height 500ms cubic-bezier(0.23, 1, 0.32, 1)`,
        }}
      >
        {/* Inner Content */}
        <div
          ref={contentRef}
          className="space-y-4 lg:space-y-5 px-6 py-5"
          style={{
            background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.5), rgba(15, 23, 42, 0.3))",
            borderTop: `1px solid ${config.accentColor}20`,
            opacity: isOpen ? 1 : 0,
            transition: `opacity 500ms cubic-bezier(0.23, 1, 0.32, 1)`,
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes accentPulse {
          0%, 100% {
            box-shadow: 0 0 12px ${config.accentColor}40;
          }
          50% {
            box-shadow: 0 0 20px ${config.accentColor}60;
          }
        }

        button:hover .accent-bar {
          animation: accentPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
