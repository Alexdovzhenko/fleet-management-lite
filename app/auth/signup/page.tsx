"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes auth-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .au { animation: auth-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .au-1 { animation-delay: 0.05s; }
  .au-2 { animation-delay: 0.11s; }
  .au-3 { animation-delay: 0.17s; }
  .au-4 { animation-delay: 0.23s; }
  .au-5 { animation-delay: 0.29s; }
  .au-6 { animation-delay: 0.35s; }
  .au-7 { animation-delay: 0.41s; }

  .lc-input {
    width: 100%;
    background: #f8f9fb;
    border: 1.5px solid #e8eaf0;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 0.88rem;
    color: #0f172a;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    font-family: var(--font-outfit, system-ui);
    font-weight: 400;
  }
  .lc-input::placeholder { color: #a0a8b8; }
  .lc-input:focus {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(99,102,241,0.08);
  }

  .lc-btn {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    font-family: var(--font-outfit, system-ui);
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 14px rgba(99,102,241,0.35);
  }
  .lc-btn:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(99,102,241,0.4);
  }
  .lc-btn:active:not(:disabled) { transform: translateY(0); }
  .lc-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: {
            companyName: form.companyName,
            contactName: [form.firstName, form.lastName].filter(Boolean).join(" "),
          },
        },
      })
      if (signUpError) { setError(signUpError.message); return }
      router.push("/auth/verify-email")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  return (
    <>
      <style>{STYLES}</style>

      {/* Heading */}
      <div className="au au-1 mb-7">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#6366f1" }}>
          Get started
        </p>
        <h2
          className="font-bold leading-tight"
          style={{ fontSize: "1.85rem", color: "#0f172a", letterSpacing: "-0.03em" }}
        >
          Create your account
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
          Set up your limo dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-5 py-3 px-4 rounded-lg text-sm flex items-center gap-2"
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company */}
        <div className="au au-2 mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Company Name</label>
          <input value={form.companyName} onChange={field("companyName")} placeholder="Luxury Limousine Co." required className="lc-input" />
        </div>

        {/* First / Last */}
        <div className="au au-3 grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>First Name</label>
            <input value={form.firstName} onChange={field("firstName")} placeholder="John" required className="lc-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Last Name</label>
            <input value={form.lastName} onChange={field("lastName")} placeholder="Smith" required className="lc-input" />
          </div>
        </div>

        {/* Email */}
        <div className="au au-4 mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Business Email</label>
          <input type="email" value={form.email} onChange={field("email")} placeholder="john@yourlimo.com" required autoFocus className="lc-input" />
        </div>

        {/* Passwords */}
        <div className="au au-5 grid grid-cols-2 gap-3 mb-7">
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Password</label>
            <input type="password" value={form.password} onChange={field("password")} placeholder="Min. 8 characters" required className="lc-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>Confirm</label>
            <input type="password" value={form.confirmPassword} onChange={field("confirmPassword")} placeholder="Repeat password" required className="lc-input" />
          </div>
        </div>

        {/* Submit */}
        <div className="au au-6">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="au au-7 flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <p className="au au-7 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold"
          style={{ color: "#6366f1", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
