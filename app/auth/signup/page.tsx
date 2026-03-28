"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes lc-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lc-a  { animation: lc-rise 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .lc-a1 { animation-delay: 0.05s; }
  .lc-a2 { animation-delay: 0.10s; }
  .lc-a3 { animation-delay: 0.15s; }
  .lc-a4 { animation-delay: 0.20s; }
  .lc-a5 { animation-delay: 0.25s; }
  .lc-a6 { animation-delay: 0.30s; }
  .lc-a7 { animation-delay: 0.35s; }

  .lc-input {
    width: 100%;
    background: #f8f9fb;
    border: 1.5px solid #e2e6eb;
    border-radius: 8px;
    padding: 11px 14px;
    font-size: 0.875rem;
    color: #0d1b2a;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    font-family: var(--font-instrument, system-ui);
    font-weight: 400;
  }
  .lc-input::placeholder { color: #a8b4c0; }
  .lc-input:focus {
    border-color: #0c2340;
    background: #fff;
    box-shadow: 0 0 0 3.5px rgba(12,35,64,0.08);
  }

  .lc-btn {
    width: 100%;
    padding: 12px 16px;
    background: #0c2340;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: var(--font-instrument, system-ui);
    letter-spacing: 0.01em;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(12,35,64,0.2);
  }
  .lc-btn:hover:not(:disabled) {
    background: #163860;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(12,35,64,0.25);
  }
  .lc-btn:active:not(:disabled) { transform: translateY(0); box-shadow: 0 2px 8px rgba(12,35,64,0.2); }
  .lc-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; box-shadow: none; }
`

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    companyName: "", firstName: "", lastName: "",
    email: "", password: "", confirmPassword: "",
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
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  const labelStyle = { fontSize: "0.78rem", fontWeight: 600, color: "#374558", letterSpacing: "0.01em", display: "block", marginBottom: "0.45rem" } as const

  return (
    <>
      <style>{STYLES}</style>

      {/* Heading */}
      <div className="lc-a lc-a1" style={{ marginBottom: "1.75rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-bricolage)",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#0c2340",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            marginBottom: "0.5rem",
          }}
        >
          Create your account
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7c8d", fontWeight: 400 }}>
          Set up your limo dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "10px 14px",
            background: "#fff5f5",
            border: "1.5px solid #fecaca",
            borderRadius: "8px",
            fontSize: "0.82rem",
            color: "#c53030",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 7a1 1 0 110-2 1 1 0 010 2z"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company */}
        <div className="lc-a lc-a2" style={{ marginBottom: "0.9rem" }}>
          <label style={labelStyle}>Company name</label>
          <input value={form.companyName} onChange={field("companyName")} placeholder="Luxury Limousine Co." required className="lc-input" />
        </div>

        {/* Name row */}
        <div className="lc-a lc-a3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.9rem" }}>
          <div>
            <label style={labelStyle}>First name</label>
            <input value={form.firstName} onChange={field("firstName")} placeholder="John" required className="lc-input" />
          </div>
          <div>
            <label style={labelStyle}>Last name</label>
            <input value={form.lastName} onChange={field("lastName")} placeholder="Smith" required className="lc-input" />
          </div>
        </div>

        {/* Email */}
        <div className="lc-a lc-a4" style={{ marginBottom: "0.9rem" }}>
          <label style={labelStyle}>Business email</label>
          <input type="email" value={form.email} onChange={field("email")} placeholder="john@yourlimo.com" required autoFocus className="lc-input" />
        </div>

        {/* Passwords */}
        <div className="lc-a lc-a5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={form.password} onChange={field("password")} placeholder="Min. 8 chars" required className="lc-input" />
          </div>
          <div>
            <label style={labelStyle}>Confirm</label>
            <input type="password" value={form.confirmPassword} onChange={field("confirmPassword")} placeholder="Repeat" required className="lc-input" />
          </div>
        </div>

        {/* Submit */}
        <div className="lc-a lc-a6">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="lc-a lc-a7" style={{ display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0" }}>
        <div style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
        <span style={{ fontSize: "0.75rem", color: "#b0bbc7" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
      </div>

      <p className="lc-a lc-a7" style={{ textAlign: "center", fontSize: "0.85rem", color: "#6b7c8d" }}>
        Already have an account?{" "}
        <Link
          href="/auth/login"
          style={{ color: "#0c2340", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Sign in
        </Link>
      </p>
    </>
  )
}
