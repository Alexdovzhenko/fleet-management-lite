"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  /* Staggered spring entrance */
  @keyframes spring-up {
    0%   { opacity: 0; transform: translateY(20px) scale(0.98); }
    60%  { opacity: 1; transform: translateY(-3px) scale(1.002); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .s-in { animation: spring-up 0.55s cubic-bezier(0.34,1.3,0.64,1) both; }
  .s-1 { animation-delay: 0.08s; }
  .s-2 { animation-delay: 0.15s; }
  .s-3 { animation-delay: 0.22s; }
  .s-4 { animation-delay: 0.29s; }
  .s-5 { animation-delay: 0.36s; }
  .s-6 { animation-delay: 0.43s; }

  /* Input — Apple HIG style */
  .ap-input {
    width: 100%;
    background: rgba(29,29,31,0.04);
    border: 1.5px solid rgba(29,29,31,0.15);
    border-radius: 10px;
    padding: 11px 14px;
    font-size: 0.9375rem;
    color: #1d1d1f;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    font-family: var(--font-jakarta, system-ui);
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
  }
  .ap-input::placeholder {
    color: rgba(29,29,31,0.3);
  }
  .ap-input:hover {
    border-color: rgba(29,29,31,0.25);
  }
  .ap-input:focus {
    border-color: #0071e3;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(0,113,227,0.15);
  }

  /* Button — Apple blue CTA */
  .ap-btn {
    width: 100%;
    padding: 13px 20px;
    background: #0071e3;
    color: #ffffff;
    border: none;
    border-radius: 980px;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    font-family: var(--font-jakarta, system-ui);
    letter-spacing: -0.01em;
    transition: background 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease, opacity 0.18s ease;
    -webkit-font-smoothing: antialiased;
    box-shadow: 0 2px 12px rgba(0,113,227,0.3);
  }
  .ap-btn:hover:not(:disabled) {
    background: #0077ed;
    transform: scale(1.008);
    box-shadow: 0 4px 18px rgba(0,113,227,0.38);
  }
  .ap-btn:active:not(:disabled) {
    background: #006bda;
    transform: scale(0.996);
    box-shadow: 0 1px 6px rgba(0,113,227,0.25);
    transition-duration: 0.06s;
  }
  .ap-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* Loading spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .ap-spinner {
    display: inline-block;
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }

  /* Link */
  .ap-link {
    color: #0071e3;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .ap-link:hover { opacity: 0.75; }
  .ap-link:active { opacity: 0.5; }
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
        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : signInError.message
        )
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

      {/* ── Logo mark (desktop, inside card) ── */}
      <div
        className="s-in s-1 hidden lg:flex items-center gap-2 mb-7"
      >
        <svg viewBox="0 0 44 30" style={{ height: "18px", width: "auto" }} aria-label="Livery Connect">
          <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0071e3" />
          <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0071e3" />
        </svg>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#1d1d1f", letterSpacing: "-0.01em" }}>
          Livery Connect
        </span>
      </div>

      {/* ── Heading ── */}
      <div className="s-in s-2" style={{ marginBottom: "1.75rem" }}>
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "#1d1d1f",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            marginBottom: "0.4rem",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          Sign in
        </h2>
        <p style={{ fontSize: "0.88rem", color: "rgba(29,29,31,0.55)", fontWeight: 400, lineHeight: 1.5 }}>
          to your dispatch workspace
        </p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="s-in s-1"
          style={{
            marginBottom: "1.25rem",
            padding: "11px 14px",
            background: "rgba(255,59,48,0.06)",
            border: "1px solid rgba(255,59,48,0.2)",
            borderRadius: "10px",
            fontSize: "0.84rem",
            color: "#d70015",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            lineHeight: 1.45,
          }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="s-in s-3" style={{ marginBottom: "0.85rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "rgba(29,29,31,0.75)",
              marginBottom: "0.45rem",
              letterSpacing: "-0.005em",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            autoFocus
            className="ap-input"
          />
        </div>

        {/* Password */}
        <div className="s-in s-4" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.45rem" }}>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(29,29,31,0.75)", letterSpacing: "-0.005em" }}>
              Password
            </label>
            <Link href="/auth/forgot-password" className="ap-link" style={{ fontSize: "0.8rem" }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="ap-input"
          />
        </div>

        {/* Submit */}
        <div className="s-in s-5">
          <button type="submit" disabled={loading} className="ap-btn">
            {loading && <span className="ap-spinner" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="s-in s-6" style={{ display: "flex", alignItems: "center", gap: "10px", margin: "1.5rem 0 1.25rem" }}>
        <div style={{ flex: 1, height: "1px", background: "rgba(29,29,31,0.1)" }} />
        <span style={{ fontSize: "0.75rem", color: "rgba(29,29,31,0.35)", fontWeight: 400 }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "rgba(29,29,31,0.1)" }} />
      </div>

      <p className="s-in s-6" style={{ textAlign: "center", fontSize: "0.875rem", color: "rgba(29,29,31,0.55)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="ap-link">
          Create one
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
