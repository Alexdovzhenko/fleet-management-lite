"use client"

import { useState, useEffect, useRef } from "react"
import { useBillingSettings, useUpdateBillingSettings, useUploadBillingLogo } from "@/lib/hooks/use-billing"
import { InvoicePreview } from "./InvoicePreview"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, X, Check, Eye } from "lucide-react"
import type { BillingData } from "@/lib/billing-calculations"

export function BillingSettingsForm() {
  const { data: settings, isLoading } = useBillingSettings()
  const updateMutation = useUpdateBillingSettings()
  const uploadLogoMutation = useUploadBillingLogo()

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    billingEmail: "",
    dateFormat: "MM/DD/YYYY",
    invoicePrefix: "INV-",
    paymentTerms: "Due upon receipt",
    footerNote: "",
  })

  const [citySuggestions, setCitySuggestions] = useState<Array<{ city: string; state: string }>>([])
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [citySearchQuery, setCitySearchQuery] = useState("")
  const citySuggestionsRef = useRef<HTMLDivElement>(null)

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [dragActive, setDragActive] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Helper to parse address string into components
  const parseAddress = (addressStr: string) => {
    // Expected format: "123 Main Street, City, ST 12345"
    const parts = addressStr.split(",").map(p => p.trim())
    return {
      streetAddress: parts[0] || "",
      city: parts[1] || "",
      state: parts[2]?.split(" ")[0] || "",
      zipCode: parts[2]?.split(" ")[1] || "",
    }
  }

  // Initialize form from loaded settings
  useEffect(() => {
    if (settings) {
      const addressParts = parseAddress(settings.address || "")
      setFormData({
        companyName: settings.companyName || "",
        streetAddress: addressParts.streetAddress,
        city: addressParts.city,
        state: addressParts.state,
        zipCode: addressParts.zipCode,
        phone: settings.phone || "",
        billingEmail: settings.billingEmail || "",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        invoicePrefix: settings.invoicePrefix || "INV-",
        paymentTerms: settings.paymentTerms || "Due upon receipt",
        footerNote: settings.footerNote || "",
      })
      setLogoUrl(settings.logoUrl)
    }
  }, [settings])

  // Warn if user tries to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      }
      // Debounce save with updated data
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      setHasUnsavedChanges(true)
      setSaveError(null)
      debounceTimerRef.current = setTimeout(() => {
        // Combine address fields back into a single string
        const addressParts = [
          updated.streetAddress,
          updated.city,
          updated.state && updated.zipCode ? `${updated.state} ${updated.zipCode}` : updated.state,
        ].filter(Boolean)
        const combinedAddress = addressParts.join(", ")

        updateMutation.mutate(
          {
            companyName: updated.companyName,
            address: combinedAddress,
            phone: updated.phone,
            billingEmail: updated.billingEmail,
            dateFormat: updated.dateFormat,
            invoicePrefix: updated.invoicePrefix,
            paymentTerms: updated.paymentTerms,
            footerNote: updated.footerNote,
            logoUrl: logoUrl || undefined,
          },
          {
            onSuccess: () => {
              setHasUnsavedChanges(false)
              setIsSaved(true)
              setSaveError(null)
              const timer = setTimeout(() => setIsSaved(false), 2000)
              return () => clearTimeout(timer)
            },
            onError: (error) => {
              setHasUnsavedChanges(true)
              setSaveError(
                error instanceof Error ? error.message : "Failed to save billing settings"
              )
            },
          }
        )
      }, 800)
      return updated
    })
  }

  // Logo upload handlers
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File must be smaller than 2MB")
      return
    }

    setIsUploading(true)
    uploadLogoMutation.mutate(file, {
      onSuccess: (response) => {
        setLogoUrl(response.logoUrl)
        setIsUploading(false)
        // Save immediately after logo upload succeeds
        setHasUnsavedChanges(true)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        debounceTimerRef.current = setTimeout(() => {
          // Combine address fields
          const addressParts = [
            formData.streetAddress,
            formData.city,
            formData.state && formData.zipCode ? `${formData.state} ${formData.zipCode}` : formData.state,
          ].filter(Boolean)
          const combinedAddress = addressParts.join(", ")

          updateMutation.mutate(
            {
              companyName: formData.companyName,
              address: combinedAddress,
              phone: formData.phone,
              billingEmail: formData.billingEmail,
              dateFormat: formData.dateFormat,
              invoicePrefix: formData.invoicePrefix,
              paymentTerms: formData.paymentTerms,
              footerNote: formData.footerNote,
              logoUrl: response.logoUrl || undefined,
            },
            {
              onSuccess: () => {
                setHasUnsavedChanges(false)
                setIsSaved(true)
                setSaveError(null)
                const timer = setTimeout(() => setIsSaved(false), 2000)
                return () => clearTimeout(timer)
              },
              onError: (error) => {
                setHasUnsavedChanges(true)
                setSaveError(
                  error instanceof Error ? error.message : "Failed to save billing settings"
                )
              },
            }
          )
        }, 800)
      },
      onError: (error) => {
        setIsUploading(false)
        const errorMsg = error instanceof Error ? error.message : "Failed to upload logo"
        setSaveError(errorMsg)
        alert(errorMsg)
      },
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleLogoUpload(files[0])
    }
  }

  const handleDragActive = (e: React.DragEvent, active: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(active)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files[0]) {
      handleLogoUpload(files[0])
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl(undefined)
    // Save after logo removal
    setHasUnsavedChanges(true)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateMutation.mutate(
        { ...formData, logoUrl: undefined },
        {
          onSuccess: () => {
            setHasUnsavedChanges(false)
            setIsSaved(true)
            setSaveError(null)
            const timer = setTimeout(() => setIsSaved(false), 2000)
            return () => clearTimeout(timer)
          },
          onError: (error) => {
            setHasUnsavedChanges(true)
            setSaveError(
              error instanceof Error ? error.message : "Failed to save billing settings"
            )
          },
        }
      )
    }, 800)
  }

  // US cities for autocomplete
  const US_CITIES = [
    { city: "New York", state: "NY" },
    { city: "Los Angeles", state: "CA" },
    { city: "Chicago", state: "IL" },
    { city: "Houston", state: "TX" },
    { city: "Phoenix", state: "AZ" },
    { city: "Philadelphia", state: "PA" },
    { city: "San Antonio", state: "TX" },
    { city: "San Diego", state: "CA" },
    { city: "Dallas", state: "TX" },
    { city: "San Jose", state: "CA" },
    { city: "Austin", state: "TX" },
    { city: "Jacksonville", state: "FL" },
    { city: "Fort Worth", state: "TX" },
    { city: "Columbus", state: "OH" },
    { city: "Charlotte", state: "NC" },
    { city: "San Francisco", state: "CA" },
    { city: "Indianapolis", state: "IN" },
    { city: "Seattle", state: "WA" },
    { city: "Denver", state: "CO" },
    { city: "Washington", state: "DC" },
    { city: "Boston", state: "MA" },
    { city: "El Paso", state: "TX" },
    { city: "Nashville", state: "TN" },
    { city: "Detroit", state: "MI" },
    { city: "Oklahoma City", state: "OK" },
    { city: "Portland", state: "OR" },
    { city: "Las Vegas", state: "NV" },
    { city: "Memphis", state: "TN" },
    { city: "Louisville", state: "KY" },
    { city: "Baltimore", state: "MD" },
    { city: "Milwaukee", state: "WI" },
    { city: "Albuquerque", state: "NM" },
    { city: "Tucson", state: "AZ" },
    { city: "Fresno", state: "CA" },
    { city: "Sacramento", state: "CA" },
    { city: "Long Beach", state: "CA" },
    { city: "Kansas City", state: "MO" },
    { city: "Mesa", state: "AZ" },
    { city: "Virginia Beach", state: "VA" },
    { city: "Atlanta", state: "GA" },
    { city: "Miami", state: "FL" },
    { city: "Aventura", state: "FL" },
  ]

  // Handle city search and autocomplete
  const handleCitySearch = (value: string) => {
    setCitySearchQuery(value)
    handleInputChange("city", value)

    if (value.length > 0) {
      const filtered = US_CITIES.filter((item) =>
        item.city.toLowerCase().startsWith(value.toLowerCase())
      ).slice(0, 8)
      setCitySuggestions(filtered)
      setShowCitySuggestions(true)
    } else {
      setCitySuggestions([])
      setShowCitySuggestions(false)
    }
  }

  // Handle city selection from suggestions
  const handleSelectCity = (city: string, state: string) => {
    handleInputChange("city", city)
    handleInputChange("state", state)
    setCitySearchQuery("")
    setCitySuggestions([])
    setShowCitySuggestions(false)
  }

  // Sample invoice data for preview
  const sampleInvoiceData: Partial<BillingData> = {
    flatRate: 100,
    perHourQty: 2,
    perHourRate: 75,
    airportFee: 25,
    discountPct: 0,
    gratuityPct: 20,
    creditCardFeePct: 3,
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-sm" style={{ color: "rgba(200,212,228,0.45)" }}>Loading billing settings...</div>
      </div>
    )
  }

  return (
    <>
    <div className="w-full min-h-full" style={{ background: "#080c16" }}>
      {/* Form */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8 lg:px-6">
        {/* Status Indicators */}
        {saveError && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(248,113,113,0.15)" }}>
              <span className="text-red-600 font-bold text-sm">!</span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "rgba(248,113,113,0.90)" }}>{saveError}</p>
            </div>
          </div>
        )}

        {isSaved && !saveError && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.25)" }}>
            <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "rgba(52,211,153,0.90)" }} />
            <p className="text-sm font-medium" style={{ color: "rgba(52,211,153,0.90)" }}>All changes saved</p>
          </div>
        )}

        {hasUnsavedChanges && !isSaved && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(251,191,36,0.10)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2.5" style={{ background: "rgba(251,191,36,0.90)" }}></div>
            <p className="text-sm" style={{ color: "rgba(251,191,36,0.80)" }}>You have unsaved changes</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Company Branding Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Company Information</h3>
              <span className="text-xs" style={{ color: "rgba(200,212,228,0.40)" }}>Your public details</span>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Logo Upload */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label className="block text-sm font-medium text-slate-900 mb-3">Logo</label>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}>
                      <img
                        src={logoUrl}
                        alt="Company logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isUploading}
                      className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-sm disabled:opacity-50 transition-colors" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.12)" }}
                    >
                      <X className="w-4 h-4" style={{ color: "rgba(200,212,228,0.60)" }} />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => handleDragActive(e, true)}
                    onDragLeave={(e) => handleDragActive(e, false)}
                    className="relative w-full py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer"
                    style={dragActive
                      ? { borderColor: "#c9a87c", background: "rgba(201,168,124,0.08)" }
                      : { borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.03)" }
                    }
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="text-center pointer-events-none">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <Upload className="w-5 h-5" style={{ color: "rgba(200,212,228,0.60)" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>
                        {isUploading ? "Uploading..." : "Drop your logo here"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "rgba(200,212,228,0.40)" }}>PNG, JPG, WebP, SVG • Max 2MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="companyName" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Company Name
                </label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  onFocus={() => setFocusedField("companyName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Acme Inc."
                  className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />
              </div>

              {/* Street Address */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="streetAddress" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Street Address
                </label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                  onFocus={() => setFocusedField("streetAddress")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="123 Main Street"
                  className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />
              </div>

              {/* City with Autocomplete */}
              <div className="p-6 relative" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="city" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  City
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleCitySearch(e.target.value)}
                  onFocus={() => setShowCitySuggestions(formData.city.length > 0)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                  placeholder="Aventura"
                  className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />

                {/* City Suggestions Dropdown */}
                {showCitySuggestions && citySuggestions.length > 0 && (
                  <div
                    ref={citySuggestionsRef}
                    className="absolute top-full left-6 right-6 mt-1 rounded-lg shadow-md z-10 max-h-48 overflow-y-auto" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    {citySuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCity(item.city, item.state)}
                        className="w-full text-left px-4 py-2.5 border-b last:border-b-0 text-sm transition-colors" style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.80)" }}
                      >
                        <div className="font-medium" style={{ color: "rgba(255,255,255,0.90)" }}>{item.city}</div>
                        <div className="text-xs" style={{ color: "rgba(200,212,228,0.40)" }}>{item.state}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* State & Zip Code */}
              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="state" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                    State
                  </label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value.toUpperCase())}
                    onFocus={() => setFocusedField("state")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="FL"
                    maxLength={2}
                    className="h-11 px-4 rounded-lg text-sm transition-all uppercase" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                  />
                </div>
                <div>
                  <label htmlFor="zipCode" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                    Zip Code
                  </label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    onFocus={() => setFocusedField("zipCode")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="33180"
                    maxLength={5}
                    className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Contact Details</h3>
              <span className="text-xs" style={{ color: "rgba(200,212,228,0.40)" }}>For invoices</span>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Phone */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="phone" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Phone
                </label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="(555) 123-4567"
                  className="h-11 px-4 w-full rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />
              </div>

              {/* Billing Email */}
              <div className="p-6">
                <label htmlFor="billingEmail" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Billing Email
                </label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => handleInputChange("billingEmail", e.target.value)}
                  onFocus={() => setFocusedField("billingEmail")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="billing@company.com"
                  className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Invoice Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Invoice Formatting</h3>
              <span className="text-xs" style={{ color: "rgba(200,212,228,0.40)" }}>Appearance and numbering</span>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Invoice Prefix */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="invoicePrefix" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Invoice Prefix
                </label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                  onFocus={() => setFocusedField("invoicePrefix")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="INV-"
                  className="h-11 px-4 rounded-lg text-sm transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
                />
                <p className="text-xs mt-3" style={{ color: "rgba(200,212,228,0.38)" }}>
                  Numbers will look like: <span className="font-mono font-medium" style={{ color: "rgba(201,168,124,0.90)" }}>{formData.invoicePrefix}001</span>, <span className="font-mono font-medium" style={{ color: "rgba(201,168,124,0.90)" }}>{formData.invoicePrefix}002</span>
                </p>
              </div>

              {/* Date Format */}
              <div className="p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <label htmlFor="dateFormat" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={formData.dateFormat}
                  onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                  className="w-full h-11 px-4 rounded-lg text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.88)", outline: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23c9a87c' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px',
                  }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="Month DD, YYYY">Month DD, YYYY</option>
                </select>
              </div>

              {/* Payment Terms */}
              <div className="p-6">
                <label htmlFor="paymentTerms" className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(200,212,228,0.45)" }}>
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  className="w-full h-11 px-4 rounded-lg text-sm transition-all appearance-none cursor-pointer"
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.88)", outline: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23c9a87c' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px',
                  }}
                >
                  <option value="Due upon receipt">Due upon receipt</option>
                  <option value="Net 7">Net 7 days</option>
                  <option value="Net 15">Net 15 days</option>
                  <option value="Net 30">Net 30 days</option>
                  <option value="Net 60">Net 60 days</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Note Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.88)" }}>Invoice Notes</h3>
              <span className="text-xs" style={{ color: "rgba(200,212,228,0.40)" }}>Optional</span>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "#0d1526", border: "1px solid rgba(255,255,255,0.08)" }}>
              <label htmlFor="footerNote" className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "rgba(200,212,228,0.45)" }}>
                Footer Message
              </label>
              <textarea
                id="footerNote"
                value={formData.footerNote}
                onChange={(e) => handleInputChange("footerNote", e.target.value)}
                onFocus={() => setFocusedField("footerNote")}
                onBlur={() => setFocusedField(null)}
                placeholder="Thank you for your business!"
                rows={3}
                className="w-full px-4 py-3 rounded-lg text-sm transition-all resize-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.88)", outline: "none" }}
              />
              <p className="text-xs mt-3" style={{ color: "rgba(200,212,228,0.38)" }}>
                This message appears at the bottom of all invoices
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium active:scale-[0.98] transition-all duration-150" style={{ border: "1px solid rgba(201,168,124,0.35)", background: "rgba(201,168,124,0.08)", color: "#c9a87c" }}
            >
              <Eye className="w-4 h-4" style={{ color: "#c9a87c" }} />
              Preview Invoice
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Preview Modal */}
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh] p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        <DialogHeader className="relative px-8 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <DialogTitle className="text-xl" style={{ color: "rgba(255,255,255,0.90)" }}>Invoice Preview</DialogTitle>
          <button
            onClick={() => setIsPreviewOpen(false)}
            aria-label="Close invoice preview"
            className="absolute right-6 top-6 flex items-center justify-center w-10 h-10 rounded-lg active:scale-95 transition-all duration-150" style={{ color: "rgba(200,212,228,0.50)" }}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </DialogHeader>

        {/* Invoice Preview Content */}
        <div className="flex-1 overflow-hidden">
          <InvoicePreview
            billingData={sampleInvoiceData}
            trip={{
              tripNumber: "LC-2024-001",
              passengerName: "John Smith",
              passengerEmail: "john@example.com",
              passengerPhone: "(555) 123-4567",
            }}
            company={{
              name: formData.companyName || "Your Company",
              address: [
                formData.streetAddress,
                formData.city,
                formData.state && formData.zipCode ? `${formData.state} ${formData.zipCode}` : formData.state,
              ]
                .filter(Boolean)
                .join(", "),
              phone: formData.phone,
              email: formData.billingEmail,
              logoUrl,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
