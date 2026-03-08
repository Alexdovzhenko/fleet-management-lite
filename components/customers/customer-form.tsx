"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Customer } from "@/types"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().optional(),
  homeAddress: z.string().optional(),
  workAddress: z.string().optional(),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CustomerFormProps {
  defaultValues?: Partial<Customer>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CustomerForm({ defaultValues, onSubmit, onCancel, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      company: defaultValues?.company || "",
      homeAddress: defaultValues?.homeAddress || "",
      workAddress: defaultValues?.workAddress || "",
      specialRequests: defaultValues?.specialRequests || "",
      notes: defaultValues?.notes || "",
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" {...register("name")} placeholder="John Smith" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone *</Label>
          <Input id="phone" {...register("phone")} placeholder="(305) 555-1234" type="tel" />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...register("email")} placeholder="john@example.com" type="email" />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} placeholder="ABC Corporation" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="homeAddress">Home Address</Label>
        <Input id="homeAddress" {...register("homeAddress")} placeholder="123 Main St, Miami FL 33101" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="workAddress">Work Address</Label>
        <Input id="workAddress" {...register("workAddress")} placeholder="456 Business Blvd, Miami FL" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="specialRequests">Special Requests</Label>
        <Textarea
          id="specialRequests"
          {...register("specialRequests")}
          placeholder="Always provide bottled water. Child seat for daughter."
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Internal notes (not visible to customer)"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 text-white"
          style={{ backgroundColor: "#2563EB" }}
        >
          {isLoading ? "Saving..." : defaultValues ? "Save Changes" : "Add Customer"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
