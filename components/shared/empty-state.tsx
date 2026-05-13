"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { type LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

const ease = [0.23, 1, 0.32, 1] as const

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
      card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
    }
    card.addEventListener("mousemove", onMove)
    return () => card.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <div className="flex items-center justify-center py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-sm"
      >
        <div
          ref={cardRef}
          className="empty-state-card relative rounded-2xl p-8 text-center"
          style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {/* Floating icon with radial glow */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease }}
            className="mb-6 flex justify-center"
          >
            <div className="relative">
              <div
                className="empty-state-glow absolute inset-0 rounded-full blur-2xl"
                style={{ background: "#c9a87c" }}
              />
              <div
                className="empty-state-float relative flex h-20 w-20 items-center justify-center rounded-full"
                style={{ background: "#0d1526", border: "2px solid rgba(201,168,124,0.30)" }}
              >
                <Icon className="h-9 w-9" style={{ color: "#c9a87c" }} />
              </div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25, ease }}
            className="text-lg font-semibold mb-2"
            style={{ color: "rgba(255,255,255,0.90)" }}
          >
            {title}
          </motion.h3>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32, ease }}
            className="text-sm leading-relaxed max-w-xs mx-auto"
            style={{ color: "rgba(200,212,228,0.55)" }}
          >
            {description}
          </motion.p>

          {/* CTA */}
          {actionLabel && onAction && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.40, ease }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAction}
              className="mt-7 inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-semibold transition-colors"
              style={{
                background: "#c9a87c",
                color: "#0d1526",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#d4b688" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
            >
              {actionLabel}
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
