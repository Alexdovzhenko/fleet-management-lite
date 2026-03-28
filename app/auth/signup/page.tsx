"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes auth-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-animate {
    animation: auth-fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .auth-f1 { animation-delay: 0.08s; }
  .auth-f2 { animation-delay: 0.14s; }
  .auth-f3 { animation-delay: 0.20s; }
  .auth-f4 { animation-delay: 0.26s; }
  .auth-f5 { animation-delay: 0.32s; }
  .auth-f6 { animation-delay: 0.38s; }
  .auth-f7 { animation-delay: 0.44s; }

  .lc-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid #dedad4;
    padding: 11px 0;
    font-size: 0.88rem;
    color: #1a1a1a;
    outline: none;
    transition: border-color 0.25s ease;
    font-family: var(--font-dm-sans, system-ui);
    font-weight: 300;
    letter-spacing: 0.01em;
  }
  .lc-input::placeholder {
    color: #b8b2aa;
    font-weight: 300;
  }
  .lc-input:focus {
    border-bottom-color: #c9a96e;
  }

  .lc-btn {
    width: 100%;
    padding: 14px;
    background: #1a1a1a;
    color: #c9a96e;
    border: none;
    cursor: pointer;
    font-size: 0.72rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-family: var(--font-dm-sans, system-ui);
    font-weight: 400;
    transition: background 0.25s ease, color 0.25s ease;
  }
  .lc-btn:hover:not(:disabled) {
    background: #c9a96e;
    color: #1a1a1a;
  }
  .lc-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .lc-link {
    color: #1a1a1a;
    font-weight: 500;
    text-decoration: none;
    transition: color 0.2s;
  }
  .lc-link:hover {
    color: #c9a96e;
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

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

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

      if (signUpError) {
        setError(signUpError.message)
        return
      }

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
      <div className="auth-animate mb-8">
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "2.6rem",
            fontWeight: 300,
            color: "#1a1a1a",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          Create your account
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#9c9690", fontWeight: 300, lineHeight: 1.6 }}>
          Set up your limo dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-5 py-3 px-4"
          style={{
            background: "rgba(220,38,38,0.04)",
            borderLeft: "2px solid rgba(220,38,38,0.5)",
            color: "#b91c1c",
            fontSize: "0.82rem",
            fontWeight: 300,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company name */}
        <div className="auth-animate auth-f1 mb-6">
          <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
            Company Name
          </label>
          <input
            value={form.companyName}
            onChange={field("companyName")}
            placeholder="Luxury Limousine Co."
            required
            className="lc-input"
          />
        </div>

        {/* First / Last name */}
        <div className="auth-animate auth-f2 grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
              First Name
            </label>
            <input
              value={form.firstName}
              onChange={field("firstName")}
              placeholder="John"
              required
              className="lc-input"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
              Last Name
            </label>
            <input
              value={form.lastName}
              onChange={field("lastName")}
              placeholder="Smith"
              required
              className="lc-input"
            />
          </div>
        </div>

        {/* Email */}
        <div className="auth-animate auth-f3 mb-6">
          <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
            Business Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={field("email")}
            placeholder="john@yourlimo.com"
            required
            autoFocus
            className="lc-input"
          />
        </div>

        {/* Password / Confirm */}
        <div className="auth-animate auth-f4 grid grid-cols-2 gap-6 mb-9">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={field("password")}
              placeholder="Min. 8 characters"
              required
              className="lc-input"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: "#9c9690" }}>
              Confirm
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={field("confirmPassword")}
              placeholder="Repeat password"
              required
              className="lc-input"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="auth-animate auth-f5">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="auth-animate auth-f6 flex items-center gap-4 mt-7 mb-5">
        <div className="flex-1 h-px" style={{ background: "#e8e3dc" }} />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#c0bab2" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "#e8e3dc" }} />
      </div>

      <p className="auth-animate auth-f7 text-center text-sm" style={{ color: "#9c9690", fontWeight: 300 }}>
        Already have an account?{" "}
        <Link href="/auth/login" className="lc-link">
          Sign in
        </Link>
      </p>
    </>
  )
}
