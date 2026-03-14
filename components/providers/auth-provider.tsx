"use client"

import { createContext, useContext, useEffect, useState } from "react"

type AuthUser = {
  id: string
  name: string
  email: string
  role: string
  companyId: string
}

type AuthCompany = {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  timezone: string
  logo?: string | null
  onboardingCompleted: boolean
}

type AuthContextType = {
  user: AuthUser | null
  company: AuthCompany | null
  companyId: string
  isLoading: boolean
  refresh: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  company: null,
  companyId: "",
  isLoading: true,
  refresh: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [company, setCompany] = useState<AuthCompany | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user)
        if (data?.company) setCompany(data.company)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [tick])

  function refresh() {
    setTick((t) => t + 1)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        companyId: user?.companyId ?? "",
        isLoading,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
