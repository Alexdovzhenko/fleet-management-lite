"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, Car, Users, Camera, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useVehicles, useCreateVehicle } from "@/lib/hooks/use-vehicles"
import { getVehicleTypeLabel } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const MAX_PHOTOS = 3

const vehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required"),
  type: z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]),
  capacity: z.number().int().min(1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
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

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/vehicles/upload-photo", { method: "POST", body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || "Upload failed")
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

export default function VehiclesPage() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "MAINTENANCE" | "OUT_OF_SERVICE">("ALL")
  const { data: vehicles, isLoading } = useVehicles()
  const createVehicle = useCreateVehicle()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as never,
    defaultValues: { type: "SPRINTER", capacity: 14 },
  })

  const selectedType = watch("type")

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: File[]) {
    const remaining = MAX_PHOTOS - imageFiles.length
    const allowed = files.filter(f => f.type.startsWith("image/")).slice(0, remaining)
    if (!allowed.length) return
    setImageFiles(prev => [...prev, ...allowed])
    setPreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))])
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setImageFiles(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }, [imageFiles]) // eslint-disable-line

  function closeForm() {
    setShowForm(false)
    reset()
    previews.forEach(p => URL.revokeObjectURL(p))
    setImageFiles([])
    setPreviews([])
    setUploadError("")
  }

  async function handleCreate(data: VehicleFormData) {
    setUploadError("")
    let photos: string[] = []
    if (imageFiles.length) {
      try {
        photos = await Promise.all(imageFiles.map(uploadPhoto))
      } catch {
        setUploadError("Image upload failed — vehicle not saved. Try again.")
        return
      }
    }
    createVehicle.mutate({ ...data, photos } as never, { onSuccess: closeForm })
  }

  const canAddMore = imageFiles.length < MAX_PHOTOS

  const totalCount      = vehicles?.length ?? 0
  const activeCount     = vehicles?.filter(v => v.status === "ACTIVE").length ?? 0
  const maintenanceCount = vehicles?.filter(v => v.status === "MAINTENANCE").length ?? 0
  const offlineCount    = vehicles?.filter(v => v.status === "OUT_OF_SERVICE").length ?? 0

  const filtered = filter === "ALL" ? vehicles : vehicles?.filter(v => v.status === filter)

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
          onClick={() => setShowForm(true)}
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
                <span className={cn("ml-1.5 text-xs", filter === key ? "text-gray-400" : "text-gray-400")}>
                  {count}
                </span>
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
        /* Empty state — no vehicles at all */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900">No vehicles yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5 max-w-xs">
            Add your first vehicle to start assigning trips and tracking your fleet.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="text-white gap-2"
            style={{ backgroundColor: "#2563EB" }}
          >
            <Plus className="w-4 h-4" />
            Add your first vehicle
          </Button>
        </div>
      ) : !filtered?.length ? (
        /* Empty state — filter returns nothing */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm text-gray-500">No vehicles with this status.</p>
          <button onClick={() => setFilter("ALL")} className="text-sm text-blue-600 hover:underline mt-1">
            View all vehicles
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((vehicle) => {
            const photos = (vehicle as { photos?: string[] }).photos ?? []
            const thumb = photos[0] || (vehicle as { photoUrl?: string }).photoUrl
            const status = vehicle.status as StatusKey
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE
            const subtitle = [vehicle.year, vehicle.make, vehicle.model || getVehicleTypeLabel(vehicle.type)]
              .filter(Boolean).join(" ")

            return (
              <div
                key={vehicle.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* ── Image Hero ── */}
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt={vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <Car className="w-10 h-10 text-gray-300" />
                      <span className="text-xs text-gray-400 font-medium">No photo</span>
                    </div>
                  )}

                  {/* Dark gradient at bottom so text reads cleanly */}
                  {thumb && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  )}

                  {/* Status — top right, frosted glass */}
                  <div className="absolute top-3 right-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
                      cfg.badge
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Photo count — top left (only when multiple) */}
                  {photos.length > 1 && (
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white">
                        <Camera className="w-3 h-3" />
                        {photos.length}
                      </span>
                    </div>
                  )}

                  {/* Vehicle name + subtitle overlaid on gradient */}
                  {thumb && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-semibold text-[15px] leading-snug">{vehicle.name}</h3>
                      {subtitle && (
                        <p className="text-white/60 text-xs mt-0.5">{subtitle}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Card Body ── */}
                <div className="px-4 py-3.5">
                  {/* Name row when there is no image */}
                  {!thumb && (
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug">{vehicle.name}</h3>
                      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Capacity chip */}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
                      <Users className="w-3 h-3 text-gray-400" />
                      {vehicle.capacity} pax
                    </span>

                    {/* License plate chip */}
                    {vehicle.licensePlate && (
                      <span className="inline-flex items-center text-xs font-mono font-medium text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full tracking-wider">
                        {vehicle.licensePlate}
                      </span>
                    )}

                    {/* Color */}
                    {vehicle.color && (
                      <span className="text-xs text-gray-400">
                        {vehicle.color}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add Vehicle Dialog ── */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) closeForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Vehicle</DialogTitle>
            <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to add a vehicle to your fleet.</p>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreate)} className="space-y-5 mt-1">

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

            {/* Photo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Photos</Label>
                <span className="text-xs text-gray-400">{imageFiles.length}/{MAX_PHOTOS} added</span>
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
                      {isDragging ? "Drop to add" : imageFiles.length === 0 ? "Add photos" : "Add more"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {MAX_PHOTOS - imageFiles.length} remaining · JPG, PNG, WEBP
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

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={createVehicle.isPending}
                className="flex-1 h-10 text-white font-medium"
                style={{ backgroundColor: "#2563EB" }}
              >
                {createVehicle.isPending ? "Saving…" : "Add Vehicle"}
              </Button>
              <Button type="button" variant="outline" onClick={closeForm} className="h-10 px-5">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
