"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, Phone, Car, UserCheck, Search, X, Upload, Download,
  FileText, Camera, CreditCard, Pencil,
  Shield, Briefcase, IdCard, CheckCircle2, AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from "@/lib/hooks/use-drivers"
import { useVehicles } from "@/lib/hooks/use-vehicles"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { getInitials, formatPhone } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"
import { DatePickerInput } from "@/components/ui/date-picker"
import { StateCombobox } from "@/components/ui/state-combobox"
import { format as fnsFormat, parse as fnsParse, isValid } from "date-fns"
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
  birthday: z.string().optional(),
  homeAddress: z.string().optional(),
  homeCity: z.string().optional(),
  homeState: z.string().optional(),
  homeZip: z.string().optional(),
  notes: z.string().optional(),
  defaultVehicleId: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]).optional(),
})
type DriverFormData = z.infer<typeof driverSchema>

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CFG = {
  ACTIVE:   { label: "Active",   dot: "bg-emerald-400", chip: "bg-emerald-500/15 text-emerald-300", accent: "#10b981", accentBg: "rgba(16,185,129,0.06)" },
  INACTIVE: { label: "Inactive", dot: "bg-gray-400",    chip: "bg-white/[0.08] text-white/55",      accent: "#94a3b8", accentBg: "rgba(148,163,184,0.05)" },
  ON_LEAVE: { label: "On Leave", dot: "bg-amber-400",   chip: "bg-amber-500/15 text-amber-300",     accent: "#f59e0b", accentBg: "rgba(245,158,11,0.06)" },
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

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (!value) return
    try {
      const res = await fetch(value.url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = value.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab
      window.open(value.url, "_blank")
    }
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
                <FileText style={{ width: 18, height: 18 }} className="text-blue-500" />
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
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(null) }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
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
    <div className="group/card">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-300",
          dragging
            ? "ring-2 ring-blue-400 ring-offset-1 shadow-[0_0_0_4px_rgba(59,130,246,0.12)] scale-[1.01]"
            : value
            ? "ring-1 ring-gray-200/80 shadow-sm hover:shadow-md hover:ring-gray-300/80"
            : "ring-1 ring-dashed ring-gray-200 hover:ring-blue-300 hover:shadow-sm cursor-pointer",
        )}
        onClick={() => !value && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ minHeight: 130 }}
      >
        {uploading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 p-6 h-full min-h-[130px] bg-gradient-to-br from-blue-50/60 to-white">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-[11px] font-medium text-blue-500 tracking-wide">Uploading…</p>
          </div>
        ) : value ? (
          value.isImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.url} alt={label} className="w-full h-full object-cover min-h-[130px] block" />
              {/* Gradient overlay always visible at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              {/* Action buttons — visible on hover */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 p-2.5 opacity-0 group-hover/card:opacity-100 transition-all duration-200 translate-y-1 group-hover/card:translate-y-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(null) }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/80 hover:border-red-400/40 transition-all duration-150"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-150"
                >
                  <Upload className="w-3 h-3" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/15 backdrop-blur-sm border border-white/20 text-white hover:bg-white/30 transition-all duration-150"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-5 min-h-[130px] bg-gradient-to-br from-blue-50/40 to-white">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-700 truncate max-w-[150px]">{value.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">PDF document</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(null) }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 transition-all duration-150"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-150"
                >
                  <Upload className="w-3 h-3" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all duration-150"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5 p-6 min-h-[130px] bg-gradient-to-br from-gray-50/80 to-white group-hover/card:from-blue-50/40 transition-all duration-300">
            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover/card:border-blue-100 group-hover/card:shadow-blue-100/50 transition-all duration-300">
              <Icon className="w-5 h-5 text-gray-300 group-hover/card:text-blue-400 transition-colors duration-300" />
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-xs font-semibold text-gray-600 group-hover/card:text-blue-600 transition-colors duration-200">{label}</p>
              {sublabel && <p className="text-[11px] text-gray-400">{sublabel}</p>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-px w-8 bg-gray-200" />
              <p className="text-[10px] text-gray-300 font-medium tracking-wide uppercase">Click or drag &amp; drop</p>
              <div className="h-px w-8 bg-gray-200" />
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1.5 font-medium">
          <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-100 text-red-500 text-[9px] flex items-center justify-center font-bold">!</span>
          {error}
        </p>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = "" }} />
    </div>
  )
}

// ── Driver Card ────────────────────────────────────────────────────────────────

function DriverCard({ driver, onEdit, index }: { driver: Driver; onEdit: (d: Driver) => void; index: number }) {
  const { isDark } = useTheme()
  const cfg = STATUS_CFG[driver.status] || STATUS_CFG.ACTIVE
  const tripCount = driver._count?.trips ?? 0

  const lightChip: Record<string, string> = {
    ACTIVE:   "bg-emerald-100 text-emerald-800",
    INACTIVE: "bg-gray-100 text-gray-500",
    ON_LEAVE: "bg-amber-100 text-amber-800",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.04 }}
      onClick={() => onEdit(driver)}
      className="group relative rounded-2xl cursor-pointer overflow-hidden"
      style={{
        background: "var(--lc-bg-surface)",
        borderTop: "1px solid var(--lc-bg-glass-mid)",
        borderRight: "1px solid var(--lc-bg-glass-mid)",
        borderBottom: "1px solid var(--lc-bg-glass-mid)",
        borderLeft: `3px solid ${cfg.accent}`,
        boxShadow: isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "var(--lc-shadow-card)",
        transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderTopColor = "var(--lc-border)"
        el.style.borderRightColor = "var(--lc-border)"
        el.style.borderBottomColor = "var(--lc-border)"
        el.style.background = isDark ? "#111e35" : "var(--lc-bg-card)"
        el.style.boxShadow = isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.08)"
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderTopColor = "var(--lc-bg-glass-mid)"
        el.style.borderRightColor = "var(--lc-bg-glass-mid)"
        el.style.borderBottomColor = "var(--lc-bg-glass-mid)"
        el.style.background = "var(--lc-bg-surface)"
        el.style.boxShadow = isDark ? "0 2px 12px rgba(0,0,0,0.25)" : "var(--lc-shadow-card)"
      }}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            {driver.avatarUrl ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={driver.avatarUrl} alt={driver.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", boxShadow: "0 2px 10px rgba(37,99,235,0.30)" }}
              >
                {getInitials(driver.name)}
              </div>
            )}
            <div
              className={cn("absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2", cfg.dot)}
              style={{ borderColor: "var(--lc-bg-surface)" }}
            />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm leading-tight truncate" style={{ color: "var(--lc-text-primary)" }}>{driver.name}</h3>
              <span className={cn("text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0", isDark ? cfg.chip : lightChip[driver.status] ?? lightChip.INACTIVE)}>
                {cfg.label}
              </span>
            </div>
            {driver.email && <p className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--lc-text-label)" }}>{driver.email}</p>}
          </div>
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: "var(--lc-bg-glass)" }} />

      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--lc-text-dim)" }}>
          <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--lc-text-muted)" }} />
          <span className="font-medium">{formatPhone(driver.phone)}</span>
        </div>
        {driver.defaultVehicle && (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--lc-text-dim)" }}>
            <Car className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--lc-text-muted)" }} />
            <span className="truncate">{driver.defaultVehicle.name}</span>
          </div>
        )}
        {driver.licenseNumber && (
          <div className="flex items-center gap-2 text-[12px]">
            <IdCard className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--lc-text-muted)" }} />
            <span className="font-mono text-[11.5px]" style={{ color: "var(--lc-text-dim)" }}>{driver.licenseNumber}</span>
          </div>
        )}
      </div>

      {(driver._count?.trips !== undefined || driver.licensePhotoFront || driver.licensePhotoBack) && (
        <>
          <div className="h-px mx-4" style={{ background: "var(--lc-bg-glass)" }} />
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {driver._count?.trips !== undefined && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: tripCount > 0
                      ? isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.10)"
                      : "var(--lc-bg-glass-mid)",
                    color: tripCount > 0
                      ? isDark ? "rgba(147,197,253,0.90)" : "#1D4ED8"
                      : "var(--lc-text-label)",
                  }}
                >
                  {tripCount} trip{tripCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {driver.licensePhotoFront && (
                <div className={cn("flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md", isDark ? "text-emerald-400 bg-emerald-500/15" : "text-emerald-800 bg-emerald-100")}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="font-medium">License</span>
                </div>
              )}
              {(driver.document1Url || driver.document2Url) && (
                <div className={cn("flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded-md", isDark ? "text-blue-400 bg-blue-500/15" : "text-blue-800 bg-blue-100")}>
                  <FileText className="w-3 h-3" />
                  <span className="font-medium">Docs</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--lc-border)", border: "1px solid var(--lc-border-medium)" }}>
          <Pencil className="w-3 h-3" style={{ color: "var(--lc-text-secondary)" }} />
        </div>
      </div>
    </motion.div>
  )
}

// ── Status filter tabs ─────────────────────────────────────────────────────────

const FILTER_TABS = [
  { id: "", label: "All" },
  { id: "ACTIVE", label: "Active" },
  { id: "INACTIVE", label: "Inactive" },
  { id: "ON_LEAVE", label: "On Leave" },
] as const

// ── Divider label ──────────────────────────────────────────────────────────────

function FieldDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.07em] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

// ── Driver Modal ───────────────────────────────────────────────────────────────

function DriverModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing: Driver | null
}) {
  const { isDark } = useTheme()
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()
  const deleteDriver = useDeleteDriver()
  const { data: vehicles } = useVehicles()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "documents">("info")
  const [tabFading, setTabFading] = useState(false)
  const formScrollRef = useRef<HTMLDivElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const [avatar, setAvatar] = useState<UploadedFile | null>(null)
  const [licenseFront, setLicenseFront] = useState<UploadedFile | null>(null)
  const [licenseBack, setLicenseBack] = useState<UploadedFile | null>(null)
  const [doc1, setDoc1] = useState<UploadedFile | null>(null)
  const [doc2, setDoc2] = useState<UploadedFile | null>(null)

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema) as never,
  })

  const watchedName = watch("name") ?? ""
  const watchedStatus = (watch("status") ?? editing?.status ?? "ACTIVE") as keyof typeof STATUS_CFG
  const statusCfg = STATUS_CFG[watchedStatus] || STATUS_CFG.ACTIVE
  const displayName = watchedName || editing?.name || ""

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Escape to close
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") handleClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Populate form
  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    setActiveTab("info")
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
        birthday: editing.birthday ? fnsFormat(new Date(editing.birthday), "MM/dd/yyyy") : "",
        homeAddress: editing.homeAddress || "",
        homeCity: editing.homeCity || "",
        homeState: editing.homeState || "",
        homeZip: editing.homeZip || "",
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
      reset({ name: "", phone: "", email: "", licenseNumber: "", licenseExpiry: "", birthday: "", homeAddress: "", homeCity: "", homeState: "", homeZip: "", notes: "", defaultVehicleId: "", status: "ACTIVE" })
      setAvatar(null); setLicenseFront(null); setLicenseBack(null); setDoc1(null); setDoc2(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id])

  function handleClose() {
    setConfirmDelete(false)
    onClose()
  }

  async function handleAvatarFile(file: File) {
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("slot", "avatar")
      const res = await fetch("/api/drivers/upload", { method: "POST", body: fd })
      if (!res.ok) throw new Error("Upload failed")
      const { url, name } = await res.json()
      setAvatar({ url, name, isImage: true })
    } finally {
      setAvatarUploading(false)
    }
  }

  function onSubmit(data: DriverFormData) {
    const birthdayParsed = data.birthday
      ? fnsParse(data.birthday, "MM/dd/yyyy", new Date())
      : null
    const payload = {
      ...data,
      email: data.email || undefined,
      birthday: birthdayParsed && isValid(birthdayParsed) ? birthdayParsed.toISOString().split("T")[0] : undefined,
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
  const mutationError = createDriver.error || updateDriver.error

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
          style={{ backdropFilter: "blur(10px)", backgroundColor: "rgba(10,15,30,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[20px] w-full max-w-[860px] max-h-[90vh] flex flex-col overflow-hidden"
            style={{ boxShadow: "0 32px 100px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">
                  {editing ? "Edit Driver" : "Add Driver"}
                </h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {editing ? "Update driver profile and documents" : "Fill in the details to register a new driver"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            {/* ── Body: two-column ── */}
            <div className="flex-1 min-h-0 flex mx-5 mb-0 border border-gray-200 rounded-xl overflow-hidden">

              {/* Left: tab bar + scrollable form */}
              <div className="flex-1 min-w-0 flex flex-col">

                {/* Tab bar */}
                <div className="flex items-center gap-1 border-b border-gray-100 px-5 flex-shrink-0">
                  {([
                    { id: "info" as const, label: "Basic Info" },
                    { id: "documents" as const, label: "Documents" },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        if (tab.id === activeTab) return
                        setTabFading(true)
                        setTimeout(() => {
                          setActiveTab(tab.id)
                          formScrollRef.current?.scrollTo({ top: 0 })
                          setTabFading(false)
                        }, 120)
                      }}
                      className={cn(
                        "relative px-1 py-3 text-[13px] font-semibold transition-colors duration-150 mr-4",
                        activeTab === tab.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="tab-underline"
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-blue-600"
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Scrollable form body */}
                <div ref={formScrollRef} className="flex-1 overflow-y-auto overscroll-contain">
                  <form id="driver-form" onSubmit={handleSubmit(onSubmit)}>
                    {/* CSS fade — no framer-motion here so fixed-position Select popups work */}
                    <div style={{ opacity: tabFading ? 0 : 1, transition: "opacity 0.12s ease", minHeight: 420 }}>

                    {/* ── Basic Info tab ── */}
                    {activeTab === "info" && (
                      <div className="space-y-4 px-5 py-5">
                        <FieldDivider>Contact</FieldDivider>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-600">
                            Full Name <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            {...register("name")}
                            placeholder="e.g. Michael Rodriguez"
                            className="h-10 text-sm"
                            autoFocus
                          />
                          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">
                              Phone <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              {...register("phone")}
                              placeholder="(305) 555-9876"
                              type="tel"
                              className="h-10 text-sm"
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, "").slice(0, 10)
                                let formatted = digits
                                if (digits.length >= 7) formatted = `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
                                else if (digits.length >= 4) formatted = `(${digits.slice(0,3)}) ${digits.slice(3)}`
                                else if (digits.length >= 1) formatted = `(${digits}`
                                e.target.value = formatted
                                register("phone").onChange(e)
                              }}
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">Email</Label>
                            <Input {...register("email")} placeholder="mike@email.com" type="email" className="h-10 text-sm" />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                          </div>
                        </div>

                        <FieldDivider>Assignment</FieldDivider>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">Status</Label>
                            <Controller
                              name="status"
                              control={control}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={(v) => { if (typeof v === "string") field.onChange(v) }}>
                                  <SelectTrigger className="h-10 text-sm">
                                    <span className={field.value ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                                      {field.value ? STATUS_CFG[field.value as keyof typeof STATUS_CFG]?.label : "Select status"}
                                    </span>
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
                              render={({ field }) => {
                                const selectedVehicle = vehicles?.find(v => v.id === field.value)
                                return (
                                  <Select value={field.value || ""} onValueChange={(v) => { if (typeof v === "string") field.onChange(v) }}>
                                    <SelectTrigger className="h-10 text-sm">
                                      <span className={selectedVehicle ? "text-gray-900 text-sm" : "text-gray-400 text-sm"}>
                                        {selectedVehicle ? selectedVehicle.name : "None"}
                                      </span>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">None</SelectItem>
                                      {vehicles?.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-600">Birthday</Label>
                          <Controller
                            name="birthday"
                            control={control}
                            render={({ field }) => (
                              <DatePickerInput
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                placeholder="MM/DD/YYYY"
                              />
                            )}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-gray-600">Home Address</Label>
                          <Input
                            {...register("homeAddress")}
                            placeholder="Street address"
                            className="h-10 text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              {...register("homeCity")}
                              placeholder="City"
                              className="h-10 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <StateCombobox
                                value={watch("homeState") ?? ""}
                                onChange={(v) => setValue("homeState", v)}
                              />
                              <Input
                                {...register("homeZip")}
                                placeholder="ZIP"
                                className="h-10 text-sm"
                                maxLength={10}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-gray-600">Notes</Label>
                          <Textarea
                            {...register("notes")}
                            placeholder="Any relevant notes about this driver..."
                            className="text-sm resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    )}

                    {/* ── Documents tab ── */}
                    {activeTab === "documents" && (
                      <div className="space-y-5 px-5 py-5">
                        <FieldDivider>Driver&apos;s License</FieldDivider>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-600">License Number</Label>
                            <Input
                              {...register("licenseNumber")}
                              placeholder="D12345678"
                              className="h-10 text-sm font-mono"
                            />
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

                        <FieldDivider>Additional Documents</FieldDivider>

                        <div className="space-y-2.5 pb-1">
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
                    )}

                    </div>{/* end fade wrapper */}
                  </form>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="w-px flex-shrink-0 border-l border-dashed border-gray-200" />

              {/* Right: Preview panel */}
              <div className="w-[210px] flex-shrink-0 flex flex-col items-center px-5 py-6 bg-gray-50/40">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-5">Preview</p>

                {/* Circular avatar with pencil button */}
                <div className="relative mb-4">
                  <div
                    className="w-[96px] h-[96px] rounded-full overflow-hidden cursor-pointer ring-4 ring-white shadow-md"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarUploading ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : avatar?.isImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar.url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-[22px] font-bold"
                        style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" }}
                      >
                        {getInitials(displayName || "?")}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-[30px] h-[30px] bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = "" }}
                  />
                </div>

                {/* Live name */}
                <p className={cn(
                  "text-[15px] font-bold text-center leading-snug px-2",
                  displayName ? "text-gray-900" : "text-gray-300"
                )}>
                  {displayName || "Driver name"}
                </p>

                {/* Status chip */}
                <span className={cn(
                  "inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold px-3 py-[5px] rounded-full",
                  isDark ? statusCfg.chip : {
                    ACTIVE:   "bg-emerald-100 text-emerald-800",
                    INACTIVE: "bg-gray-100 text-gray-600",
                    ON_LEAVE: "bg-amber-100 text-amber-800",
                  }[watchedStatus] ?? "bg-gray-100 text-gray-600"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusCfg.dot)} />
                  {statusCfg.label}
                </span>

                {/* Trip count pill */}
                {editing && editing._count?.trips !== undefined && (
                  <div className="mt-3 flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                    <Car className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[12px] text-gray-600 font-medium">
                      {editing._count.trips} trip{editing._count.trips !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* License badge */}
                {(licenseFront || licenseBack) && (
                  <div className="mt-2 flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[12px] text-gray-600 font-medium">License</span>
                  </div>
                )}
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="flex-shrink-0 px-6 py-4">
              {mutationError && (
                <div className="flex items-center gap-2 mb-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-[13px] text-red-700 font-medium">
                    {mutationError instanceof Error ? mutationError.message : "Something went wrong. Please try again."}
                  </p>
                </div>
              )}
              <AnimatePresence mode="wait" initial={false}>
                {confirmDelete ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                    className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-[13px] text-red-700 font-semibold">Delete this driver permanently?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="text-[12px] font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-white transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDriver.mutate(editing!.id, { onSuccess: handleClose })}
                        className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        {deleteDriver.isPending ? "Deleting..." : "Yes, delete"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="flex items-center justify-between"
                  >
                    <div>
                      {editing && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-red-200 bg-red-50 text-[12.5px] font-semibold text-red-500 hover:bg-red-100 hover:border-red-300 hover:text-red-600 transition-all duration-150"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          Delete driver
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="h-10 px-5 text-sm rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isPending}
                        className="h-10 px-7 text-sm font-semibold rounded-xl min-w-[130px] transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        style={{
                          background: "#c9a87c",
                          color: "var(--lc-bg-page)",
                          boxShadow: "0 2px 12px rgba(201,168,124,0.28)",
                        }}
                        onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
                      >
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                            Saving...
                          </div>
                        ) : (editing ? "Save Changes" : "Add Driver")}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────────────────

function DriverSkeleton() {
  return (
    <div className="rounded-2xl p-4 animate-pulse" style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl flex-shrink-0" style={{ background: "var(--lc-bg-glass-mid)" }} />
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex justify-between gap-3">
            <div className="h-3.5 rounded-full w-28" style={{ background: "var(--lc-bg-glass-mid)" }} />
            <div className="h-5 rounded-full w-16" style={{ background: "var(--lc-bg-glass-mid)" }} />
          </div>
          <div className="h-3 rounded-full w-36" style={{ background: "var(--lc-bg-glass-mid)" }} />
        </div>
      </div>
      <div className="h-px mb-3" style={{ background: "var(--lc-bg-glass)" }} />
      <div className="space-y-2">
        <div className="h-3 rounded-full w-24" style={{ background: "var(--lc-bg-glass-mid)" }} />
        <div className="h-3 rounded-full w-20" style={{ background: "var(--lc-bg-glass-mid)" }} />
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DriversPage() {
  const { isDark } = useTheme()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Driver | null>(null)

  const debouncedSearch = useDebounce(search, 300)
  const { data: drivers, isLoading } = useDrivers(debouncedSearch, statusFilter)

  const activeCount = drivers?.filter(d => d.status === "ACTIVE").length ?? 0
  const onLeaveCount = drivers?.filter(d => d.status === "ON_LEAVE").length ?? 0
  const totalCount = drivers?.length ?? 0

  function openAdd() { setEditing(null); setModalOpen(true) }
  function openEdit(d: Driver) { setEditing(d); setModalOpen(true) }

  return (
    <>
      {/* Dark backdrop behind dock nav */}
      <div
        className="fixed bottom-0 inset-x-0 pointer-events-none"
        style={{ height: "max(141px, calc(141px + env(safe-area-inset-bottom)))", background: "var(--lc-bg-page)", zIndex: 0 }}
      />

      {/* Full-bleed dark page wrapper */}
      <div
        className="-mx-4 -mt-4 md:-mx-6 md:-mt-6"
        style={{ background: "var(--lc-bg-page)", minHeight: "calc(100dvh - 56px)", position: "relative", zIndex: 1 }}
      >
        <div className="px-4 pt-4 md:px-6 md:pt-6 pb-6 max-w-6xl mx-auto space-y-3">

          {/* ── Header card ── */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)", boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}
          >
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <UserCheck className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Drivers
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}>
                    {isLoading ? "Loading…" : totalCount === 0 ? "No drivers yet" : `${totalCount} driver${totalCount !== 1 ? "s" : ""} in your fleet`}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {(isDark ? [
                  { label: "Total",    value: totalCount,   bg: "rgba(201,168,124,0.10)", border: "rgba(201,168,124,0.22)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c" },
                  { label: "Active",   value: activeCount,  bg: "rgba(52,211,153,0.10)",  border: "rgba(52,211,153,0.22)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399" },
                  { label: "On Leave", value: onLeaveCount, bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.22)",  color: "rgba(251,191,36,0.90)",  dot: "#fbbf24" },
                ] : [
                  { label: "Total",    value: totalCount,   bg: "var(--lc-bg-glass-mid)", border: "var(--lc-border)", color: "var(--lc-text-primary)", dot: "#c9a87c" },
                  { label: "Active",   value: activeCount,  bg: "var(--lc-bg-glass-mid)", border: "var(--lc-border)", color: "var(--lc-text-primary)", dot: "#64B896" },
                  { label: "On Leave", value: onLeaveCount, bg: "var(--lc-bg-glass-mid)", border: "var(--lc-border)", color: "var(--lc-text-primary)", dot: "#D4A843" },
                ]).map(s => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums">{s.value}</span>
                    <span className="font-medium" style={{ opacity: isDark ? 0.7 : 1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            <div className="flex items-center gap-2.5 px-5 py-3.5">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--lc-text-muted)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search drivers…"
                  className="h-9 pl-8.5 pr-8 w-full text-[13px] rounded-xl outline-none transition-all duration-200 font-medium"
                  style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-primary)" }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid rgba(201,168,124,0.40)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "0 0 0 2px rgba(201,168,124,0.08)"
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.border = "1px solid var(--lc-bg-glass-hover)"
                    ;(e.target as HTMLInputElement).style.boxShadow = "none"
                  }}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--lc-text-muted)" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div
                className="flex items-center gap-0.5 rounded-[11px] p-1"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
              >
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                    style={statusFilter === tab.id
                      ? { background: "var(--lc-border)", color: "var(--lc-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                      : { color: "var(--lc-text-dim)" }
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 select-none cursor-pointer"
                style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Driver</span>
                <span className="sm:hidden">Add</span>
              </button>
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
                style={{ background: "rgba(201,168,124,0.08)", border: "1.5px dashed rgba(201,168,124,0.30)" }}
              >
                <UserCheck className="w-7 h-7" style={{ color: "rgba(201,168,124,0.60)" }} />
              </div>
              <p className="font-bold text-sm" style={{ color: "var(--lc-text-secondary)" }}>
                {search || statusFilter ? "No drivers match your filters" : "No drivers yet"}
              </p>
              <p className="text-xs mt-1.5 max-w-xs leading-relaxed" style={{ color: "var(--lc-text-label)" }}>
                {search || statusFilter
                  ? "Try adjusting your search or filter"
                  : "Add your first driver to start building your fleet roster"}
              </p>
              {!search && !statusFilter && (
                <button
                  onClick={openAdd}
                  className="mt-5 flex items-center gap-1.5 h-9 px-5 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 cursor-pointer"
                  style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  Add First Driver
                </button>
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

        </div>
      </div>

      {/* ── Modal ── */}
      <DriverModal open={modalOpen} onClose={() => setModalOpen(false)} editing={editing} />
    </>
  )
}
