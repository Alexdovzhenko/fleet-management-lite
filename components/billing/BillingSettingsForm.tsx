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
    <div className="w-full">
      {/* Form */}
      <div className="w-full max-w-2xl mx-auto px-4 py-6 lg:px-0">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900">Billing Configuration</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your invoice settings and company information</p>
        </div>

        <div className="space-y-8">
          {/* ═══ Section A: Company Branding ═══ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Company Branding</h3>

            {/* Logo Upload Section */}
            <div className="space-y-3 mb-6">
              <Label className="text-sm font-medium text-slate-700">Company Logo</Label>
              {logoUrl ? (
                <div className="relative w-full h-32 bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden">
                  <img
                    src={logoUrl}
                    alt="Company logo"
                    className="max-w-full max-h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={isUploading}
                    className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-slate-50 disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => handleDragActive(e, true)}
                  onDragLeave={(e) => handleDragActive(e, false)}
                  className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-colors flex items-center justify-center cursor-pointer ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100"
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
                    <Upload className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 font-medium">
                      {isUploading ? "Uploading..." : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP or SVG (max 2MB)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
                placeholder="Your company name"
                className="h-10"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="address" className="text-sm font-medium text-slate-700">
                Address
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street address"
                className="h-10"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200"></div>

          {/* ═══ Section B: Contact Information ═══ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Contact Information</h3>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                Phone
              </Label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => handleInputChange("phone", value)}
                placeholder="(555) 123-4567"
                className="h-10 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-slate-400 focus:outline-none"
              />
            </div>

            {/* Billing Email */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="billingEmail" className="text-sm font-medium text-slate-700">
                Billing Email
              </Label>
              <Input
                id="billingEmail"
                type="email"
                value={formData.billingEmail}
                onChange={(e) => handleInputChange("billingEmail", e.target.value)}
                placeholder="billing@company.com"
                className="h-10"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200"></div>

          {/* ═══ Section C: Invoice Configuration ═══ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Invoice Configuration</h3>

            {/* Invoice Prefix */}
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix" className="text-sm font-medium text-slate-700">
                Invoice Number Prefix
              </Label>
              <Input
                id="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
                placeholder="INV-"
                className="h-10"
              />
              <p className="text-xs text-slate-500">
                Example: {formData.invoicePrefix}001, {formData.invoicePrefix}002
              </p>
            </div>

            {/* Date Format */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="dateFormat" className="text-sm font-medium text-slate-700">
                Invoice Date Format
              </Label>
              <select
                id="dateFormat"
                value={formData.dateFormat}
                onChange={(e) => handleInputChange("dateFormat", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="Month DD, YYYY">Month DD, YYYY</option>
              </select>
            </div>

            {/* Payment Terms */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="paymentTerms" className="text-sm font-medium text-slate-700">
                Payment Terms
              </Label>
              <select
                id="paymentTerms"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Due upon receipt">Due upon receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-200"></div>

          {/* ═══ Section D: Additional Notes ═══ */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Additional Notes</h3>

            {/* Footer Note */}
            <div className="space-y-2">
              <Label htmlFor="footerNote" className="text-sm font-medium text-slate-700">
                Invoice Footer Note (Optional)
              </Label>
              <textarea
                id="footerNote"
                value={formData.footerNote}
                onChange={(e) => handleInputChange("footerNote", e.target.value)}
                placeholder="Thank you for your business!"
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-slate-500">
                This text will appear at the bottom of your invoices.
              </p>
            </div>
          </div>

          {/* Error Indicator */}
          {saveError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-700">{saveError}</span>
            </div>
          )}

          {/* Saved Indicator */}
          {isSaved && !saveError && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">All changes saved</span>
            </div>
          )}

          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-150"
          >
            <Eye className="w-4 h-4" />
            Preview Billing Invoice
          </button>
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
