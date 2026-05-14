"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, UserPlus, AlertCircle, Loader2 } from "lucide-react"
import { useCreateCustomer } from "@/lib/hooks/use-customers"
import type { Customer } from "@/types"

const newAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName:  z.string().optional(),
  company:   z.string().optional(),
  phone:     z.string().optional(),
  email:     z.string().email("Invalid email").optional().or(z.literal("")),
})
type NewAccountData = z.infer<typeof newAccountSchema>

const inputBase: React.CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 12px",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.88)",
  transition: "border-color 150ms",
}
const inputError: React.CSSProperties = { ...inputBase, border: "1px solid rgba(248,113,113,0.60)" }

function DarkInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, ...rest } = props as React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
  return (
    <>
      <style>{`.dk-input::placeholder{color:rgba(200,212,228,0.38)}`}</style>
      <input
        {...rest}
        className="dk-input"
        style={hasError ? inputError : inputBase}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)" }}
        onBlur={e => { e.currentTarget.style.borderColor = hasError ? "rgba(248,113,113,0.60)" : "rgba(255,255,255,0.12)" }}
      />
    </>
  )
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-sm mx-4 rounded-2xl overflow-hidden"
        style={{
          background: "#080c16",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,168,124,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ background: "#0d1526", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,124,0.14)", border: "1px solid rgba(201,168,124,0.22)" }}
            >
              <UserPlus className="w-3.5 h-3.5" style={{ color: "#c9a87c" }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.92)" }}>New Account</h2>
              <p className="text-[11px]" style={{ color: "rgba(200,212,228,0.45)" }}>Add a client to your account book</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ color: "rgba(200,212,228,0.40)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.80)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "rgba(200,212,228,0.40)"
            }}
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
                First Name <span style={{ color: "rgba(248,113,113,0.80)" }}>*</span>
              </label>
              <DarkInput
                {...register("firstName")}
                placeholder="John"
                autoFocus
                hasError={!!errors.firstName}
              />
              {errors.firstName && (
                <p className="text-[11px]" style={{ color: "rgba(248,113,113,0.80)" }}>
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
                Last Name
              </label>
              <DarkInput {...register("lastName")} placeholder="Smith" />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
                Phone
              </label>
              <DarkInput {...register("phone")} type="tel" placeholder="(305) 555-1234" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
                Email
              </label>
              <DarkInput
                {...register("email")}
                type="email"
                placeholder="john@example.com"
                hasError={!!errors.email}
              />
              {errors.email && (
                <p className="text-[11px]" style={{ color: "rgba(248,113,113,0.80)" }}>
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.85)" }}>
              Company Name
            </label>
            <DarkInput {...register("company")} placeholder="Acme Corp" />
          </div>

          {/* API error */}
          {apiError && (
            <div
              className="flex items-start gap-2.5 rounded-xl px-3.5 py-2.5"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "rgba(248,113,113,0.80)" }} />
              <p className="text-[12px]" style={{ color: "rgba(248,113,113,0.85)" }}>{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 text-sm font-semibold rounded-xl transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"
                ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="flex-1 h-10 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#c9a87c", color: "#0d1526" }}
              onMouseEnter={e => { if (!createCustomer.isPending) (e.currentTarget as HTMLElement).style.background = "#d4b88e" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#c9a87c" }}
            >
              {createCustomer.isPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                : "Create Account"
              }
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
