"use client"

import { useState } from "react"
import { Plus, Car, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useVehicles, useCreateVehicle } from "@/lib/hooks/use-vehicles"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { getVehicleTypeLabel } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const vehicleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["SEDAN", "SUV", "STRETCH_LIMO", "SPRINTER", "PARTY_BUS", "COACH", "OTHER"]),
  capacity: z.number().int().min(1),
  licensePlate: z.string().optional(),
  color: z.string().optional(),
  year: z.number().int().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  OUT_OF_SERVICE: "bg-red-100 text-red-700",
}

const vehicleTypes = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "STRETCH_LIMO", label: "Stretch Limo" },
  { value: "SPRINTER", label: "Sprinter Van" },
  { value: "PARTY_BUS", label: "Party Bus" },
  { value: "COACH", label: "Coach Bus" },
  { value: "OTHER", label: "Other" },
]

export default function VehiclesPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: vehicles, isLoading } = useVehicles()
  const createVehicle = useCreateVehicle()

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { type: "SPRINTER", capacity: 14 },
  })

  function handleCreate(data: VehicleFormData) {
    createVehicle.mutate(data as never, {
      onSuccess: () => {
        setShowForm(false)
        reset()
      },
    })
  }

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
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{vehicle.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {vehicle.year && `${vehicle.year} `}
                    {vehicle.make && `${vehicle.make} `}
                    {vehicle.model || getVehicleTypeLabel(vehicle.type)}
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0",
                    statusColors[vehicle.status]
                  )}
                >
                  {vehicle.status === "OUT_OF_SERVICE" ? "Out of Service" : vehicle.status.charAt(0) + vehicle.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
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
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vehicle Name *</Label>
              <Input {...register("name")} placeholder='Black Sprinter 1' />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select defaultValue="SPRINTER" onValueChange={(v) => { if (typeof v === "string") setValue("type", v as VehicleFormData["type"]) }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Capacity *</Label>
                <Input {...register("capacity", { valueAsNumber: true })} type="number" min={1} placeholder="14" />
                {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>License Plate</Label>
                <Input {...register("licensePlate")} placeholder="ABC-1234" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <Input {...register("color")} placeholder="Black" />
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input {...register("year", { valueAsNumber: true })} type="number" placeholder="2023" />
              </div>
              <div className="space-y-1.5">
                <Label>Make</Label>
                <Input {...register("make")} placeholder="Mercedes" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createVehicle.isPending}
                className="flex-1 text-white"
                style={{ backgroundColor: "#2563EB" }}
              >
                {createVehicle.isPending ? "Saving..." : "Add Vehicle"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
