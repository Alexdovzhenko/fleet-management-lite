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
  background: "var(--lc-bg-glass)",
  border: "1px solid var(--lc-border)",
  color: "var(--lc-text-primary)",
  transition: "border-color 150ms",
}
const inputError: React.CSSProperties = { ...inputBase, border: "1px solid rgba(248,113,113,0.60)" }

function DarkInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, ...rest } = props as React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }
  return (
    <>
      <style>{`.dk-input::placeholder{color:var(--lc-text-muted)}`}</style>
      <input
        {...rest}
        className="dk-input"
        style={hasError ? inputError : inputBase}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,124,0.50)" }}
        onBlur={e => { e.currentTarget.style.borderColor = hasError ? "rgba(248,113,113,0.60)" : "var(--lc-border)" }}
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
          background: "var(--lc-bg-page)",
          border: "1px solid var(--lc-bg-glass-hover)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,168,124,0.06)",
        }}
      >
        {/* Header */}
        <div
          className="relative flex items-center gap-3 px-5 py-4 pr-12"
          style={{ background: "var(--lc-bg-surface)", borderBottom: "1px solid var(--lc-bg-glass-mid)" }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(201,168,124,0.14)", border: "1px solid rgba(201,168,124,0.22)" }}
          >
            <UserPlus className="w-4 h-4" style={{ color: "#c9a87c" }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--lc-text-primary)" }}>New Account</h2>
            <p className="text-[11px]" style={{ color: "var(--lc-text-label)" }}>Add a client to your account book</p>
          </div>

          {/* Close — absolute top-right, always anchored to corner */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-4 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: "var(--lc-text-secondary)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)"
              ;(e.currentTarget as HTMLElement).style.color = "#ffffff"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent"
              ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)"
            }}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>
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
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>
                Last Name
              </label>
              <DarkInput {...register("lastName")} placeholder="Smith" />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>
                Phone
              </label>
              <DarkInput {...register("phone")} type="tel" placeholder="(305) 555-1234" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>
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
            <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--lc-text-primary)" }}>
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
              style={{ background: "var(--lc-bg-glass)", border: "1px solid var(--lc-border)", color: "var(--lc-text-secondary)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass-hover)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-primary)"
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--lc-bg-glass)"
                ;(e.currentTarget as HTMLElement).style.color = "var(--lc-text-secondary)"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCustomer.isPending}
              className="flex-1 h-10 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#c9a87c", color: "var(--lc-bg-surface)" }}
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
