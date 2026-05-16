"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/theme-context"

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={!isDark}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      whileTap={{ scale: 0.90 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
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
        background: isDark
          ? "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)",
        boxShadow: isDark
          ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 12px rgba(0,0,0,0.50), 0 0 0 1px rgba(99,102,241,0.40)"
          : "inset 0 1px 0 rgba(255,255,255,0.60), 0 2px 12px rgba(245,158,11,0.35), 0 0 0 1px rgba(217,119,6,0.30)",
        transition: "box-shadow 400ms ease",
      }}
    >
      {/* Track atmosphere */}
      <AnimatePresence mode="popLayout" initial={false}>
        {isDark ? (
          /* Twinkling stars in the right (inactive) side */
          <motion.div
            key="stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {[
              { top: "25%", right: "16%", size: 2,   delay: 0.00 },
              { top: "65%", right: "24%", size: 1.5, delay: 0.10 },
              { top: "42%", right: "35%", size: 1.5, delay: 0.20 },
            ].map((s, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{
                  delay: s.delay,
                  duration: 1.8 + i * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  top: s.top,
                  right: s.right,
                  width: s.size,
                  height: s.size,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 0 3px rgba(255,255,255,0.80)",
                }}
              />
            ))}
          </motion.div>
        ) : (
          /* Warm sun haze on the left (inactive) side */
          <motion.div
            key="haze"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute",
              left: 6,
              top: "50%",
              transform: "translateY(-50%)",
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "rgba(251,191,36,0.50)",
              filter: "blur(6px)",
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* Sliding thumb */}
      <motion.div
        animate={{ x: isDark ? -15 : 15 }}
        transition={{ type: "spring", stiffness: 550, damping: 30 }}
        style={{
          position: "relative",
          zIndex: 2,
          width: 22,
          height: 22,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark
            ? "linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 100%)"
            : "linear-gradient(145deg, #ffffff 0%, #fef9c3 100%)",
          boxShadow: isDark
            ? "0 1px 8px rgba(0,0,0,0.55), 0 0 16px rgba(129,140,248,0.65), inset 0 1px 0 rgba(255,255,255,0.30)"
            : "0 1px 8px rgba(0,0,0,0.18), 0 0 16px rgba(251,191,36,0.65), inset 0 1px 0 rgba(255,255,255,0.90)",
          transition: "background 400ms ease, box-shadow 400ms ease",
        }}
      >
        {/* Ambient glow ring */}
        <motion.div
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.20, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: -5,
            borderRadius: "50%",
            background: isDark
              ? "rgba(129,140,248,0.40)"
              : "rgba(251,191,36,0.40)",
            filter: "blur(4px)",
            pointerEvents: "none",
          }}
        />

        {/* Icon swap */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={isDark ? "moon" : "sun"}
            initial={{ rotate: 180, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -180, scale: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: "relative", zIndex: 1, display: "flex" }}
          >
            {isDark
              ? <Moon style={{ width: 11, height: 11, color: "#818cf8", strokeWidth: 2.5 }} />
              : <Sun  style={{ width: 12, height: 12, color: "#d97706", strokeWidth: 2.5 }} />
            }
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </motion.button>
  )
}
