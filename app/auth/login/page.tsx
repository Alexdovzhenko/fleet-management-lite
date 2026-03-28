"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes auth-up {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .au { animation: auth-up 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .au-1 { animation-delay: 0.05s; }
  .au-2 { animation-delay: 0.12s; }
  .au-3 { animation-delay: 0.19s; }
  .au-4 { animation-delay: 0.26s; }
  .au-5 { animation-delay: 0.33s; }

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
  .lc-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .lc-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
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
            ? "Incorrect email or password"
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

      {/* Heading */}
      <div className="au au-1 mb-8">
        <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#6366f1" }}>
          Welcome back
        </p>
        <h2
          className="font-bold leading-tight"
          style={{ fontSize: "2rem", color: "#0f172a", letterSpacing: "-0.03em" }}
        >
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#64748b", fontWeight: 400 }}>
          Manage your fleet and dispatch operations
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
        {/* Email */}
        <div className="au au-2 mb-4">
          <label className="block text-xs font-semibold mb-2" style={{ color: "#374151" }}>
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
        <div className="au au-3 mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold" style={{ color: "#374151" }}>
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium"
              style={{ color: "#6366f1", textDecoration: "none" }}
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
        <div className="au au-4">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="au au-5 flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <p className="au au-5 text-center text-sm text-gray-500">
        New to Livery Connect?{" "}
        <Link
          href="/auth/signup"
          className="font-semibold"
          style={{ color: "#6366f1", textDecoration: "none" }}
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
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
