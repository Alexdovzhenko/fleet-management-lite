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
  // Always start with "dark" so server HTML and first client render match exactly.
  // The anti-flicker script in <head> already applied the correct data-theme attribute
  // before React hydrates, so CSS variables are visually correct from the first paint.
  const [theme, setTheme] = useState<Theme>("dark")

  // After hydration, sync React state to the actual saved preference.
  // This runs after paint so there is no layout shift; CSS vars already correct.
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || "dark"
    if (saved !== "dark") {
      setTheme(saved)
    }
    // Ensure attribute is in sync (defensive — anti-flicker script should have set it)
    document.documentElement.setAttribute("data-theme", saved)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark"

      document.documentElement.classList.add(TRANSITION_CLASS)

      requestAnimationFrame(() => {
        document.documentElement.setAttribute("data-theme", next)
        localStorage.setItem(STORAGE_KEY, next)
      })

      setTimeout(() => {
        document.documentElement.classList.remove(TRANSITION_CLASS)
      }, TRANSITION_DURATION)

      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
