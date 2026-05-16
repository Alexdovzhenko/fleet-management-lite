"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, Car, Users, X, Upload, ChevronLeft, ChevronRight, Truck, Bus, CarFront, CircleDot, GripVertical, ImagePlus, Tag, Gauge, Palette, Info, ChevronDown, Pencil, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useVehicles, useCreateVehicle, useUpdateVehicle } from "@/lib/hooks/use-vehicles"
import { getVehicleTypeLabel } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { Vehicle } from "@/types"

const MAX_PHOTOS = 3

const vehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required"),
  type: z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]),
  capacity: z.number().min(1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  year: z.number().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const vehicleTypes: { value: VehicleFormData["type"]; label: string; short: string }[] = [
  { value: "SEDAN",        label: "Sedan",        short: "Sedan" },
  { value: "SUV",          label: "SUV",           short: "SUV" },
  { value: "STRETCH_LIMO", label: "Stretch Limo",  short: "Limo" },
  { value: "SPRINTER",     label: "Sprinter Van",  short: "Sprinter" },
  { value: "PARTY_BUS",    label: "Party Bus",     short: "Party Bus" },
  { value: "COACH",        label: "Coach Bus",     short: "Coach" },
  { value: "OTHER",        label: "Other",         short: "Other" },
]

const TYPE_ICONS: Record<VehicleFormData["type"], React.ElementType> = {
  SEDAN:        Car,
  SUV:          Truck,
  STRETCH_LIMO: CarFront,
  SPRINTER:     Truck,
  PARTY_BUS:    Bus,
  COACH:        Bus,
  OTHER:        CircleDot,
}

const STATUS_DOT: Record<string, string> = {
  ACTIVE:         "bg-emerald-500",
  MAINTENANCE:    "bg-amber-400",
  OUT_OF_SERVICE: "bg-red-500",
}

const STATUS_CONFIG = {
  ACTIVE:         { label: "Active",      dot: "#34d399", textColor: "rgba(52,211,153,0.90)",  bg: "rgba(52,211,153,0.12)"  },
  MAINTENANCE:    { label: "Maintenance", dot: "#fbbf24", textColor: "rgba(251,191,36,0.90)",  bg: "rgba(251,191,36,0.12)"  },
  OUT_OF_SERVICE: { label: "Offline",     dot: "#f87171", textColor: "rgba(248,113,113,0.90)", bg: "rgba(248,113,113,0.12)" },
} as const

type StatusKey = keyof typeof STATUS_CONFIG

const FILTERS = [
  { key: "ALL",            label: "All" },
  { key: "ACTIVE",         label: "Active" },
  { key: "MAINTENANCE",    label: "Maintenance" },
  { key: "OUT_OF_SERVICE", label: "Offline" },
] as const

const STATUS_OPTIONS: { value: VehicleFormData["status"]; label: string }[] = [
  { value: "ACTIVE",         label: "Active" },
  { value: "MAINTENANCE",    label: "Maintenance" },
  { value: "OUT_OF_SERVICE", label: "Offline" },
]

const MAX_FILE_SIZE = 5 * 1024 * 1024

async function uploadPhoto(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — max allowed is 5 MB`)
  }
  const fd = new FormData()
  fd.append("file", file)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)
  let res: Response
  try {
    res = await fetch("/api/vehicles/upload-photo", { method: "POST", body: fd, signal: controller.signal })
  } catch (e: unknown) {
    clearTimeout(timeout)
    const msg = e instanceof Error && e.name === "AbortError" ? "Upload timed out after 30 s" : "Network error during upload"
    throw new Error(msg)
  }
  clearTimeout(timeout)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Upload failed (${res.status})`)
  }
  const { url } = await res.json()
  return url
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "var(--lc-bg-surface)", border: "1px solid var(--lc-bg-glass-mid)" }}
    >
      <div className="aspect-[16/9]" style={{ background: "var(--lc-bg-glass)" }} />
      <div className="px-5 pt-4 pb-5 space-y-3">
        <div className="h-4 rounded-full w-2/3" style={{ background: "var(--lc-bg-glass-mid)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "var(--lc-bg-card)" }} />
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <div className="h-7 rounded-xl w-16" style={{ background: "var(--lc-bg-glass)" }} />
            <div className="h-7 rounded-xl w-20" style={{ background: "var(--lc-bg-glass)" }} />
          </div>
          <div className="h-9 rounded-xl w-16" style={{ background: "var(--lc-bg-glass)" }} />
        </div>
      </div>
    </div>
  )
}

// ── Photo Lightbox ────────────────────────────────────────────────────────────
function PhotoLightbox({
  photos,
  initialIdx,
  vehicleName,
  onClose,
}: {
  photos: string[]
  initialIdx: number
  vehicleName: string
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIdx)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")       onClose()
      if (e.key === "ArrowRight")   setIdx(i => (i + 1) % photos.length)
      if (e.key === "ArrowLeft")    setIdx(i => (i - 1 + photos.length) % photos.length)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [photos.length, onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {photos.length > 1 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tabular-nums tracking-tight">
          {idx + 1} / {photos.length}
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm font-medium tracking-tight">
        {vehicleName}
      </div>

      <div
        className="relative max-w-5xl w-full px-16 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={photos[idx]}
          alt={vehicleName}
          className="max-h-[80vh] w-full object-contain rounded-2xl shadow-2xl"
          style={{ animation: "fadeIn 0.2s ease" }}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + photos.length) % photos.length) }}
            className="absolute left-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % photos.length) }}
            className="absolute right-5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i) }}
                className={cn(
                  "rounded-full transition-all",
                  i === idx ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }`}</style>
    </div>
  )
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────
function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: () => void }) {
  const photos = vehicle.photos?.length ? vehicle.photos : vehicle.photoUrl ? [vehicle.photoUrl] : []
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [hovered, setHovered] = useState(false)
  const thumb = photos[idx] ?? null
  const status = vehicle.status as StatusKey
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE
  const subtitle = [vehicle.year, vehicle.make, vehicle.model || getVehicleTypeLabel(vehicle.type)]
    .filter(Boolean).join(" ")

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx(i => (i - 1 + photos.length) % photos.length)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setIdx(i => (i + 1) % photos.length)
  }

  return (
    <>
      <div
        className="rounded-2xl overflow-hidden transition-all duration-300 ease-out"
        style={{
          background: hovered ? "#111e35" : "var(--lc-bg-surface)",
          border: hovered ? "1px solid var(--lc-border)" : "1px solid var(--lc-bg-glass-mid)",
          boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.45)" : "0 4px 16px rgba(0,0,0,0.30)",
          transform: hovered ? "translateY(-2px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Image Hero ── */}
        <div
          className={cn(
            "relative aspect-[16/9] overflow-hidden",
            thumb ? "cursor-zoom-in" : ""
          )}
          style={{ background: "var(--lc-bg-card)" }}
          onClick={() => thumb && setLightbox(true)}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={thumb}
              src={thumb}
              alt={vehicle.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out"
              style={{ transform: hovered ? "scale(1.04)" : "scale(1)" }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
              >
                <Car className="w-7 h-7" style={{ color: "rgba(201,168,124,0.60)" }} />
              </div>
              <span className="text-xs font-medium tracking-wide" style={{ color: "var(--lc-text-muted)" }}>
                No photo added
              </span>
            </div>
          )}

          {/* Bottom gradient */}
          {thumb && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent pointer-events-none" />
          )}

          {/* Top gradient for badge legibility */}
          {thumb && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent pointer-events-none" />
          )}

          {/* Status badge — top right */}
          <div className="absolute top-3.5 right-3.5" onClick={e => e.stopPropagation()}>
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.textColor }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          </div>

          {/* Expand hint — top left on hover */}
          {thumb && hovered && (
            <div className="absolute top-3.5 left-3.5 w-8 h-8 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Photo nav dots — bottom center */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === idx ? "16px" : "6px",
                    height: "6px",
                    background: i === idx ? "var(--lc-text-primary)" : "rgba(255,255,255,0.40)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Prev / Next arrows */}
          {photos.length > 1 && hovered && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors hover:bg-black/60 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center transition-colors hover:bg-black/60 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Name overlay — bottom of image */}
          {thumb && (
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pointer-events-none">
              <h3 className="text-white font-bold text-base leading-snug tracking-tight drop-shadow-sm">{vehicle.name}</h3>
              {subtitle && (
                <p className="text-white/65 text-[13px] font-medium mt-0.5 drop-shadow-sm">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* ── Card Body ── */}
        <div className="px-5 pt-4 pb-5">
          {/* Show name here only when there's no photo */}
          {!thumb && (
            <div className="mb-3.5">
              <h3 className="text-[15px] font-bold leading-snug tracking-tight" style={{ color: "var(--lc-text-primary)" }}>
                {vehicle.name}
              </h3>
              {subtitle && (
                <p className="text-[13px] mt-0.5 font-medium" style={{ color: "var(--lc-text-label)" }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Specs row + Edit */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">

              {/* Capacity */}
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl"
                style={{ background: "rgba(201,168,124,0.10)", color: "rgba(201,168,124,0.80)", border: "1px solid rgba(201,168,124,0.15)" }}
              >
                <Users className="w-3 h-3" />
                {vehicle.capacity} pax
              </span>

              {/* License plate */}
              {vehicle.licensePlate && (
                <span
                  className="inline-flex items-center text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-xl tracking-widest uppercase"
                  style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-secondary)" }}
                >
                  {vehicle.licensePlate}
                </span>
              )}

              {/* Color */}
              {vehicle.color && (
                <span className="text-[12px] font-medium" style={{ color: "var(--lc-text-label)" }}>
                  {vehicle.color}
                </span>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={onEdit}
              className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
              style={{ background: "var(--lc-bg-glass-mid)", color: "var(--lc-text-secondary)", border: "1px solid var(--lc-bg-glass-hover)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,124,0.15)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "#c9a87c"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,124,0.30)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--lc-bg-glass-mid)"
                ;(e.currentTarget as HTMLButtonElement).style.color = "var(--lc-text-secondary)"
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = "var(--lc-bg-glass-hover)"
              }}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {lightbox && photos.length > 0 && (
        <PhotoLightbox
          photos={photos}
          initialIdx={idx}
          vehicleName={vehicle.name}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  )
}

// ── Shared Vehicle Form ───────────────────────────────────────────────────────
function VehicleForm({
  defaultValues,
  existingPhotos = [],
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  defaultValues: Partial<VehicleFormData>
  existingPhotos?: string[]
  onSubmit: (data: VehicleFormData, photos: string[], onError: (msg: string) => void) => void
  onCancel: () => void
  isPending: boolean
  submitLabel: string
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as never,
    defaultValues: { status: "ACTIVE", ...defaultValues },
  })

  const selectedType = watch("type")
  const selectedStatus = watch("status")

  type PhotoItem = { kind: "kept"; url: string } | { kind: "new"; file: File; preview: string }
  const [photos, setPhotos] = useState<PhotoItem[]>(
    existingPhotos.map(url => ({ kind: "kept" as const, url }))
  )
  const [isDropZoneDragging, setIsDropZoneDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  const totalPhotos = photos.length
  const canAddMore = totalPhotos < MAX_PHOTOS

  function addFiles(files: File[]) {
    const remaining = MAX_PHOTOS - totalPhotos
    const images = files.filter(f => f.type.startsWith("image/"))
    const tooBig = images.filter(f => f.size > MAX_FILE_SIZE)
    if (tooBig.length) {
      setUploadError(`File too large: ${tooBig.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(", ")} — max 5 MB per photo`)
      return
    }
    const allowed = images.slice(0, remaining)
    if (!allowed.length) return
    setUploadError("")
    setPhotos(prev => [
      ...prev,
      ...allowed.map(file => ({ kind: "new" as const, file, preview: URL.createObjectURL(file) })),
    ])
  }

  function removePhoto(idx: number) {
    setPhotos(prev => {
      const item = prev[idx]
      if (item.kind === "new") URL.revokeObjectURL(item.preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  function handleDragStart(idx: number) {
    dragIndexRef.current = idx
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    const from = dragIndexRef.current
    if (from === null || from === idx) return
    setPhotos(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(idx, 0, item)
      return next
    })
    dragIndexRef.current = idx
  }

  function handleDragEnd() {
    dragIndexRef.current = null
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDropZoneDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [totalPhotos]) // eslint-disable-line

  async function handleFormSubmit(data: VehicleFormData) {
    setUploadError("")
    setIsUploading(true)
    const uploadedByIndex: Map<number, string> = new Map()
    try {
      const newItems = photos
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.kind === "new")
      if (newItems.length) {
        const urls = await Promise.all(newItems.map(({ p }) => uploadPhoto((p as { kind: "new"; file: File; preview: string }).file)))
        newItems.forEach(({ i }, j) => uploadedByIndex.set(i, urls[j]))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.")
      setIsUploading(false)
      return
    } finally {
      setIsUploading(false)
    }
    const allPhotos = photos.map((p, i) =>
      p.kind === "kept" ? p.url : uploadedByIndex.get(i)!
    )
    setSaveError("")
    onSubmit(data, allPhotos, (msg) => setSaveError(msg))
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, () => {
        setSaveError("Please fill in all required fields.")
      })}
      className="mt-2"
    >
      <div className="grid grid-cols-[5fr_6fr] gap-7">

        {/* LEFT: Identity + Type + Photos */}
        <div className="flex flex-col gap-5">

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Vehicle Name <span className="text-red-400">*</span></label>
            <Input
              {...register("name")}
              placeholder="e.g. Black Sprinter 1"
              autoFocus
              className={cn(
                "h-11 text-sm font-medium placeholder:font-normal placeholder:text-gray-400 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all",
                errors.name && "border-red-400 focus:border-red-400 focus:ring-red-100"
              )}
            />
            {errors.name
              ? <p className="text-xs text-red-500 flex items-center gap-1"><Info className="w-3 h-3" />{errors.name.message}</p>
              : <p className="text-xs text-gray-400">Used in trip assignments and reports.</p>
            }
          </div>

          <div className="space-y-2.5 flex-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {vehicleTypes.map((t) => {
                const Icon = TYPE_ICONS[t.value]
                const selected = selectedType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setValue("type", t.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-xl border text-center transition-all select-none",
                      selected
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/40"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", selected ? "text-white" : "text-gray-400")} strokeWidth={1.75} />
                    <span className="text-[10px] font-semibold leading-tight">{t.short}</span>
                  </button>
                )
              })}
            </div>
            {errors.type && <p className="text-xs text-red-500 flex items-center gap-1"><Info className="w-3 h-3" />Please select a type.</p>}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Photos</label>
              <span className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                totalPhotos === MAX_PHOTOS ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
              )}>
                {totalPhotos}/{MAX_PHOTOS}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {photos.map((item, idx) => {
                const src = item.kind === "kept" ? item.url : item.preview
                const isNew = item.kind === "new"
                return (
                  <div
                    key={`photo-${idx}`}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-grab active:cursor-grabbing select-none ring-1",
                      isNew ? "ring-blue-300" : "ring-gray-200"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full pointer-events-none tracking-wide">
                        COVER
                      </span>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center cursor-grab">
                        <GripVertical className="w-3 h-3" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {canAddMore && Array.from({ length: MAX_PHOTOS - totalPhotos }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  onClick={i === 0 ? () => fileInputRef.current?.click() : undefined}
                  onDragOver={i === 0 ? (e) => { e.preventDefault(); setIsDropZoneDragging(true) } : undefined}
                  onDragLeave={i === 0 ? () => setIsDropZoneDragging(false) : undefined}
                  onDrop={i === 0 ? onDrop : undefined}
                  className={cn(
                    "aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all",
                    i === 0
                      ? isDropZoneDragging
                        ? "border-blue-400 bg-blue-50 cursor-pointer"
                        : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"
                      : "border-gray-100 bg-gray-50/40 cursor-default"
                  )}
                >
                  {i === 0 && (
                    <>
                      {isDropZoneDragging
                        ? <Upload className="w-4 h-4 text-blue-400" />
                        : <ImagePlus className="w-4 h-4 text-gray-300" />
                      }
                      <span className="text-[10px] text-gray-400 font-medium">
                        {totalPhotos === 0 ? "Add photo" : "Add"}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {uploadError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />{uploadError}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
          </div>
        </div>

        {/* RIGHT: Specs + Operations */}
        <div className="flex flex-col gap-5">

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Specifications</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-500">Year</Label>
                <Input {...register("year", { valueAsNumber: true })} type="number" placeholder="2024" className="h-10 bg-white border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-500">Make</Label>
                <Input {...register("make")} placeholder="Mercedes" className="h-10 bg-white border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-500">Model</Label>
                <Input {...register("model")} placeholder="Sprinter" className="h-10 bg-white border-gray-200 rounded-lg text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-500">Capacity <span className="text-red-400">*</span></Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <Input
                    {...register("capacity", { valueAsNumber: true })}
                    type="number" min={1} placeholder="0"
                    className={cn("h-10 pl-8 bg-white border-gray-200 rounded-lg text-sm", errors.capacity && "border-red-400")}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium text-gray-500">Color</Label>
                <div className="relative">
                  <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <Input {...register("color")} placeholder="Black" className="h-10 pl-8 bg-white border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Operations</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-medium text-gray-500">License Plate</Label>
              <Input
                {...register("licensePlate")}
                placeholder="ABC-1234"
                className="h-10 bg-white border-gray-200 rounded-lg text-sm uppercase tracking-widest font-medium"
              />
            </div>

            {"status" in defaultValues && (
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-gray-500">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {STATUS_OPTIONS.map((s) => {
                    const selected = selectedStatus === s.value
                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setValue("status", s.value)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all",
                          selected ? "border-transparent text-white shadow-sm" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                        )}
                        style={selected ? {
                          backgroundColor: s.value === "ACTIVE" ? "#059669" : s.value === "MAINTENANCE" ? "#d97706" : "#dc2626"
                        } : {}}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", selected ? "bg-white/80" : STATUS_DOT[s.value ?? ""])} />
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {saveError && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />{saveError}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending || isUploading}
              className="flex-1 h-11 text-white font-semibold text-sm rounded-xl shadow-sm shadow-blue-200 transition-all hover:shadow-md"
              style={{ backgroundColor: "#2563EB" }}
            >
              {isUploading ? "Uploading…" : isPending ? "Saving…" : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-11 px-5 rounded-xl text-sm font-medium text-gray-600"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VehiclesPage() {
  const [showAdd, setShowAdd]         = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [filter, setFilter]           = useState<"ALL" | "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE">("ALL")
  const [typeFilter, setTypeFilter]   = useState<VehicleFormData["type"] | "ALL">("ALL")

  const { data: vehicles, isLoading } = useVehicles()
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()

  function handleCreate(data: VehicleFormData, photos: string[], onError: (msg: string) => void) {
    createVehicle.mutate({ ...data, photos } as never, {
      onSuccess: () => setShowAdd(false),
      onError: (err) => onError(err instanceof Error ? err.message : "Failed to save vehicle"),
    })
  }

  function handleUpdate(data: VehicleFormData, photos: string[], onError: (msg: string) => void) {
    if (!editVehicle) return
    updateVehicle.mutate({ id: editVehicle.id, ...data, photos } as never, {
      onSuccess: () => setEditVehicle(null),
      onError: (err) => onError(err instanceof Error ? err.message : "Failed to save vehicle"),
    })
  }

  const totalCount       = vehicles?.length ?? 0
  const activeCount      = vehicles?.filter(v => v.status === "ACTIVE").length ?? 0
  const maintenanceCount = vehicles?.filter(v => v.status === "MAINTENANCE").length ?? 0
  const offlineCount     = vehicles?.filter(v => v.status === "OUT_OF_SERVICE").length ?? 0
  const filtered         = vehicles
    ?.filter(v => filter === "ALL" || v.status === filter)
    .filter(v => typeFilter === "ALL" || v.type === typeFilter)

  const typesInFleet = vehicles
    ? [...new Set(vehicles.map(v => v.type as VehicleFormData["type"]))]
    : []

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
            {/* Top row */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-[13px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.20)" }}
                >
                  <Car className="w-[17px] h-[17px]" style={{ color: "#c9a87c" }} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p style={{
                    fontSize: "0.6rem", fontWeight: 500, letterSpacing: "0.18em",
                    textTransform: "uppercase", color: "#c9a87c",
                    fontFamily: "var(--font-outfit, system-ui)", marginBottom: "3px",
                  }}>
                    Fleet
                  </p>
                  <p className="leading-tight" style={{ fontSize: "13px", fontWeight: 600, color: "var(--lc-text-primary)", letterSpacing: "-0.01em" }}>
                    {isLoading ? "Loading…" : totalCount === 0 ? "No vehicles yet" : `${totalCount} vehicle${totalCount !== 1 ? "s" : ""} in your fleet`}
                  </p>
                </div>
              </div>

              {/* Stat pills */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {[
                  { label: "Total",       value: totalCount,       bg: "rgba(201,168,124,0.10)", color: "rgba(201,168,124,0.90)", dot: "#c9a87c" },
                  { label: "Active",      value: activeCount,      bg: "rgba(52,211,153,0.10)",  color: "rgba(52,211,153,0.90)",  dot: "#34d399" },
                  { label: "Maintenance", value: maintenanceCount, bg: "rgba(251,191,36,0.10)",  color: "rgba(251,191,36,0.90)",  dot: "#fbbf24" },
                  { label: "Offline",     value: offlineCount,     bg: "rgba(248,113,113,0.10)", color: "rgba(248,113,113,0.90)", dot: "#f87171" },
                ].map(s => (
                  <div
                    key={s.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
                    style={{ background: s.bg, color: s.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                    <span className="tabular-nums">{s.value}</span>
                    <span className="font-medium" style={{ opacity: 0.7 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mx-5" style={{ background: "var(--lc-bg-glass)" }} />

            {/* Controls row */}
            <div className="flex items-center gap-2.5 px-5 py-3.5 flex-wrap">

              {/* Status filter tabs */}
              <div
                className="flex items-center gap-0.5 rounded-[11px] p-1"
                style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)" }}
              >
                {FILTERS.map(({ key, label }) => {
                  const count =
                    key === "ALL"         ? totalCount :
                    key === "ACTIVE"      ? activeCount :
                    key === "MAINTENANCE" ? maintenanceCount :
                    offlineCount
                  if (key !== "ALL" && count === 0) return null
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key as typeof filter)}
                      className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer"
                      style={filter === key
                        ? { background: "var(--lc-border)", color: "var(--lc-text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }
                        : { color: "var(--lc-text-dim)" }
                      }
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Type filter */}
              {typesInFleet.length > 1 && (
                <div className="relative">
                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                    className="appearance-none h-9 pl-3 pr-7 rounded-xl text-xs font-semibold cursor-pointer transition-all outline-none"
                    style={
                      typeFilter !== "ALL"
                        ? { background: "rgba(201,168,124,0.18)", border: "1px solid rgba(201,168,124,0.35)", color: "#c9a87c" }
                        : { background: "var(--lc-bg-glass)", border: "1px solid var(--lc-bg-glass-hover)", color: "var(--lc-text-secondary)" }
                    }
                  >
                    <option value="ALL">All types</option>
                    {typesInFleet.map(type => (
                      <option key={type} value={type}>
                        {vehicleTypes.find(t => t.value === type)?.label ?? type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
                    style={{ color: typeFilter !== "ALL" ? "#c9a87c" : "var(--lc-text-label)" }}
                  />
                </div>
              )}

              <div className="flex-1" />

              {/* Add Vehicle CTA */}
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold transition-all duration-150 active:scale-95 select-none cursor-pointer"
                style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Add Vehicle</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* ── Gallery Grid ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !vehicles?.length ? (
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: "rgba(201,168,124,0.10)", border: "1px solid rgba(201,168,124,0.18)" }}
              >
                <Car className="w-9 h-9" style={{ color: "rgba(201,168,124,0.50)" }} />
              </div>
              <h3 className="text-lg font-bold tracking-tight" style={{ color: "var(--lc-text-primary)" }}>
                No vehicles yet
              </h3>
              <p className="text-sm mt-1.5 mb-6 max-w-xs leading-relaxed" style={{ color: "var(--lc-text-label)" }}>
                Add your first vehicle to start assigning trips and managing your fleet.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-5 h-10 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-95 cursor-pointer"
                style={{ background: "#c9a87c", color: "var(--lc-bg-page)", boxShadow: "0 2px 12px rgba(201,168,124,0.28)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#d4b98c" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#c9a87c" }}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                Add your first vehicle
              </button>
            </div>
          ) : !filtered?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-sm" style={{ color: "var(--lc-text-label)" }}>
                No vehicles match this filter.
              </p>
              <button
                onClick={() => { setFilter("ALL"); setTypeFilter("ALL") }}
                className="text-sm mt-1.5 font-medium transition-colors cursor-pointer"
                style={{ color: "#c9a87c" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.75" }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1" }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={() => setEditVehicle(vehicle)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Add Vehicle Dialog ── */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) setShowAdd(false) }}>
        <DialogContent className="sm:max-w-[960px] max-h-[92vh] overflow-y-auto p-7">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Add New Vehicle</DialogTitle>
            <p className="text-sm text-gray-400 mt-0.5">Fill in the details below to add a vehicle to your fleet.</p>
          </DialogHeader>
          <VehicleForm
            defaultValues={{ status: "ACTIVE" }}
            onSubmit={handleCreate}
            onCancel={() => setShowAdd(false)}
            isPending={createVehicle.isPending}
            submitLabel="Add Vehicle"
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Vehicle Dialog ── */}
      <Dialog open={!!editVehicle} onOpenChange={(open) => { if (!open) setEditVehicle(null) }}>
        <DialogContent className="sm:max-w-[960px] max-h-[92vh] overflow-y-auto p-7">
          {editVehicle && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between pr-8">
                  <div>
                    <DialogTitle className="text-lg font-semibold">Edit Vehicle</DialogTitle>
                    <p className="text-sm text-gray-500 mt-0.5">{editVehicle.name}</p>
                  </div>
                </div>
              </DialogHeader>
              <VehicleForm
                defaultValues={{
                  name:         editVehicle.name,
                  type:         editVehicle.type,
                  capacity:     editVehicle.capacity,
                  licensePlate: editVehicle.licensePlate ?? undefined,
                  color:        editVehicle.color        ?? undefined,
                  year:         editVehicle.year         ?? undefined,
                  make:         editVehicle.make         ?? undefined,
                  model:        editVehicle.model        ?? undefined,
                  status:       editVehicle.status,
                }}
                existingPhotos={editVehicle.photos ?? []}
                onSubmit={handleUpdate}
                onCancel={() => setEditVehicle(null)}
                isPending={updateVehicle.isPending}
                submitLabel="Save Changes"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
