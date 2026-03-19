"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Phone, Mail, Car, UserCheck, Search, X, Upload,
  FileText, Camera, CreditCard, ChevronDown, Pencil,
  Shield, Briefcase, IdCard, CheckCircle2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { getInitials, formatPhone, getDriverStatusLabel } from "@/lib/utils"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import type { Driver } from "@/types"

// ── Schema ─────────────────────────────────────────────────────────────────────

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  notes: z.string().optional(),
  defaultVehicleId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
})
type DriverFormData = z.infer<typeof driverSchema>

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  ACTIVE:   { label: "Active",   dot: "bg-emerald-400", chip: "bg-emerald-50 text-emerald-700", accent: "#10b981", accentBg: "rgba(16,185,129,0.04)" },
  INACTIVE: { label: "Inactive", dot: "bg-gray-400",    chip: "bg-gray-100 text-gray-500",      accent: "#94a3b8", accentBg: "rgba(148,163,184,0.04)" },
  ON_LEAVE: { label: "On Leave", dot: "bg-amber-400",   chip: "bg-amber-50 text-amber-700",     accent: "#f59e0b", accentBg: "rgba(245,158,11,0.04)" },
} as const

// ── File upload state type ─────────────────────────────────────────────────────

type UploadedFile = { url: string; name: string; isImage: boolean }
type FileSlot = "avatar" | "license-front" | "license-back" | "doc1" | "doc2"

// ── FileUploadZone ─────────────────────────────────────────────────────────────

function FileUploadZone({
  slot,
  label,
  sublabel,
  icon: Icon,
  value,
  onChange,
  accept = "image/*",
  circular = false,
  compact = false,
}: {
  slot: FileSlot
  label: string
  sublabel?: string
  icon: React.ElementType
  value: UploadedFile | null
  onChange: (v: UploadedFile | null) => void
  accept?: string
  circular?: boolean
  compact?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("slot", slot)
      const res = await fetch("/api/drivers/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Upload failed")
      }
      const { url, name } = await res.json()
      onChange({ url, name, isImage: file.type.startsWith("image/") })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  if (circular) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "relative w-24 h-24 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 flex items-center justify-center overflow-hidden group",
            dragging ? "border-blue-400 bg-blue-50 scale-105" : value ? "border-transparent" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50",
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {value?.isImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.url} alt="Avatar" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              {uploading ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" />
                  <span className="text-[10px] text-gray-400 group-hover:text-blue-500 transition-colors">Upload</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-700">{label}</p>
          {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
        </div>
        {error && <p className="text-[11px] text-red-500 text-center">{error}</p>}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] text-red-400 hover:text-red-600 transition-colors"
          >
            Remove photo
          </button>
        )}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
      </div>
    )
  }

  if (compact) {
    return (
      <div>
        <div
          className={cn(
            "relative flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer transition-all duration-200 group",
            dragging ? "border-blue-400 bg-blue-50" : value ? "border-gray-200 bg-gray-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30",
          )}
          onClick={() => !value && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
            value ? "bg-blue-50" : "bg-gray-50 group-hover:bg-blue-50"
          )}>
            {uploading ? (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : value ? (
              value.isImage ? (
                <div className="relative w-9 h-9 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={value.url} alt={label} className="w-full h-full object-cover" />
                </div>
              ) : (
                <FileText className="w-4.5 h-4.5 text-blue-500" style={{ width: 18, height: 18 }} />
              )
            ) : (
              <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700">{label}</p>
            {value ? (
              <p className="text-[11px] text-gray-400 truncate">{value.name}</p>
            ) : (
              <p className="text-[11px] text-gray-400">{sublabel || "Click or drag to upload"}</p>
            )}
          </div>
          {value ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Upload className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
          )}
        </div>
        {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
      </div>
    )
  }

  // Standard card zone
  return (
    <div>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 text-center group min-h-[100px]",
          dragging ? "border-blue-400 bg-blue-50 scale-[1.02]" : value ? "border-gray-200 bg-gray-50/50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30",
        )}
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <>
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Uploading...</p>
          </>
        ) : value ? (
          <>
            {value.isImage ? (
              <div className="relative w-full h-24 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.url} alt={label} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-xs text-gray-600 font-medium truncate max-w-[140px]">{value.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null) }} className="text-[11px] text-red-400 hover:text-red-600 transition-colors">Remove</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }} className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors">Replace</button>
            </div>
          </>
        ) : (
          <>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", "bg-gray-50 group-hover:bg-blue-50")}>
              <Icon className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 group-hover:text-blue-600 transition-colors">{label}</p>
              {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
            </div>
            <p className="text-[10px] text-gray-300">Click or drag & drop</p>
          </>
        )}
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
    </div>
  )
}

// ── Driver Card ────────────────────────────────────────────────────────────────

function DriverCard({ driver, onEdit, index }: { driver: Driver; onEdit: (d: Driver) => void; index: number }) {
  const cfg = STATUS_CFG[driver.status] || STATUS_CFG.ACTIVE

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay: index * 0.04 }}
      onClick={() => onEdit(driver)}
      className={cn(
        "group relative bg-white rounded-2xl border border-gray-100 cursor-pointer overflow-hidden",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      )}
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: cfg.accent,
        background: cfg.accentBg,
      }}
    >
      {/* Top section */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {driver.avatarUrl ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}
              >
                {getInitials(driver.name)}
              </div>
            )}
            {/* Status dot */}
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white",
              cfg.dot
            )} />
          </div>

          {/* Name + status */}
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{driver.name}</h3>
              <span className={cn(
                "text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0",
                cfg.chip
              )}>
                {cfg.label}
              </span>
            </div>
            {driver.email && (
              <p className="text-[11.5px] text-gray-400 truncate mt-0.5">{driver.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-4" />

      {/* Info section */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] text-gray-500">
          <Phone className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          <span className="font-medium">{formatPhone(driver.phone)}</span>
        </div>
        {driver.defaultVehicle && (
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <Car className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="truncate">{driver.defaultVehicle.name}</span>
          </div>
        )}
        {driver.licenseNumber && (
          <div className="flex items-center gap-2 text-[12px] text-gray-500">
            <IdCard className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="font-mono text-[11.5px]">{driver.licenseNumber}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      {(driver._count?.trips !== undefined || driver.licensePhotoFront || driver.licensePhotoBack) && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-4" />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {driver._count?.trips !== undefined && (
                <span className="text-[11px] text-gray-400 font-medium">
                  {driver._count.trips} trip{driver._count.trips !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {driver.licensePhotoFront && (
                <div className="flex items-center gap-1 text-[10.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="font-medium">License</span>
                </div>
              )}
              {(driver.document1Url || driver.document2Url) && (
                <div className="flex items-center gap-1 text-[10.5px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                  <FileText className="w-3 h-3" />
                  <span className="font-medium">Docs</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hover edit hint */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center">
          <Pencil className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    </motion.div>
  )
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

// ── Driver form sheet ──────────────────────────────────────────────────────────

function DriverSheet({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Driver | null
}) {
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const deleteDriver = useDeleteDriver()
  const { data: vehicles } = useVehicles()
  const [confirmDelete, setConfirmDelete] = useState(false)

  // File state
  const [avatar, setAvatar] = useState<UploadedFile | null>(null)
  const [licenseFront, setLicenseFront] = useState<UploadedFile | null>(null)
  const [licenseBack, setLicenseBack] = useState<UploadedFile | null>(null)
  const [doc1, setDoc1] = useState<UploadedFile | null>(null)
  const [doc2, setDoc2] = useState<UploadedFile | null>(null)

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema) as never,
  })

  // Populate form when editing changes
  useEffect(() => {
    if (!open) return
    if (editing) {
      const d = editing.phone.replace(/\D/g, "").slice(0, 10)
      const fmtPhone = d.length >= 7
        ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
        : d.length >= 4 ? `(${d.slice(0,3)}) ${d.slice(3)}` : d
      reset({
        name: editing.name,
        phone: fmtPhone,
        email: editing.email || "",
        licenseNumber: editing.licenseNumber || "",
        licenseExpiry: editing.licenseExpiry ? editing.licenseExpiry.split("T")[0] : "",
        notes: editing.notes || "",
        defaultVehicleId: editing.defaultVehicleId || "",
        status: editing.status || "ACTIVE",
      })
      setAvatar(editing.avatarUrl ? { url: editing.avatarUrl, name: "avatar", isImage: true } : null)
      setLicenseFront(editing.licensePhotoFront ? { url: editing.licensePhotoFront, name: "license-front", isImage: true } : null)
      setLicenseBack(editing.licensePhotoBack ? { url: editing.licensePhotoBack, name: "license-back", isImage: true } : null)
      setDoc1(editing.document1Url ? { url: editing.document1Url, name: editing.document1Name || "document-1", isImage: false } : null)
      setDoc2(editing.document2Url ? { url: editing.document2Url, name: editing.document2Name || "document-2", isImage: false } : null)
    } else {
      reset({ name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", notes: "", defaultVehicleId: "", status: "ACTIVE" })
      setAvatar(null); setLicenseFront(null); setLicenseBack(null); setDoc1(null); setDoc2(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id])

  function handleClose() {
    setConfirmDelete(false)
    onClose()
  }

  function onSubmit(data: DriverFormData) {
    const payload = {
      ...data,
      email: data.email || undefined,
      defaultVehicleId: data.defaultVehicleId || undefined,
      avatarUrl: avatar?.url || null,
      licensePhotoFront: licenseFront?.url || null,
      licensePhotoBack: licenseBack?.url || null,
      document1Url: doc1?.url || null,
      document1Name: doc1?.name || null,
      document2Url: doc2?.url || null,
      document2Name: doc2?.name || null,
    }

    if (editing) {
      updateDriver.mutate({ id: editing.id, ...payload } as never, { onSuccess: handleClose })
    } else {
      createDriver.mutate(payload as never, { onSuccess: handleClose })
    }
  }

  const isPending = createDriver.isPending || updateDriver.isPending

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3 text-base font-bold text-gray-900">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}
              >
                <UserCheck className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
              </div>
              {editing ? "Edit Driver" : "Add New Driver"}
            </SheetTitle>
          </SheetHeader>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <form id="driver-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Profile Photo ── */}
            <div>
              <SectionLabel>Profile Photo</SectionLabel>
              <div className="flex justify-center py-2">
                <FileUploadZone
                  slot="avatar"
                  label="Profile Photo"
                  sublabel="Used as driver avatar"
                  icon={Camera}
                  value={avatar}
                  onChange={setAvatar}
                  accept="image/*"
                  circular
                />
              </div>
            </div>

            {/* ── Basic Information ── */}
            <div>
              <SectionLabel>Basic Information</SectionLabel>
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Full Name <span className="text-red-400">*</span></Label>
                  <Input {...register("name")} placeholder="e.g. Michael Rodriguez" className="h-10 text-sm" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Phone <span className="text-red-400">*</span></Label>
                    <Input
                      {...register("phone")}
                      placeholder="(305) 555-9876"
                      type="tel"
                      className="h-10 text-sm"
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                        let formatted = digits
                        if (digits.length >= 7) {
                          formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                        } else if (digits.length >= 4) {
                          formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                        } else if (digits.length >= 1) {
                          formatted = `(${digits}`
                        }
                        e.target.value = formatted
                        register("phone").onChange(e)
                      }}
                    />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Email</Label>
                    <Input {...register("email")} placeholder="mike@email.com" type="email" className="h-10 text-sm" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={(v) => { if (typeof v === "string") field.onChange(v) }}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Default Vehicle</Label>
                    <Controller
                      name="defaultVehicleId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={(v) => { if (typeof v === "string") field.onChange(v) }}>
                          <SelectTrigger className="h-10 text-sm">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {vehicles?.map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600">Notes</Label>
                  <Textarea {...register("notes")} placeholder="Any relevant notes about this driver..." className="text-sm resize-none" rows={2} />
                </div>
              </div>
            </div>

            {/* ── License ── */}
            <div>
              <SectionLabel>Driver&apos;s License</SectionLabel>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">License Number</Label>
                    <Input {...register("licenseNumber")} placeholder="D12345678" className="h-10 text-sm font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600">Expiry Date</Label>
                    <Input {...register("licenseExpiry")} type="date" className="h-10 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FileUploadZone
                    slot="license-front"
                    label="Front of License"
                    sublabel="Photo or scan"
                    icon={CreditCard}
                    value={licenseFront}
                    onChange={setLicenseFront}
                    accept="image/*,application/pdf"
                  />
                  <FileUploadZone
                    slot="license-back"
                    label="Back of License"
                    sublabel="Photo or scan"
                    icon={CreditCard}
                    value={licenseBack}
                    onChange={setLicenseBack}
                    accept="image/*,application/pdf"
                  />
                </div>
              </div>
            </div>

            {/* ── Additional Documents ── */}
            <div>
              <SectionLabel>Additional Documents</SectionLabel>
              <div className="space-y-2.5">
                <FileUploadZone
                  slot="doc1"
                  label="Document 1"
                  sublabel="Insurance, certification, or other"
                  icon={Briefcase}
                  value={doc1}
                  onChange={setDoc1}
                  accept="image/*,application/pdf"
                  compact
                />
                <FileUploadZone
                  slot="doc2"
                  label="Document 2"
                  sublabel="Insurance, certification, or other"
                  icon={Shield}
                  value={doc2}
                  onChange={setDoc2}
                  accept="image/*,application/pdf"
                  compact
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex-shrink-0 space-y-2">
          <div className="flex gap-2.5">
            <Button
              type="submit"
              form="driver-form"
              disabled={isPending}
              className="flex-1 h-10 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (editing ? "Save Changes" : "Add Driver")}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="h-10 px-4 text-sm">
              Cancel
            </Button>
          </div>
          {editing && (
            !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full text-[12px] text-gray-400 hover:text-red-500 transition-colors py-1"
              >
                Delete this driver
              </button>
            ) : (
              <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-600 font-medium">Permanently delete?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => deleteDriver.mutate(editing.id, { onSuccess: handleClose })}
                    className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {deleteDriver.isPending ? "Deleting..." : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────────────────

function DriverSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex justify-between gap-3">
            <div className="h-3.5 bg-gray-100 rounded-full w-28" />
            <div className="h-5 bg-gray-100 rounded-full w-16" />
          </div>
          <div className="h-3 bg-gray-100 rounded-full w-36" />
        </div>
      </div>
      <div className="h-px bg-gray-50 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-24" />
        <div className="h-3 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  )
}

// ── Status filter tabs ─────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "INACTIVE", label: "Inactive" },
  { id: "ON_LEAVE", label: "On Leave" },
] as const

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data: drivers, isLoading } = useDrivers(debouncedSearch, statusFilter)

  const activeCount = drivers?.filter(d => d.status === "ACTIVE").length ?? 0
  const onLeaveCount = drivers?.filter(d => d.status === "ON_LEAVE").length ?? 0
  const totalCount = drivers?.length ?? 0

  function openAdd() { setEditing(null); setSheetOpen(true) }
  function openEdit(d: Driver) { setEditing(d); setSheetOpen(true) }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", boxShadow: "0 4px 12px rgba(37,99,235,0.20)" }}
            >
              <UserCheck className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 leading-tight">Driver Roster</h1>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-tight">
                {isLoading ? "Loading..." : totalCount === 0 ? "No drivers yet" : `${totalCount} driver${totalCount !== 1 ? "s" : ""} in your fleet`}
              </p>
            </div>
          </div>

          {/* Right: metric strip */}
          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "Total",    value: totalCount,   dot: "bg-blue-500" },
              { label: "Active",   value: activeCount,  dot: "bg-emerald-500" },
              { label: "On Leave", value: onLeaveCount, dot: "bg-amber-400" },
            ]).map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center px-5 py-3 min-w-[80px]">
                <span className="text-[22px] font-bold leading-none tracking-tight text-gray-800">{stat.value}</span>
                <span className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stat.dot)} />
                  <span className="text-[11px] text-gray-400 font-medium leading-none whitespace-nowrap">{stat.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        {/* Search + filter + add button row */}
        <div className="flex items-center gap-3 px-6 py-4">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search drivers..."
              className="w-full h-9 pl-8 pr-8 text-sm bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 placeholder:text-gray-300 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-gray-300 hover:text-gray-500 transition-colors" />
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                  statusFilter === tab.id
                    ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Add button */}
          <Button
            onClick={openAdd}
            className="h-9 text-sm font-semibold text-white gap-1.5 px-4"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
          >
            <Plus className="w-4 h-4" />
            Add Driver
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <DriverSkeleton key={i} />)}
        </div>
      ) : !drivers?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #f8faff 0%, #e8f0fe 100%)", border: "1.5px dashed #bfcfe8" }}
          >
            <UserCheck className="w-7 h-7 text-blue-300" />
          </div>
          <p className="font-bold text-gray-700 text-sm">
            {search || statusFilter ? "No drivers match your filters" : "No drivers yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs leading-relaxed">
            {search || statusFilter
              ? "Try adjusting your search or filter"
              : "Add your first driver to start building your fleet roster"}
          </p>
          {!search && !statusFilter && (
            <Button
              onClick={openAdd}
              className="mt-5 h-9 text-sm font-semibold text-white gap-1.5 px-5"
              style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)" }}
            >
              <Plus className="w-4 h-4" />
              Add First Driver
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {drivers.map((driver, i) => (
              <DriverCard key={driver.id} driver={driver} onEdit={openEdit} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Sheet ── */}
      <DriverSheet open={sheetOpen} onClose={() => setSheetOpen(false)} editing={editing} />
    </div>
  )
}
