"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, Car, Users, Camera, X, Upload, Trash2, ChevronLeft, ChevronRight, Truck, Bus, CarFront, CircleDot, GripVertical, ImagePlus, Tag, Gauge, Palette, Info, ChevronDown, Pencil, Maximize2 } from "lucide-react"
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
  ACTIVE:         { label: "Active",      dot: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-600 text-white shadow-sm" },
  MAINTENANCE:    { label: "Maintenance", dot: "bg-amber-400",   text: "text-amber-600",   badge: "bg-amber-500 text-white shadow-sm" },
  OUT_OF_SERVICE: { label: "Offline",     dot: "bg-red-500",     text: "text-red-600",     badge: "bg-red-600 text-white shadow-sm" },
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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

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
    <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-black/5 shadow-sm animate-pulse">
      <div className="aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200" />
      <div className="px-5 pt-4 pb-5 space-y-3">
        <div>
          <div className="h-5 bg-gray-200 rounded-full w-2/3" />
          <div className="h-3.5 bg-gray-100 rounded-full w-1/2 mt-2" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <div className="h-7 bg-gray-100 rounded-xl w-16" />
            <div className="h-7 bg-gray-100 rounded-xl w-20" />
          </div>
          <div className="h-9 bg-gray-100 rounded-xl w-16" />
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
      <div className="group bg-white rounded-3xl overflow-hidden ring-1 ring-black/[0.06] shadow-md hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1 transition-all duration-300 ease-out">

        {/* ── Image Hero ── */}
        <div
          className={cn(
            "relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200",
            thumb && "cursor-zoom-in"
          )}
          onClick={() => thumb && setLightbox(true)}
        >
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={thumb}
              src={thumb}
              alt={vehicle.name}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-200/80 flex items-center justify-center">
                <Car className="w-7 h-7 text-gray-400" />
              </div>
              <span className="text-xs text-gray-400 font-medium tracking-wide">No photo added</span>
            </div>
          )}

          {/* Bottom gradient */}
          {thumb && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent pointer-events-none" />
          )}

          {/* Top gradient for badge legibility */}
          {thumb && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-transparent pointer-events-none" />
          )}

          {/* Glass status badge — top right */}
          <div className="absolute top-3.5 right-3.5" onClick={e => e.stopPropagation()}>
            <span className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full",
              "bg-white/90 shadow-sm backdrop-blur-md",
              cfg.text
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Expand hint — top left on hover */}
          {thumb && (
            <div className="absolute top-3.5 left-3.5 w-8 h-8 rounded-xl bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Photo nav dots — bottom center */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-1.5 pointer-events-none">
              {photos.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    i === idx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/45"
                  )}
                />
              ))}
            </div>
          )}

          {/* Prev / Next arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/55"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/35 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/55"
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
              <h3 className="text-[15px] font-bold text-gray-900 leading-snug tracking-tight">{vehicle.name}</h3>
              {subtitle && <p className="text-[13px] text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
            </div>
          )}

          {/* Specs row + Edit */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">

              {/* Capacity */}
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-xl">
                <Users className="w-3 h-3 text-gray-400" />
                {vehicle.capacity} pax
              </span>

              {/* License plate */}
              {vehicle.licensePlate && (
                <span className="inline-flex items-center text-[11px] font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-xl tracking-widest uppercase">
                  {vehicle.licensePlate}
                </span>
              )}

              {/* Color */}
              {vehicle.color && (
                <span className="text-[12px] text-gray-400 font-medium">{vehicle.color}</span>
              )}
            </div>

            {/* Edit button */}
            <button
              onClick={onEdit}
              className="flex-shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-blue-600 hover:text-white transition-all duration-200"
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
    <div className="space-y-4">

      {/* ── Header card ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">

        {/* Top row: icon + title + stat boxes */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-5">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", boxShadow: "0 4px 12px rgba(37,99,235,0.20)" }}
            >
              <Car className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-gray-900 leading-tight">Fleet</h1>
              <p className="text-[12px] text-gray-400 mt-0.5 leading-tight">
                {isLoading ? "Loading..." : totalCount === 0 ? "No vehicles yet" : `${totalCount} vehicle${totalCount !== 1 ? "s" : ""} in your fleet`}
              </p>
            </div>
          </div>

          <div className="flex items-stretch divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 overflow-hidden shrink-0">
            {([
              { label: "Total",       value: totalCount,       dot: "bg-blue-500" },
              { label: "Active",      value: activeCount,      dot: "bg-emerald-500" },
              { label: "Maintenance", value: maintenanceCount, dot: "bg-amber-400" },
              { label: "Offline",     value: offlineCount,     dot: "bg-red-500" },
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

        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent mx-6" />

        {/* Bottom row: filters + CTA */}
        <div className="flex items-center gap-3 px-6 py-4">

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
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
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 whitespace-nowrap",
                    filter === key
                      ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                      : "text-gray-400 hover:text-gray-600"
                  )}
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
                className={cn(
                  "appearance-none h-9 pl-3 pr-7 rounded-xl border text-xs font-semibold cursor-pointer transition-all outline-none",
                  typeFilter !== "ALL"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200"
                )}
              >
                <option value="ALL">All types</option>
                {typesInFleet.map(type => (
                  <option key={type} value={type}>
                    {vehicleTypes.find(t => t.value === type)?.label ?? type}
                  </option>
                ))}
              </select>
              <ChevronDown className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none",
                typeFilter !== "ALL" ? "text-white/80" : "text-gray-400"
              )} />
            </div>
          )}

          <div className="flex-1" />

          <Button
            onClick={() => setShowAdd(true)}
            className="h-9 text-sm font-semibold text-white gap-1.5 px-4"
            style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}
          >
            <Plus className="w-4 h-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* ── Gallery Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !vehicles?.length ? (
        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-5 shadow-sm">
            <Car className="w-9 h-9 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">No vehicles yet</h3>
          <p className="text-sm text-gray-500 mt-1.5 mb-6 max-w-xs leading-relaxed">
            Add your first vehicle to start assigning trips and managing your fleet.
          </p>
          <Button
            onClick={() => setShowAdd(true)}
            className="text-white gap-2 px-5 h-10 rounded-xl font-semibold"
            style={{ backgroundColor: "#2563EB" }}
          >
            <Plus className="w-4 h-4" />
            Add your first vehicle
          </Button>
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-gray-500">No vehicles match this filter.</p>
          <button
            onClick={() => { setFilter("ALL"); setTypeFilter("ALL") }}
            className="text-sm text-blue-600 hover:underline mt-1.5 font-medium"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => setEditVehicle(vehicle)}
            />
          ))}
        </div>
      )}

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
    </div>
  )
}
