"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes lc-rise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lc-a  { animation: lc-rise 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .lc-a1 { animation-delay: 0.05s; }
  .lc-a2 { animation-delay: 0.11s; }
  .lc-a3 { animation-delay: 0.17s; }
  .lc-a4 { animation-delay: 0.23s; }
  .lc-a5 { animation-delay: 0.29s; }

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
        setError(signInError.message === "Invalid login credentials" ? "Incorrect email or password" : signInError.message)
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
      <div className="lc-a lc-a1" style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--font-bricolage)",
            fontSize: "1.9rem",
            fontWeight: 700,
            color: "#0c2340",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            marginBottom: "0.5rem",
          }}
        >
          Welcome back
        </h2>
        <p style={{ fontSize: "0.875rem", color: "#6b7c8d", fontWeight: 400 }}>
          Sign in to your dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="lc-a lc-a1"
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
        {/* Email */}
        <div className="lc-a lc-a2" style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#374558",
              marginBottom: "0.45rem",
              letterSpacing: "0.01em",
            }}
          >
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@yourlimo.com"
            required
            autoFocus
            className="lc-input"
          />
        </div>

        {/* Password */}
        <div className="lc-a lc-a3" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374558", letterSpacing: "0.01em" }}>
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              style={{ fontSize: "0.78rem", color: "#0c2340", fontWeight: 500, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="lc-input"
          />
        </div>

        {/* Submit */}
        <div className="lc-a lc-a4">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="lc-a lc-a5" style={{ display: "flex", alignItems: "center", gap: "12px", margin: "1.5rem 0" }}>
        <div style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
        <span style={{ fontSize: "0.75rem", color: "#b0bbc7", fontWeight: 400 }}>or</span>
        <div style={{ flex: 1, height: "1px", background: "#edf0f3" }} />
      </div>

      <p className="lc-a lc-a5" style={{ textAlign: "center", fontSize: "0.85rem", color: "#6b7c8d" }}>
        New to Livery Connect?{" "}
        <Link
          href="/auth/signup"
          style={{ color: "#0c2340", fontWeight: 600, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
        >
          Create an account
        </Link>
      </p>
    </>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
