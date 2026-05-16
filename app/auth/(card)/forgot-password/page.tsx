"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const RESEND_COOLDOWN = 60

const S = {
  label: {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#94a3b8",
    marginBottom: "7px",
  } as React.CSSProperties,
  input: {
    width: "100%",
    height: "44px",
    background: "var(--lc-bg-glass)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "0 14px",
    fontSize: "14px",
    color: "#f1f5f9",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  } as React.CSSProperties,
  btn: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: "opacity 0.15s, transform 0.1s",
    fontFamily: "inherit",
    background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)",
    boxShadow: "0 4px 16px rgba(37,99,235,0.3),inset 0 1px 0 var(--lc-border)",
  } as React.CSSProperties,
  error: {
    padding: "10px 14px",
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#fca5a5",
    marginBottom: "16px",
    lineHeight: 1.5,
  } as React.CSSProperties,
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    intervalRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(intervalRef.current!); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      // Always show success — don't reveal if email exists (anti-enumeration)
      setSent(true)
      startCooldown()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return
    setLoading(true)
    setError("")
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      startCooldown()
    } catch {
      setError("Failed to resend. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div>
        {/* Success icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                stroke="#10b981" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#f1f5f9", textAlign: "center", letterSpacing: "-0.02em" }}>
          Check your inbox
        </h2>
        <p style={{ margin: "0 0 6px", fontSize: "14px", color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
          If <strong style={{ color: "#cbd5e1" }}>{email}</strong> is registered, you&apos;ll receive a reset link shortly.
        </p>
        <p style={{ margin: "0 0 28px", fontSize: "13px", color: "#64748b", textAlign: "center", lineHeight: 1.5 }}>
          The link expires in <strong style={{ color: "#94a3b8" }}>1 hour</strong>. Check your spam folder if you don&apos;t see it.
        </p>

        {error && <div style={S.error}>{error}</div>}

        {/* Resend */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          {cooldown > 0 ? (
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
              Resend available in <strong style={{ color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{cooldown}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                background: "none", border: "none", padding: 0,
                fontSize: "13px", color: "#c9a87c", cursor: "pointer",
                fontFamily: "inherit", fontWeight: 600, opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Sending…" : "Resend email"}
            </button>
          )}
        </div>

        <div style={{ height: "1px", background: "var(--lc-bg-glass-mid)", marginBottom: "20px" }} />

        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", textAlign: "center" }}>
          <button
            onClick={() => { setSent(false); setError(""); setTimeout(() => inputRef.current?.focus(), 50) }}
            style={{ background: "none", border: "none", padding: 0, fontSize: "13px", color: "#94a3b8", cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Try a different email
          </button>
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
        Reset your password
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
        Enter your email and we&apos;ll send you a secure reset link.
      </p>

      {error && <div style={S.error}>{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="email" style={S.label}>Email address</label>
          <input
            id="email"
            ref={inputRef}
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError("") }}
            placeholder="you@yourlimo.com"
            autoComplete="email"
            autoFocus
            required
            style={S.input}
            onFocus={e => {
              e.target.style.borderColor = "rgba(201,168,124,0.5)"
              e.target.style.boxShadow = "0 0 0 3px rgba(201,168,124,0.1)"
            }}
            onBlur={e => {
              e.target.style.borderColor = "rgba(255,255,255,0.1)"
              e.target.style.boxShadow = "none"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim()}
          style={{
            ...S.btn,
            opacity: loading || !email.trim() ? 0.55 : 1,
            cursor: loading || !email.trim() ? "not-allowed" : "pointer",
          }}
          onMouseEnter={e => { if (!loading && email.trim()) (e.target as HTMLElement).style.opacity = "0.88" }}
          onMouseLeave={e => { (e.target as HTMLElement).style.opacity = loading || !email.trim() ? "0.55" : "1" }}
          onMouseDown={e => { (e.target as HTMLElement).style.transform = "scale(0.98)" }}
          onMouseUp={e => { (e.target as HTMLElement).style.transform = "scale(1)" }}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <p style={{ margin: "20px 0 0", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
        Remember your password?{" "}
        <Link href="/auth/login" style={{ color: "#c9a87c", textDecoration: "none", fontWeight: 600 }}>
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
