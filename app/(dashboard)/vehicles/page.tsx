"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, Car, Users, Camera, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useVehicles, useCreateVehicle } from "@/lib/hooks/use-vehicles"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
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
  capacity: z.number({ invalid_type_error: "Required" }).int().min(1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const statusColors: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  MAINTENANCE: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  OUT_OF_SERVICE: "bg-red-50 text-red-700 ring-1 ring-red-200",
}

const vehicleTypes: { value: VehicleFormData["type"]; label: string; short: string }[] = [
  { value: "SEDAN",       label: "Sedan",        short: "Sedan" },
  { value: "SUV",         label: "SUV",           short: "SUV" },
  { value: "STRETCH_LIMO",label: "Stretch Limo",  short: "Limo" },
  { value: "SPRINTER",    label: "Sprinter Van",  short: "Sprinter" },
  { value: "PARTY_BUS",   label: "Party Bus",     short: "Party Bus" },
  { value: "COACH",       label: "Coach Bus",     short: "Coach" },
  { value: "OTHER",       label: "Other",         short: "Other" },
]

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

export default function VehiclesPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: vehicles, isLoading } = useVehicles()
  const createVehicle = useCreateVehicle()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema) as never,
    defaultValues: { type: "SPRINTER", capacity: 14 },
  })

  const selectedType = watch("type")

  // Image state
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(files: File[]) {
    const remaining = MAX_PHOTOS - imageFiles.length
    const allowed = files.filter(f => f.type.startsWith("image/")).slice(0, remaining)
    if (!allowed.length) return
    const newPreviews = allowed.map(f => URL.createObjectURL(f))
    setImageFiles(prev => [...prev, ...allowed])
    setPreviews(prev => [...prev, ...newPreviews])
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
    createVehicle.mutate({ ...data, photos } as never, {
      onSuccess: closeForm,
    })
  }

  const canAddMore = imageFiles.length < MAX_PHOTOS

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{vehicles?.length || 0} vehicles</p>
        <Button
          onClick={() => setShowForm(true)}
          className="text-white gap-2"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : !vehicles?.length ? (
        <EmptyState
          icon={Car}
          title="No vehicles yet"
          description="Add your fleet vehicles to assign them to trips."
          actionLabel="Add Vehicle"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehicles.map((vehicle) => {
            const photos = (vehicle as { photos?: string[] }).photos
            const thumb = photos?.[0] || (vehicle as { photoUrl?: string }).photoUrl
            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl border overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {thumb ? (
                  <div className="h-32 bg-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb} alt={vehicle.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <Car className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{vehicle.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {vehicle.year && `${vehicle.year} `}
                        {vehicle.make && `${vehicle.make} `}
                        {vehicle.model || getVehicleTypeLabel(vehicle.type)}
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0", statusColors[vehicle.status])}>
                      {vehicle.status === "OUT_OF_SERVICE" ? "Offline" : vehicle.status.charAt(0) + vehicle.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {vehicle.capacity} pax
                    </span>
                    {vehicle.licensePlate && (
                      <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {vehicle.licensePlate}
                      </span>
                    )}
                    {vehicle.color && <span>{vehicle.color}</span>}
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

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Photo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Photos
                </Label>
                <span className="text-xs text-gray-400">{imageFiles.length}/{MAX_PHOTOS} added</span>
              </div>

              {/* Previews */}
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
                  {/* Empty slots */}
                  {canAddMore && Array.from({ length: MAX_PHOTOS - imageFiles.length - (canAddMore ? 0 : 0) }).slice(0, 0).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50" />
                  ))}
                </div>
              )}

              {/* Upload Zone */}
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
                    {isDragging ? (
                      <Upload className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Camera className="w-4 h-4 text-gray-400" />
                    )}
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

              {uploadError && (
                <p className="text-xs text-red-500">{uploadError}</p>
              )}
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
