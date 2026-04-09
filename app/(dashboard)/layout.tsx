"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toaster } from "sonner"
import { DockNav } from "@/components/layout/dock-nav"
import { AuthProvider, useAuth } from "@/components/providers/auth-provider"

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { company, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && company && !company.onboardingCompleted) {
      router.replace("/onboarding")
    }
  }, [isLoading, company, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-4 md:px-6 pt-4 md:pt-6" style={{ paddingBottom: "max(121px, calc(121px + env(safe-area-inset-bottom)))" }}>{children}</main>
      <DockNav />
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  )
}
