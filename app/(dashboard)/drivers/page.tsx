"use client"

import { useState } from "react"
import { Plus, Phone, Car, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useDrivers, useCreateDriver } from "@/lib/hooks/use-drivers"
import { EmptyState } from "@/components/shared/empty-state"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { getInitials, formatPhone, getDriverStatusLabel } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { cn } from "@/lib/utils"

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  licenseNumber: z.string().optional(),
})

type DriverFormData = z.infer<typeof driverSchema>

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  ON_LEAVE: "bg-amber-100 text-amber-700",
}

export default function DriversPage() {
  const [showForm, setShowForm] = useState(false)
  const { data: drivers, isLoading } = useDrivers()
  const createDriver = useCreateDriver()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  })

  function handleCreate(data: DriverFormData) {
    createDriver.mutate(data as never, {
      onSuccess: () => {
        setShowForm(false)
        reset()
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{drivers?.length || 0} drivers</p>
        <Button
          onClick={() => setShowForm(true)}
          className="text-white gap-2"
          style={{ backgroundColor: "#2563EB" }}
        >
          <Plus className="w-4 h-4" />
          Add Driver
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : !drivers?.length ? (
        <EmptyState
          icon={UserCheck}
          title="No drivers yet"
          description="Add your drivers to start assigning them to trips."
          actionLabel="Add Driver"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {drivers.map((driver) => (
            <Link
              key={driver.id}
              href={`/drivers/${driver.id}`}
              className="bg-white rounded-xl border p-4 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="w-11 h-11">
                  <AvatarFallback
                    className="text-sm font-bold text-white"
                    style={{ backgroundColor: "#1A2942" }}
                  >
                    {getInitials(driver.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{driver.name}</div>
                  <span
                    className={cn(
                      "text-[11px] font-medium px-1.5 py-0.5 rounded-full inline-block mt-0.5",
                      statusColors[driver.status]
                    )}
                  >
                    {getDriverStatusLabel(driver.status)}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  {formatPhone(driver.phone)}
                </div>
                {driver.defaultVehicle && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Car className="w-3 h-3" />
                    {driver.defaultVehicle.name}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name *</Label>
                <Input {...register("name")} placeholder="Mike Rodriguez" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input {...register("phone")} placeholder="(305) 555-9876" type="tel" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register("email")} placeholder="mike@email.com" type="email" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>License Number</Label>
                <Input {...register("licenseNumber")} placeholder="D12345678" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={createDriver.isPending}
                className="flex-1 text-white"
                style={{ backgroundColor: "#2563EB" }}
              >
                {createDriver.isPending ? "Saving..." : "Add Driver"}
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
