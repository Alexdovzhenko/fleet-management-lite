"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the default settings section
    router.replace("/settings/profile")
  }, [router])

  return null
}
