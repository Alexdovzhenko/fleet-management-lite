"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  .auth-field { animation-delay: 0.1s; }
  .auth-field-2 { animation-delay: 0.18s; }
  .auth-field-3 { animation-delay: 0.26s; }
  .auth-cta { animation-delay: 0.34s; }
  .auth-footer { animation-delay: 0.42s; }

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

  .lc-gold-link {
    color: #c9a96e;
    text-decoration: none;
    transition: opacity 0.2s;
  }
  .lc-gold-link:hover {
    opacity: 0.7;
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
      <div className="auth-animate mb-10">
        <h2
          style={{
            fontFamily: "var(--font-cormorant)",
            fontSize: "2.8rem",
            fontWeight: 300,
            color: "#1a1a1a",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          Welcome back
        </h2>
        <p
          className="mt-2.5 text-sm"
          style={{ color: "#9c9690", fontWeight: 300, lineHeight: 1.6 }}
        >
          Sign in to your dispatch workspace
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mb-6 py-3 px-4 text-sm"
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
        {/* Email */}
        <div className="auth-animate auth-field mb-7">
          <label
            className="block text-[10px] tracking-[0.2em] uppercase mb-3"
            style={{ color: "#9c9690", fontWeight: 400 }}
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
        <div className="auth-animate auth-field-2 mb-9">
          <div className="flex items-center justify-between mb-3">
            <label
              className="block text-[10px] tracking-[0.2em] uppercase"
              style={{ color: "#9c9690", fontWeight: 400 }}
            >
              Password
            </label>
            <Link href="/auth/forgot-password" className="lc-gold-link text-[11px]">
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
        <div className="auth-animate auth-cta">
          <button type="submit" disabled={loading} className="lc-btn">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div className="auth-animate auth-footer flex items-center gap-4 mt-8 mb-6">
        <div className="flex-1 h-px" style={{ background: "#e8e3dc" }} />
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "#c0bab2" }}>or</span>
        <div className="flex-1 h-px" style={{ background: "#e8e3dc" }} />
      </div>

      <p className="auth-animate auth-footer text-center text-sm" style={{ color: "#9c9690", fontWeight: 300 }}>
        New to Livery Connect?{" "}
        <Link href="/auth/signup" className="lc-link">
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
