"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, Car, Users, Camera, X, Upload, Trash2, ChevronLeft, ChevronRight, Truck, Bus, CarFront, CircleDot, GripVertical, ImagePlus, Tag, Gauge, Palette, Info, ChevronDown } from "lucide-react"
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
  ACTIVE:         { label: "Active",      dot: "bg-emerald-400", badge: "bg-emerald-600 text-white shadow-sm" },
  MAINTENANCE:    { label: "Maintenance", dot: "bg-amber-400",   badge: "bg-amber-500 text-white shadow-sm" },
  OUT_OF_SERVICE: { label: "Offline",     dot: "bg-red-500",     badge: "bg-red-600 text-white shadow-sm" },
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

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="h-56 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

// ── Vehicle Card with photo carousel ────────────────────────────────────────
function VehicleCard({ vehicle, onEdit }: { vehicle: Vehicle; onEdit: () => void }) {
  const photos = vehicle.photos?.length ? vehicle.photos : vehicle.photoUrl ? [vehicle.photoUrl] : []
  const [idx, setIdx] = useState(0)
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
    <div
      onClick={onEdit}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      {/* Image Hero */}
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={thumb}
            src={thumb}
            alt={vehicle.name}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Car className="w-10 h-10 text-gray-300" />
            <span className="text-xs text-gray-400 font-medium">No photo</span>
          </div>
        )}

        {thumb && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
            cfg.badge
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        </div>

        {/* Dot indicators (multiple photos) */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {photos.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === idx ? "bg-white scale-110" : "bg-white/50"
                )}
              />
            ))}
          </div>
        )}

        {/* Prev / Next arrows — visible on hover when multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Vehicle name overlay */}
        {thumb && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-[15px] leading-snug">{vehicle.name}</h3>
            {subtitle && <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-4 py-3.5">
        {!thumb && (
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{vehicle.name}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
            <Users className="w-3 h-3 text-gray-400" />
            {vehicle.capacity} pax
          </span>
          {vehicle.licensePlate && (
            <span className="inline-flex items-center text-xs font-mono font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full tracking-wider">
              {vehicle.licensePlate}
            </span>
          )}
          {vehicle.color && (
            <span className="text-xs text-gray-400">{vehicle.color}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared form used for both Add and Edit ──────────────────────────────────
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

  // Unified ordered photo list for drag-and-drop reordering
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
      // Failsafe: always unblock the button even if something unexpected throws
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
      {/* ── Two-column layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-[5fr_6fr] gap-7">

        {/* ── LEFT: Identity + Type ──────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Vehicle Name */}
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

          {/* Vehicle Type */}
          <div className="space-y-2.5 flex-1">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Vehicle Type <span className="text-red-400">*</span>
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

          {/* Photos */}
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

            {/* Photo slots */}
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

              {/* Add slot(s) */}
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

        {/* ── RIGHT: Specs + Operations ──────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Specifications */}
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

          {/* Operations */}
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

          {/* Spacer + Actions flush to bottom */}
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

// ── Main Page ───────────────────────────────────────────────────────────────
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
    <div className="space-y-6">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4">

        {/* Left: title + stat pills */}
        <div className="flex items-center gap-4 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 shrink-0">Fleet</h1>

          {!isLoading && totalCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {totalCount} total
              </span>
              {activeCount > 0 && (
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {activeCount} active
                </span>
              )}
              {maintenanceCount > 0 && (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {maintenanceCount} maintenance
                </span>
              )}
              {offlineCount > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {offlineCount} offline
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: filters + CTA */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Status segmented control */}
          {!isLoading && totalCount > 0 && (
            <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5">
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
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                      filter === key
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                    )}
                  >
                    {label}
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                      filter === key ? "bg-gray-100 text-gray-600" : "text-gray-400"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Type dropdown */}
          {!isLoading && typesInFleet.length > 1 && (
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                className={cn(
                  "appearance-none h-8 pl-3 pr-7 rounded-lg border text-xs font-semibold cursor-pointer transition-all outline-none",
                  typeFilter !== "ALL"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
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

          {/* Divider */}
          {!isLoading && totalCount > 0 && (
            <div className="w-px h-5 bg-gray-200" />
          )}

          <Button
            onClick={() => setShowAdd(true)}
            className="h-8 text-white text-xs font-semibold gap-1.5 px-3.5 rounded-lg shrink-0"
            style={{ backgroundColor: "#2563EB" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !vehicles?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No vehicles yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5 max-w-xs">
            Add your first vehicle to start assigning trips and tracking your fleet.
          </p>
          <Button
            onClick={() => setShowAdd(true)}
            className="text-white gap-2"
            style={{ backgroundColor: "#2563EB" }}
          >
            <Plus className="w-4 h-4" />
            Add your first vehicle
          </Button>
        </div>
      ) : !filtered?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-gray-500">No vehicles with this status.</p>
          <button onClick={() => setFilter("ALL")} className="text-sm text-blue-600 hover:underline mt-1">
            View all vehicles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
