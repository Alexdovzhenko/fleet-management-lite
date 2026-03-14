"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { CountryCombobox } from "@/components/ui/country-combobox"
import { StateCombobox } from "@/components/ui/state-combobox"
import type { Customer } from "@/types"

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().optional(),
  isBillingContact: z.boolean().optional(),
  isPassenger: z.boolean().optional(),
  isBookingContact: z.boolean().optional(),
  homeAddress: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  driverNotes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface CustomerFormProps {
  defaultValues?: Partial<Customer>
  onSubmit: (data: FormData) => void
  onCancel: () => void
  isLoading?: boolean
  error?: string | null
  nextNumber?: string
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10)
  if (digits.length === 0) return ""
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export function CustomerForm({ defaultValues, onSubmit, onCancel, isLoading, error, nextNumber }: CustomerFormProps) {
  const existingFirst = defaultValues?.name ? defaultValues.name.split(" ")[0] : ""
  const existingLast  = defaultValues?.name ? defaultValues.name.split(" ").slice(1).join(" ") : ""

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: existingFirst,
      lastName:  existingLast,
      phone: defaultValues?.phone ? formatPhone(defaultValues.phone) : "",
      email: defaultValues?.email || "",
      company: defaultValues?.company || "",
      isBillingContact: defaultValues?.isBillingContact ?? false,
      isPassenger: defaultValues?.isPassenger ?? false,
      isBookingContact: defaultValues?.isBookingContact ?? false,
      homeAddress: defaultValues?.homeAddress || "",
      addressLine2: defaultValues?.addressLine2 || "",
      city: defaultValues?.city || "",
      state: defaultValues?.state || "",
      zip: defaultValues?.zip || "",
      country: defaultValues?.country || "",
      notes: defaultValues?.notes || "",
      specialRequests: defaultValues?.specialRequests || "",
      driverNotes: defaultValues?.driverNotes || "",
    },
  })

  const phoneValue = watch("phone")

  function handleFormSubmit(data: FormData) {
    const { firstName, lastName, ...rest } = data
    onSubmit({ ...rest, name: [firstName, lastName].filter(Boolean).join(" ") } as never)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Account Number */}
      <div className="space-y-1.5">
        <Label>Account Number</Label>
        <div className="flex items-center h-9 px-3 rounded-md border bg-gray-50 text-sm font-mono text-gray-600">
          {defaultValues?.customerNumber
            ? `#${defaultValues.customerNumber}`
            : nextNumber
              ? `#${nextNumber}`
              : <span className="text-gray-400 text-xs">Loading...</span>}
        </div>
      </div>

      {/* Name + Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" {...register("firstName")} placeholder="John" />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" {...register("lastName")} placeholder="Smith" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            {...register("phone")}
            value={phoneValue}
            onChange={(e) => setValue("phone", formatPhone(e.target.value), { shouldValidate: true })}
            placeholder="(305) 555-1234"
            type="tel"
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...register("email")} placeholder="john@example.com" type="email" />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} placeholder="ABC Corporation" />
        </div>
      </div>

      {/* Account Type */}
      <div className="border rounded-lg p-3 space-y-2">
        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Account Type</Label>
        <div className="flex gap-6">
          <Controller
            name="isBillingContact"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                Billing Contact
              </label>
            )}
          />
          <Controller
            name="isPassenger"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                Passenger
              </label>
            )}
          />
          <Controller
            name="isBookingContact"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
                Booking Contact
              </label>
            )}
          />
        </div>
      </div>

      {/* Address */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label htmlFor="homeAddress">Primary Address</Label>
          <Input id="homeAddress" {...register("homeAddress")} placeholder="123 Main St" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addressLine2">Address Line 2</Label>
          <Input id="addressLine2" {...register("addressLine2")} placeholder="Apt 4B" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5 col-span-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...register("city")} placeholder="Miami" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State / Prov</Label>
          <Controller
            name="state"
            control={control}
            render={({ field }) => (
              <StateCombobox
                id="state"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip">Zip / Post</Label>
          <Input id="zip" {...register("zip")} placeholder="33101" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="country">Country</Label>
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <CountryCombobox
              id="country"
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="notes">Internal / Private Notes</Label>
          <Textarea
            id="notes"
            {...register("notes")}
            placeholder="Internal notes (not visible to customer)"
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="specialRequests">Preferences / Trip Notes</Label>
          <Textarea
            id="specialRequests"
            {...register("specialRequests")}
            placeholder="Always provide bottled water. Child seat for daughter."
            rows={3}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="driverNotes">Notes for Drivers</Label>
        <Textarea
          id="driverNotes"
          {...register("driverNotes")}
          placeholder="Instructions visible to assigned drivers"
          rows={2}
        />
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

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
