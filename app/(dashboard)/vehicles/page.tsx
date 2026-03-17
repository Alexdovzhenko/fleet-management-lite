"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, Car, Users, Camera, X, Upload, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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

const STATUS_CONFIG = {
  ACTIVE:         { label: "Active",      dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/30" },
  MAINTENANCE:    { label: "Maintenance", dot: "bg-amber-400",   badge: "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/30" },
  OUT_OF_SERVICE: { label: "Offline",     dot: "bg-red-400",     badge: "bg-red-500/20 text-red-100 ring-1 ring-red-400/30" },
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
  const res = await fetch("/api/vehicles/upload-photo", { method: "POST", body: fd })
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
            "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
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
    defaultValues: { type: "SPRINTER", capacity: 14, status: "ACTIVE", ...defaultValues },
  })

  const selectedType = watch("type")
  const selectedStatus = watch("status")

  // New files to upload
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  // Existing photo URLs (can be removed)
  const [keptPhotos, setKeptPhotos] = useState<string[]>(existingPhotos)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalPhotos = keptPhotos.length + imageFiles.length
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
    setImageFiles(prev => [...prev, ...allowed])
    setNewPreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))])
  }

  function removeNewImage(idx: number) {
    URL.revokeObjectURL(newPreviews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setNewPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  function removeKeptPhoto(idx: number) {
    setKeptPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [totalPhotos]) // eslint-disable-line

  async function handleFormSubmit(data: VehicleFormData) {
    setUploadError("")
    setIsUploading(true)
    let uploadedUrls: string[] = []
    try {
      if (imageFiles.length) {
        uploadedUrls = await Promise.all(imageFiles.map(uploadPhoto))
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.")
      setIsUploading(false)
      return
    }
    setIsUploading(false)
    const allPhotos = [...keptPhotos, ...uploadedUrls]
    setSaveError("")
    onSubmit(data, allPhotos, (msg) => setSaveError(msg))
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, (errs) => {
        const fields = Object.keys(errs).join(", ")
        setSaveError(`Validation failed on: ${fields}`)
      })}
      className="space-y-5 mt-1"
    >

      {/* Vehicle Name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Vehicle Name *</Label>
        <Input
          {...register("name")}
          placeholder="e.g. Black Sprinter 1"
          className={cn("h-10", errors.name && "border-red-400")}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Vehicle Type */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Type *</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {vehicleTypes.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue("type", t.value)}
              className={cn(
                "h-9 rounded-lg text-xs font-medium border transition-all",
                selectedType === t.value
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
              )}
            >
              {t.short}
            </button>
          ))}
        </div>
      </div>

      {/* Status (edit only — present when defaultValues.status is set) */}
      {"status" in defaultValues && (
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</Label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setValue("status", s.value)}
                className={cn(
                  "flex-1 h-9 rounded-lg text-xs font-medium border transition-all",
                  selectedStatus === s.value
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Capacity + Color */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Capacity *</Label>
          <Input
            {...register("capacity", { valueAsNumber: true })}
            type="number" min={1}
            className={cn("h-10", errors.capacity && "border-red-400")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Color</Label>
          <Input {...register("color")} placeholder="Black" className="h-10" />
        </div>
      </div>

      {/* Year + Make */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Year</Label>
          <Input {...register("year", { valueAsNumber: true })} type="number" placeholder="2023" className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Make</Label>
          <Input {...register("make")} placeholder="Mercedes" className="h-10" />
        </div>
      </div>

      {/* License Plate */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">License Plate</Label>
        <Input {...register("licensePlate")} placeholder="ABC-1234" className="h-10 uppercase" />
      </div>

      <div className="border-t border-gray-100" />

      {/* Photos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Photos</Label>
          <span className="text-xs text-gray-400">{totalPhotos}/{MAX_PHOTOS} added</span>
        </div>

        {/* Existing photos */}
        {(keptPhotos.length > 0 || newPreviews.length > 0) && (
          <div className="grid grid-cols-3 gap-2">
            {keptPhotos.map((src, idx) => (
              <div key={`kept-${idx}`} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeKeptPhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {newPreviews.map((src, idx) => (
              <div key={`new-${idx}`} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-blue-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`New photo ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        {canAddMore && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer transition-all py-6",
              isDragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
              isDragging ? "bg-blue-100" : "bg-white border border-gray-200"
            )}>
              {isDragging
                ? <Upload className="w-4 h-4 text-blue-500" />
                : <Camera className="w-4 h-4 text-gray-400" />
              }
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? "Drop to add" : totalPhotos === 0 ? "Add photos" : "Add more"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {MAX_PHOTOS - totalPhotos} remaining · JPG, PNG, WEBP · max 5 MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
          </div>
        )}

        {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
      </div>

      {saveError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          disabled={isPending || isUploading}
          className="flex-1 h-10 text-white font-medium"
          style={{ backgroundColor: "#2563EB" }}
        >
          {isUploading ? "Uploading…" : isPending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-5">
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function VehiclesPage() {
  const [showAdd, setShowAdd]         = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)
  const [filter, setFilter]           = useState<"ALL" | "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE">("ALL")

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
  const filtered         = filter === "ALL" ? vehicles : vehicles?.filter(v => v.status === filter)

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fleet</h1>
          {!isLoading && totalCount > 0 && (
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span>{totalCount} vehicle{totalCount !== 1 ? "s" : ""}</span>
              {activeCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {activeCount} active
                </span>
              )}
              {maintenanceCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {maintenanceCount} in maintenance
                </span>
              )}
              {offlineCount > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {offlineCount} offline
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          className="text-white gap-2 shrink-0"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* ── Filter Tabs ── */}
      {!isLoading && totalCount > 0 && (
        <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1 w-fit">
          {FILTERS.map(({ key, label }) => {
            const count =
              key === "ALL"            ? totalCount :
              key === "ACTIVE"         ? activeCount :
              key === "MAINTENANCE"    ? maintenanceCount :
              offlineCount
            if (key !== "ALL" && count === 0) return null
            return (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filter === key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {label}
                <span className="ml-1.5 text-xs text-gray-400">{count}</span>
              </button>
            )
          })}
        </div>
      )}

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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Vehicle</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to add a vehicle to your fleet.</p>
          </DialogHeader>
          <VehicleForm
            defaultValues={{ type: "SPRINTER", capacity: 14 }}
            onSubmit={handleCreate}
            onCancel={() => setShowAdd(false)}
            isPending={createVehicle.isPending}
            submitLabel="Add Vehicle"
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit Vehicle Dialog ── */}
      <Dialog open={!!editVehicle} onOpenChange={(open) => { if (!open) setEditVehicle(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
