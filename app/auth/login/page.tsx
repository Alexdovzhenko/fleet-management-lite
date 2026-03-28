"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes lx-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lx { animation: lx-up 0.65s cubic-bezier(0.16,1,0.3,1) both; }
  .lx-1 { animation-delay: 0.08s; }
  .lx-2 { animation-delay: 0.16s; }
  .lx-3 { animation-delay: 0.24s; }
  .lx-4 { animation-delay: 0.32s; }
  .lx-5 { animation-delay: 0.40s; }
  .lx-6 { animation-delay: 0.48s; }

  /* Floating label field */
  .lx-field {
    position: relative;
    padding-top: 20px;
    margin-bottom: 0;
  }
  .lx-field label {
    position: absolute;
    top: 22px;
    left: 0;
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
    padding: 10px 0 10px 0;
    font-family: var(--font-dm, system-ui);
    font-size: 0.9375rem;
    font-weight: 400;
    color: #0d0d0d;
    outline: none;
    transition: border-color 0.22s ease;
    letter-spacing: 0.01em;
  }
  .lx-input::placeholder { color: transparent; }
  .lx-input:focus {
    border-bottom-color: #c9a87c;
  }
  /* Gold underline slide-in on focus */
  .lx-field::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: #c9a87c;
    transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .lx-field:focus-within::after { width: 100%; }

  /* Button */
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
    transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
  }
  .lx-btn:hover:not(:disabled) {
    background: #1a1a1a;
    transform: translateY(-1px);
  }
  .lx-btn:active:not(:disabled) { transform: translateY(0); }
  .lx-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* Links */
  .lx-link {
    color: #0d0d0d;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid rgba(13,13,13,0.2);
    transition: border-color 0.2s, color 0.2s;
    padding-bottom: 1px;
  }
  .lx-link:hover { color: #c9a87c; border-color: #c9a87c; }
  .lx-link-gold {
    color: #c9a87c;
    text-decoration: none;
    border-bottom: 1px solid rgba(201,168,124,0.3);
    transition: border-color 0.2s, opacity 0.2s;
    padding-bottom: 1px;
  }
  .lx-link-gold:hover { opacity: 0.7; border-color: #c9a87c; }
`

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dispatch"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{STYLES}</style>

      {/* Heading */}
      <div className="lx lx-1" style={{ marginBottom: "3rem" }}>
        <p style={{
          fontFamily: "var(--font-dm)",
          fontSize: "0.62rem",
          fontWeight: 400,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(13,13,13,0.35)",
          marginBottom: "0.85rem",
        }}>
          Member Access
        </p>
        <h2 style={{
          fontFamily: "var(--font-playfair)",
          fontSize: "2rem",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#0d0d0d",
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}>
          Welcome back
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="lx lx-1" style={{
          marginBottom: "1.5rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid rgba(180,30,30,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#b41e1e", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-dm)", fontSize: "0.8rem", color: "#b41e1e", fontWeight: 400 }}>
            {error}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="lx lx-2 lx-field" style={{ marginBottom: "1.75rem" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoFocus
            className="lx-input"
            id="lx-email"
          />
          <label htmlFor="lx-email">Email address</label>
        </div>

        {/* Password */}
        <div className="lx lx-3 lx-field" style={{ marginBottom: "0.5rem" }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="lx-input"
            id="lx-pass"
          />
          <label htmlFor="lx-pass">Password</label>
        </div>

        {/* Forgot */}
        <div className="lx lx-3" style={{ textAlign: "right", marginBottom: "2.5rem" }}>
          <Link href="/auth/forgot-password" className="lx-link-gold" style={{ fontSize: "0.72rem", letterSpacing: "0.05em" }}>
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <div className="lx lx-4">
          <button type="submit" disabled={loading} className="lx-btn">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="lx lx-5" style={{ display: "flex", alignItems: "center", gap: "1.25rem", margin: "2rem 0" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(13,13,13,0.08)" }} />
        <span style={{ fontFamily: "var(--font-dm)", fontSize: "0.65rem", color: "rgba(13,13,13,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          or
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(13,13,13,0.08)" }} />
      </div>

      <p className="lx lx-6" style={{
        textAlign: "center",
        fontFamily: "var(--font-dm)",
        fontSize: "0.82rem",
        color: "rgba(13,13,13,0.45)",
        fontWeight: 300,
      }}>
        New to Livery Connect?{" "}
        <Link href="/auth/signup" className="lx-link">
          Create an account
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
