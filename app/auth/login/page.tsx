"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes t-up {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .t-in { animation: t-up 0.45s cubic-bezier(0.16,1,0.3,1) both; }
  .t-d1 { animation-delay: 0.06s; }
  .t-d2 { animation-delay: 0.13s; }
  .t-d3 { animation-delay: 0.20s; }
  .t-d4 { animation-delay: 0.27s; }
  .t-d5 { animation-delay: 0.34s; }

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
    border-color: rgba(163,230,53,0.6);
    background: rgba(163,230,53,0.04);
    box-shadow: 0 0 0 3px rgba(163,230,53,0.07);
  }

  .t-btn {
    width: 100%;
    padding: 14px;
    background: #a3e635;
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
    background: #bef264;
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

  .t-link {
    color: #a3e635;
    text-decoration: none;
    transition: opacity 0.15s;
  }
  .t-link:hover { opacity: 0.7; }

  .t-link-plain {
    color: rgba(255,255,255,0.7);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s;
  }
  .t-link-plain:hover { color: #a3e635; }
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
      <div className="t-in t-d1 mb-9">
        <div
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(163,230,53,0.6)",
            fontFamily: "var(--font-mono)",
            marginBottom: "0.75rem",
          }}
        >
          // AUTH_MODULE
        </div>
        <h2
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "2.8rem",
            color: "#fafaf9",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          SIGN IN
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
          Access your dispatch workspace
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
        {/* Email */}
        <div className="t-in t-d2" style={{ marginBottom: "1.25rem" }}>
          <label className="t-label">Email_Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@yourlimo.com"
            required
            autoFocus
            className="t-input"
          />
        </div>

        {/* Password */}
        <div className="t-in t-d3" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <label className="t-label" style={{ margin: 0 }}>Password</label>
            <Link href="/auth/forgot-password" className="t-link" style={{ fontSize: "0.62rem", letterSpacing: "0.1em" }}>
              RESET →
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            className="t-input"
          />
        </div>

        {/* Submit */}
        <div className="t-in t-d4">
          <button type="submit" disabled={loading} className="t-btn">
            {loading ? "AUTHENTICATING..." : "SIGN IN →"}
          </button>
        </div>
      </form>

      {/* Divider */}
      <div
        className="t-in t-d5"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          margin: "1.75rem 0",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
          OR
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      <p
        className="t-in t-d5"
        style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.25)",
          letterSpacing: "0.02em",
        }}
      >
        No account?{" "}
        <Link href="/auth/signup" className="t-link-plain">
          Register operator →
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
