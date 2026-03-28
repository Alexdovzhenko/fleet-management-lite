"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes lx-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lx { animation: lx-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .lx-1 { animation-delay: 0.06s; }
  .lx-2 { animation-delay: 0.11s; }
  .lx-3 { animation-delay: 0.16s; }
  .lx-4 { animation-delay: 0.21s; }
  .lx-5 { animation-delay: 0.26s; }
  .lx-6 { animation-delay: 0.31s; }
  .lx-7 { animation-delay: 0.36s; }
  .lx-8 { animation-delay: 0.41s; }

  .lx-field {
    position: relative;
    padding-top: 20px;
  }
  .lx-field label {
    position: absolute;
    top: 22px; left: 0;
    font-family: var(--font-dm, system-ui);
    font-size: 0.82rem;
    font-weight: 400;
    color: rgba(13,13,13,0.4);
    letter-spacing: 0.04em;
    pointer-events: none;
    transition: top 0.22s ease, font-size 0.22s ease, color 0.22s ease, letter-spacing 0.22s ease;
  }
  .lx-field input:focus ~ label,
  .lx-field input:not(:placeholder-shown) ~ label {
    top: 2px;
    font-size: 0.62rem;
    color: #c9a87c;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .lx-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(13,13,13,0.12);
    padding: 10px 0;
    font-family: var(--font-dm, system-ui);
    font-size: 0.9375rem;
    font-weight: 400;
    color: #0d0d0d;
    outline: none;
    transition: border-color 0.22s ease;
    letter-spacing: 0.01em;
  }
  .lx-input::placeholder { color: transparent; }
  .lx-input:focus { border-bottom-color: #c9a87c; }
  .lx-field::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: #c9a87c;
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .lx-field:focus-within::after { width: 100%; }

  .lx-btn {
    width: 100%;
    padding: 16px 20px;
    background: #0d0d0d;
    color: #c9a87c;
    border: none;
    cursor: pointer;
    font-family: var(--font-dm, system-ui);
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    transition: background 0.2s ease, transform 0.15s ease;
  }
  .lx-btn:hover:not(:disabled) { background: #1a1a1a; transform: translateY(-1px); }
  .lx-btn:active:not(:disabled) { transform: translateY(0); }
  .lx-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  .lx-link {
    color: #0d0d0d;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid rgba(13,13,13,0.2);
    transition: border-color 0.2s, color 0.2s;
    padding-bottom: 1px;
  }
  .lx-link:hover { color: #c9a87c; border-color: #c9a87c; }
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
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return }
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
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  return (
    <>
      <style>{STYLES}</style>

      {/* Heading */}
      <div className="lx lx-1" style={{ marginBottom: "2.5rem" }}>
        <p style={{
          fontFamily: "var(--font-dm)",
          fontSize: "0.62rem",
          fontWeight: 400,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(13,13,13,0.35)",
          marginBottom: "0.85rem",
        }}>
          New Membership
        </p>
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "1.85rem",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#0d0d0d",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}>
          Create your account
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "1.5rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid rgba(180,30,30,0.2)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#b41e1e", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-dm)", fontSize: "0.8rem", color: "#b41e1e" }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Company */}
        <div className="lx lx-2 lx-field" style={{ marginBottom: "1.5rem" }}>
          <input value={form.companyName} onChange={field("companyName")} placeholder="Company name" required className="lx-input" id="s-co" />
          <label htmlFor="s-co">Company name</label>
        </div>

        {/* Name row */}
        <div className="lx lx-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div className="lx-field">
            <input value={form.firstName} onChange={field("firstName")} placeholder="First name" required className="lx-input" id="s-fn" />
            <label htmlFor="s-fn">First name</label>
          </div>
          <div className="lx-field">
            <input value={form.lastName} onChange={field("lastName")} placeholder="Last name" required className="lx-input" id="s-ln" />
            <label htmlFor="s-ln">Last name</label>
          </div>
        </div>

        {/* Email */}
        <div className="lx lx-4 lx-field" style={{ marginBottom: "1.5rem" }}>
          <input type="email" value={form.email} onChange={field("email")} placeholder="Business email" required autoFocus className="lx-input" id="s-em" />
          <label htmlFor="s-em">Business email</label>
        </div>

        {/* Passwords */}
        <div className="lx lx-5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2.5rem" }}>
          <div className="lx-field">
            <input type="password" value={form.password} onChange={field("password")} placeholder="Password" required className="lx-input" id="s-pw" />
            <label htmlFor="s-pw">Password</label>
          </div>
          <div className="lx-field">
            <input type="password" value={form.confirmPassword} onChange={field("confirmPassword")} placeholder="Confirm" required className="lx-input" id="s-cp" />
            <label htmlFor="s-cp">Confirm</label>
          </div>
        </div>

        {/* Submit */}
        <div className="lx lx-6">
          <button type="submit" disabled={loading} className="lx-btn">
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="lx lx-7" style={{ display: "flex", alignItems: "center", gap: "1.25rem", margin: "1.75rem 0" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(13,13,13,0.08)" }} />
        <span style={{ fontFamily: "var(--font-dm)", fontSize: "0.65rem", color: "rgba(13,13,13,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(13,13,13,0.08)" }} />
      </div>

      <p className="lx lx-8" style={{
        textAlign: "center",
        fontFamily: "var(--font-dm)",
        fontSize: "0.82rem",
        color: "rgba(13,13,13,0.45)",
        fontWeight: 300,
      }}>
        Already a member?{" "}
        <Link href="/auth/login" className="lx-link">Sign in</Link>
      </p>
    </>
  )
}
