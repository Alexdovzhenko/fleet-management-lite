"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Building2, Phone, MapPin, Globe, ChevronRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STEPS = ["Company Info", "Location", "Done"]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "",
    phone: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    timezone: "America/New_York",
  })

  // Pre-fill from existing company data created during signup
  useEffect(() => {
    fetch("/api/company")
      .then((r) => (r.ok ? r.json() : null))
      .then((company) => {
        if (company) {
          setForm({
            name:     company.name     ?? "",
            phone:    company.phone    ?? "",
            website:  company.website  ?? "",
            address:  company.address  ?? "",
            city:     company.city     ?? "",
            state:    company.state    ?? "",
            zip:      company.zip      ?? "",
            timezone: company.timezone ?? "America/New_York",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleFinish() {
    setSaving(true)
    setError("")
    try {
      // Only send fields that have actual values — never overwrite existing data with empty strings
      const updates: Record<string, unknown> = { onboardingCompleted: true }
      if (form.name.trim())    updates.name     = form.name.trim()
      if (form.phone.trim())   updates.phone    = form.phone.trim()
      if (form.website.trim()) updates.website  = form.website.trim()
      if (form.address.trim()) updates.address  = form.address.trim()
      if (form.city.trim())    updates.city     = form.city.trim()
      if (form.state.trim())   updates.state    = form.state.trim()
      if (form.zip.trim())     updates.zip      = form.zip.trim()
      updates.timezone = form.timezone

      const res = await fetch("/api/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }
      router.push("/dispatch")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-blue-600 items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your workspace</h1>
          <p className="text-sm text-gray-500 mt-1">Just a few details to get you started</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all ${
                i < step ? "bg-blue-600 text-white" :
                i === step ? "bg-blue-600 text-white ring-4 ring-blue-100" :
                "bg-gray-100 text-gray-400"
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i === step ? "text-gray-900" : "text-gray-400"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-200 ml-1" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          ) : null}

          {!loading && error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Step 0: Company Info */}
          {!loading && step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Company Information</h2>
                  <p className="text-xs text-gray-400">Tell us about your limo company</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Company Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Luxury Limousine Co."
                  className="h-10 text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Phone Number
                </Label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="(305) 555-0100"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Globe className="w-3 h-3" /> Website
                </Label>
                <Input
                  type="url"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://yourlimo.com"
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Timezone</Label>
                <select
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  className="w-full h-10 text-sm border border-gray-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="America/New_York">Eastern (ET)</option>
                  <option value="America/Chicago">Central (CT)</option>
                  <option value="America/Denver">Mountain (MT)</option>
                  <option value="America/Los_Angeles">Pacific (PT)</option>
                  <option value="America/Anchorage">Alaska (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii (HST)</option>
                </select>
              </div>

              <Button
                onClick={() => setStep(1)}
                disabled={!form.name.trim()}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium mt-2 gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Location */}
          {!loading && step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Business Address</h2>
                  <p className="text-xs text-gray-400">Optional — helps with dispatching</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Street Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="123 Main Street"
                  className="h-10 text-sm"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-[1fr_110px_80px] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Miami"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="FL"
                    className="h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">ZIP</Label>
                  <Input
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    placeholder="33101"
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 h-10 text-sm"
                >
                  Back
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium gap-2"
                >
                  {saving ? "Setting up…" : <><Check className="w-4 h-4" /> Finish Setup</>}
                </Button>
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
