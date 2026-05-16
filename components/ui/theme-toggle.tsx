"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

export function ThemeToggle() {
  const { isDark, toggleTheme, theme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        position: "relative",
        width: 60,
        height: 30,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        transition: "background 300ms ease, box-shadow 300ms ease",
        background: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(201,168,124,0.15)",
        boxShadow: isDark
          ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 4px rgba(0,0,0,0.30)"
          : "inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 4px rgba(201,168,124,0.20)",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark
          ? "rgba(255,255,255,0.13)"
          : "rgba(201,168,124,0.25)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.background = isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(201,168,124,0.15)"
      }}
    >
      {/* Sliding indicator dot */}
      <motion.div
        layout
        animate={{ x: isDark ? -12 : 12 }}
        transition={{ type: "spring", stiffness: 500, damping: 36 }}
        style={{
          position: "absolute",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: isDark ? "rgba(255,255,255,0.12)" : "#c9a87c",
          boxShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.40)"
            : "0 1px 6px rgba(201,168,124,0.50)",
        }}
      />

      {/* Icon swap with AnimatePresence */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: 90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: -90, scale: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {isDark ? (
            <Moon
              style={{
                width: 13,
                height: 13,
                color: "rgba(200,212,228,0.80)",
                strokeWidth: 2,
              }}
            />
          ) : (
            <Sun
              style={{
                width: 13,
                height: 13,
                color: "#c9a87c",
                strokeWidth: 2,
              }}
            />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
