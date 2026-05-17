"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  isDark: true,
})

const STORAGE_KEY = "livery-connect-theme"
const TRANSITION_CLASS = "theme-transitioning"
const TRANSITION_DURATION = 600

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from localStorage on client (SSR falls back to "dark")
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark"
    return (localStorage.getItem(STORAGE_KEY) as Theme) || "dark"
  })

  // Ensure the HTML attribute stays in sync on first mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark"

      // 1. Add transition class so all elements animate smoothly
      document.documentElement.classList.add(TRANSITION_CLASS)

      // 2. Flip the attribute after a short delay so the animation fires first
      requestAnimationFrame(() => {
        document.documentElement.setAttribute("data-theme", next)
        localStorage.setItem(STORAGE_KEY, next)
      })

      // 3. Remove transition class after animation completes
      setTimeout(() => {
        document.documentElement.classList.remove(TRANSITION_CLASS)
      }, TRANSITION_DURATION)

      return next
    })
  }, [])

  // The anti-flicker script in <head> already set data-theme on <html> before
  // React hydrates, so CSS variables are correct from the very first paint.
  // Render children immediately (with default dark context) so the header and
  // layout never disappear — the useEffect above syncs the React state shortly after.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
