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
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  // On mount: read persisted preference (anti-flicker script already set the attribute)
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "dark"
    setTheme(saved)
    document.documentElement.setAttribute("data-theme", saved)
    setMounted(true)
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

  // Return null before mount — keeps the whole tree client-only so server-rendered
  // components that access browser APIs don't throw during SSR.
  // The anti-flicker script in <head> already set data-theme on <html> before
  // React hydrates, so the CSS variables are correct from the very first paint.
  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
