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
    address: "",
    phone: "",
    billingEmail: "",
    dateFormat: "MM/DD/YYYY",
    invoicePrefix: "INV-",
    paymentTerms: "Due upon receipt",
    footerNote: "",
  })

  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)
  const [dragActive, setDragActive] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Initialize form from loaded settings
  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        address: settings.address || "",
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
        updateMutation.mutate(
          { ...updated, logoUrl: logoUrl || undefined },
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
          updateMutation.mutate(
            { ...formData, logoUrl: response.logoUrl || undefined },
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
        <div className="text-sm text-slate-500">Loading billing settings...</div>
      </div>
    )
  }

  return (
    <>
    <div className="w-full bg-white">
      {/* Form */}
      <div className="w-full max-w-3xl mx-auto px-4 py-8 lg:px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing Settings</h1>
          <p className="text-base text-slate-600 mt-2">Configure your company details and invoice preferences</p>
        </div>

        {/* Status Indicators */}
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-red-600 font-bold text-sm">!</span>
            </div>
            <div>
              <p className="text-sm font-medium text-red-900">{saveError}</p>
            </div>
          </div>
        )}

        {isSaved && !saveError && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-emerald-900">All changes saved</p>
          </div>
        )}

        {hasUnsavedChanges && !isSaved && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-2.5"></div>
            <p className="text-sm text-amber-900">You have unsaved changes</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Company Branding Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Company Information</h3>
              <span className="text-xs text-slate-500">Your public details</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Logo Upload */}
              <div className="p-6 border-b border-slate-200">
                <label className="block text-sm font-medium text-slate-900 mb-3">Logo</label>
                {logoUrl ? (
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
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
                      className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => handleDragActive(e, true)}
                    onDragLeave={(e) => handleDragActive(e, false)}
                    className={`relative w-full py-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${
                      dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 bg-slate-50 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      disabled={isUploading}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="text-center pointer-events-none">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-5 h-5 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-900">
                        {isUploading ? "Uploading..." : "Drop your logo here"}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">PNG, JPG, WebP, SVG • Max 2MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Name */}
              <div className="p-6 border-b border-slate-200">
                <label htmlFor="companyName" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Company Name
                </label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  onFocus={() => setFocusedField("companyName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Acme Inc."
                  className="h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>

              {/* Address */}
              <div className="p-6">
                <label htmlFor="address" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Address
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  onFocus={() => setFocusedField("address")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="123 Main Street, City, State 12345"
                  className="h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Contact Details</h3>
              <span className="text-xs text-slate-500">For invoices</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Phone */}
              <div className="p-6 border-b border-slate-200">
                <label htmlFor="phone" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Phone
                </label>
                <PhoneInput
                  id="phone"
                  value={formData.phone}
                  onChange={(value) => handleInputChange("phone", value)}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="(555) 123-4567"
                  className="h-11 px-4 w-full border-0 bg-slate-50 rounded-lg text-sm placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>

              {/* Billing Email */}
              <div className="p-6">
                <label htmlFor="billingEmail" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
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
                  className="h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Invoice Configuration Section */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Invoice Formatting</h3>
              <span className="text-xs text-slate-500">Appearance and numbering</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Invoice Prefix */}
              <div className="p-6 border-b border-slate-200">
                <label htmlFor="invoicePrefix" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Invoice Prefix
                </label>
                <Input
                  id="invoicePrefix"
                  value={formData.invoicePrefix}
                  onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                  onFocus={() => setFocusedField("invoicePrefix")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="INV-"
                  className="h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all"
                />
                <p className="text-xs text-slate-500 mt-3">
                  Numbers will look like: <span className="font-mono font-medium text-slate-900">{formData.invoicePrefix}001</span>, <span className="font-mono font-medium text-slate-900">{formData.invoicePrefix}002</span>
                </p>
              </div>

              {/* Date Format */}
              <div className="p-6 border-b border-slate-200">
                <label htmlFor="dateFormat" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={formData.dateFormat}
                  onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                  className="w-full h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm text-slate-900 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23374151' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
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
                <label htmlFor="paymentTerms" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                  Payment Terms
                </label>
                <select
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  className="w-full h-11 px-4 border-0 bg-slate-50 rounded-lg text-sm text-slate-900 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23374151' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
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
              <h3 className="text-sm font-semibold text-slate-900">Invoice Notes</h3>
              <span className="text-xs text-slate-500">Optional</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6">
              <label htmlFor="footerNote" className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-3">
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
                className="w-full px-4 py-3 border-0 bg-slate-50 rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:bg-slate-100 focus:ring-1 focus:ring-slate-400 transition-all resize-none"
              />
              <p className="text-xs text-slate-500 mt-3">
                This message appears at the bottom of all invoices
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-4">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-900 hover:bg-slate-50 active:scale-[0.98] transition-all duration-150"
            >
              <Eye className="w-4 h-4" />
              Preview Invoice
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Preview Modal */}
    <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
      <DialogContent className="w-[98vw] h-[96vh] max-w-[98vw] max-h-[96vh] p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        <DialogHeader className="relative px-8 py-6 border-b border-slate-200">
          <DialogTitle className="text-xl">Invoice Preview</DialogTitle>
          <button
            onClick={() => setIsPreviewOpen(false)}
            aria-label="Close invoice preview"
            className="absolute right-6 top-6 flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150"
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
              address: formData.address,
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
