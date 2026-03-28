"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invite, setInvite] = useState<{ companyName: string; email: string; role: string } | null>(null)
  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) { setError("Invalid invite link"); setLoading(false); return }
    fetch(`/api/auth/invite?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return }
        setInvite(data)
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to accept invite"); return }
      router.push("/auth/login?invited=true")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-sm text-gray-500">Loading invite…</div>

  if (error && !invite) return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <p className="text-xs text-gray-500">The invite link may have expired or already been used.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">You&apos;ve been invited</h2>
      <p className="text-sm text-gray-500 mb-6">
        Join <span className="font-medium text-gray-900">{invite?.companyName}</span> as a {invite?.role?.toLowerCase()}
      </p>

      {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">Your Name *</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" required className="h-10 text-sm" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-500">Email</Label>
          <Input value={invite?.email ?? ""} disabled className="h-10 text-sm bg-gray-50" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Password *</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 chars" required className="h-10 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Confirm *</Label>
            <Input type="password" value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="Repeat" required className="h-10 text-sm" />
          </div>
        </div>
        <Button type="submit" disabled={submitting} className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
          {submitting ? "Joining…" : "Join Workspace"}
        </Button>
      </form>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-sm text-gray-500">Loading…</div>}>
      <InviteContent />
    </Suspense>
  )
}
