"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateCustomer } from "@/lib/hooks/use-customers"
import type { Customer } from "@/types"

const newAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
})
type NewAccountData = z.infer<typeof newAccountSchema>

export function CreateAccountDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Customer) => void }) {
  const createCustomer = useCreateCustomer()
  const [apiError, setApiError] = useState("")
  const { register, handleSubmit, formState: { errors } } = useForm<NewAccountData>({
    resolver: zodResolver(newAccountSchema) as Resolver<NewAccountData>,
  })

  function onSubmit(data: NewAccountData) {
    setApiError("")
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ")
    createCustomer.mutate(
      { name, phone: data.phone || undefined, email: data.email || undefined, company: data.company || undefined },
      {
        onSuccess: (c) => onCreated(c),
        onError: () => setApiError("Something went wrong while creating the account. Please try again."),
      },
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">New Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Required field legend */}
          <p className="text-[11px] text-gray-400"><span className="text-red-400 font-semibold">*</span> Required field</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-600">First Name <span className="text-red-400">*</span></Label>
              <Input
                {...register("firstName")}
                className={`h-10 text-sm ${errors.firstName ? "border-red-400 focus:ring-red-300" : ""}`}
                placeholder="John"
                autoFocus
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName.message || "First name is required"}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900">Last Name</Label>
              <Input {...register("lastName")} className="h-10 text-sm" placeholder="Smith" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900">Phone</Label>
              <Input {...register("phone")} type="tel" className="h-10 text-sm" placeholder="(305) 555-1234" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-900">Email</Label>
              <Input
                {...register("email")}
                type="email"
                className={`h-10 text-sm ${errors.email ? "border-red-400" : ""}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-500">Please enter a valid email address</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-900">Company Name</Label>
            <Input {...register("company")} className="h-10 text-sm" placeholder="Acme Corp" />
          </div>

          {apiError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              {apiError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 h-9 text-sm">Cancel</Button>
            <Button type="submit" disabled={createCustomer.isPending} className="flex-1 h-9 text-sm bg-[#2563EB] hover:bg-blue-700 text-white">
              {createCustomer.isPending ? "Creating…" : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
