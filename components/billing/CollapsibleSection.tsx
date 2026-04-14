"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { ChevronDown } from "lucide-react"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  )
  const [shouldRender, setShouldRender] = useState(defaultOpen)

  // Measure content height when opening
  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
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
    if (!isOpen) {
      // Opening: render content and measure
      setShouldRender(true)
      // Measurement happens in useEffect after render
    } else {
      // Closing: collapse first, then remove from DOM after animation
      setContentHeight(0)
      // Use timeout to match animation duration before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 500)
      return () => clearTimeout(timer)
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="border-t border-slate-200">
      {/* Header */}
      <button
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-controls={`section-${title}`}
        className="w-full px-0 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150 group"
      >
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-l-4 border-blue-500 pl-3 group-hover:text-slate-900 transition-colors duration-150">
          {title}
        </h3>
        <ChevronDown
          className="w-5 h-5 text-slate-600 flex-shrink-0"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 500ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          strokeWidth={2}
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
        {shouldRender && (
          <div
            ref={contentRef}
            className="space-y-4 lg:space-y-5 pb-4"
            style={{
              // Stagger children opacity/transform
              animation: isOpen ? `expandContent 500ms cubic-bezier(0.23, 1, 0.32, 1)` : `collapseContent 500ms cubic-bezier(0.23, 1, 0.32, 1)`,
            }}
          >
            {children}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes expandContent {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes collapseContent {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
