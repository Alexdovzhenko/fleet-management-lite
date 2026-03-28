"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes t-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .t-in { animation: t-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .t-d1 { animation-delay: 0.06s; }
  .t-d2 { animation-delay: 0.12s; }
  .t-d3 { animation-delay: 0.18s; }
  .t-d4 { animation-delay: 0.24s; }
  .t-d5 { animation-delay: 0.30s; }
  .t-d6 { animation-delay: 0.36s; }
  .t-d7 { animation-delay: 0.42s; }

  .t-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 4px;
    padding: 13px 14px;
    font-size: 0.82rem;
    color: #fafaf9;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    font-family: var(--font-mono, monospace);
    font-weight: 400;
    letter-spacing: 0.02em;
  }
  .t-input::placeholder {
    color: rgba(255,255,255,0.2);
    font-weight: 300;
  }
  .t-input:focus {
    border-color: rgba(245,158,11,0.6);
    background: rgba(245,158,11,0.04);
    box-shadow: 0 0 0 3px rgba(245,158,11,0.07);
  }

  .t-btn {
    width: 100%;
    padding: 14px;
    background: #f59e0b;
    color: #080706;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-family: var(--font-mono, monospace);
    transition: background 0.2s, transform 0.15s;
  }
  .t-btn:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-1px);
  }
  .t-btn:active:not(:disabled) { transform: translateY(0); }
  .t-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }

  .t-label {
    display: block;
    font-size: 0.58rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    margin-bottom: 0.5rem;
    font-family: var(--font-mono, monospace);
    font-weight: 400;
  }

  .t-link-plain {
    color: rgba(255,255,255,0.7);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s;
  }
  .t-link-plain:hover { color: #f59e0b; }
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
      <div className="t-in t-d1" style={{ marginBottom: "2rem" }}>
        <div
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245,158,11,0.6)",
            fontFamily: "var(--font-mono)",
            marginBottom: "0.75rem",
          }}
        >
          // REGISTER_OPERATOR
        </div>
        <h2
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2.6rem",
            color: "#fafaf9",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          CREATE ACCOUNT
        </h2>
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "rgba(255,255,255,0.3)",
            fontWeight: 300,
            marginTop: "0.6rem",
            letterSpacing: "0.02em",
          }}
        >
          Set up your limo dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-5"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "4px",
            padding: "10px 14px",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "rgba(252,165,165,0.9)",
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ color: "#f87171", marginRight: "6px" }}>!</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company */}
        <div className="t-in t-d2" style={{ marginBottom: "1.1rem" }}>
          <label className="t-label">Company_Name</label>
          <input value={form.companyName} onChange={field("companyName")} placeholder="Luxury Limousine Co." required className="t-input" />
        </div>

        {/* First / Last */}
        <div className="t-in t-d3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.1rem" }}>
          <div>
            <label className="t-label">First_Name</label>
            <input value={form.firstName} onChange={field("firstName")} placeholder="John" required className="t-input" />
          </div>
          <div>
            <label className="t-label">Last_Name</label>
            <input value={form.lastName} onChange={field("lastName")} placeholder="Smith" required className="t-input" />
          </div>
        </div>

        {/* Email */}
        <div className="t-in t-d4" style={{ marginBottom: "1.1rem" }}>
          <label className="t-label">Business_Email</label>
          <input type="email" value={form.email} onChange={field("email")} placeholder="operator@yourlimo.com" required autoFocus className="t-input" />
        </div>

        {/* Passwords */}
        <div className="t-in t-d5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.75rem" }}>
          <div>
            <label className="t-label">Password</label>
            <input type="password" value={form.password} onChange={field("password")} placeholder="Min. 8 chars" required className="t-input" />
          </div>
          <div>
            <label className="t-label">Confirm</label>
            <input type="password" value={form.confirmPassword} onChange={field("confirmPassword")} placeholder="Repeat" required className="t-input" />
          </div>
        </div>

        {/* Submit */}
        <div className="t-in t-d6">
          <button type="submit" disabled={loading} className="t-btn">
            {loading ? "INITIALIZING..." : "CREATE ACCOUNT →"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div
        className="t-in t-d7"
        style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>OR</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      <p
        className="t-in t-d7"
        style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.02em",
        }}
      >
        Have an account?{" "}
        <Link href="/auth/login" className="t-link-plain">
          Sign in →
        </Link>
      </p>
    </>
  )
}
