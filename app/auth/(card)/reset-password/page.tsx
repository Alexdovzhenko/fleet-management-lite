"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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
    padding: "0 44px 0 14px",
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

function getStrength(pw: string): { level: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { level: 0, label: "", color: "transparent" }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { level: 1, label: "Weak", color: "#ef4444" }
  if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" }
  if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" }
  return { level: 4, label: "Strong", color: "#10b981" }
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  const strength = getStrength(password)
  const mismatch = confirm.length > 0 && password !== confirm

  // Check if we have a valid recovery session
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }
    if (strength.level < 2) { setError("Please choose a stronger password."); return }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) { setError(updateError.message); return }
      setSuccess(true)
      setTimeout(() => { router.push("/dispatch"); router.refresh() }, 2000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // No session / invalid token
  if (hasSession === false) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            width: "52px", height: "52px", borderRadius: "14px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Link expired or invalid
        </h2>
        <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
          This password reset link has expired or already been used. Please request a new one.
        </p>
        <Link
          href="/auth/forgot-password"
          style={{
            display: "inline-block", padding: "12px 28px",
            background: "linear-gradient(135deg,#2563eb 0%,#4f46e5 100%)",
            borderRadius: "10px", fontSize: "14px", fontWeight: 600,
            color: "#fff", textDecoration: "none",
            boxShadow: "0 4px 16px rgba(37,99,235,0.3)",
          }}
        >
          Request new link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "16px",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
          Password updated!
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
          Your password has been changed. Redirecting you to the dashboard…
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: 700, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
        Set new password
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
        Choose a strong password for your account.
      </p>

      {error && <div style={S.error}>{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* New password */}
        <div style={{ marginBottom: "16px" }}>
          <label htmlFor="new-password" style={S.label}>New password</label>
          <div style={{ position: "relative" }}>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => { setPassword(e.target.value); setError("") }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
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
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              tabIndex={-1}
              style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", padding: "4px", cursor: "pointer",
                color: "#64748b", display: "flex", alignItems: "center",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>

          {/* Strength meter */}
          {password.length > 0 && (
            <div style={{ marginTop: "8px" }}>
              <div style={{ display: "flex", gap: "4px", marginBottom: "5px" }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: "3px", borderRadius: "99px",
                    background: i <= strength.level ? strength.color : "rgba(255,255,255,0.1)",
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: strength.color, fontWeight: 600 }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="confirm-password" style={S.label}>Confirm password</label>
          <div style={{ position: "relative" }}>
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError("") }}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              style={{
                ...S.input,
                borderColor: mismatch ? "rgba(239,68,68,0.4)" : undefined,
              }}
              onFocus={e => {
                if (!mismatch) {
                  e.target.style.borderColor = "rgba(201,168,124,0.5)"
                  e.target.style.boxShadow = "0 0 0 3px rgba(201,168,124,0.1)"
                }
              }}
              onBlur={e => {
                e.target.style.borderColor = mismatch ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"
                e.target.style.boxShadow = "none"
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(s => !s)}
              tabIndex={-1}
              style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", padding: "4px", cursor: "pointer",
                color: "#64748b", display: "flex", alignItems: "center",
              }}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              <EyeIcon show={showConfirm} />
            </button>
          </div>
          {mismatch && (
            <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#f87171" }}>Passwords don&apos;t match</p>
          )}
          {confirm.length > 0 && !mismatch && (
            <p style={{ margin: "5px 0 0", fontSize: "12px", color: "#10b981" }}>✓ Passwords match</p>
          )}
        </div>

        {/* Requirements */}
        <div style={{ marginBottom: "20px", display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
          {[
            { label: "8+ chars", met: password.length >= 8 },
            { label: "Uppercase", met: /[A-Z]/.test(password) },
            { label: "Number", met: /[0-9]/.test(password) },
            { label: "Special char", met: /[^A-Za-z0-9]/.test(password) },
          ].map(r => (
            <span key={r.label} style={{
              fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "99px",
              background: r.met ? "rgba(16,185,129,0.1)" : "var(--lc-bg-glass)",
              color: r.met ? "#10b981" : "#64748b",
              border: `1px solid ${r.met ? "rgba(16,185,129,0.25)" : "var(--lc-bg-glass-hover)"}`,
              transition: "all 0.15s",
            }}>
              {r.met ? "✓ " : ""}{r.label}
            </span>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || password.length < 8 || password !== confirm}
          style={{
            ...S.btn,
            opacity: loading || password.length < 8 || password !== confirm ? 0.55 : 1,
            cursor: loading || password.length < 8 || password !== confirm ? "not-allowed" : "pointer",
          }}
          onMouseDown={e => { if (!loading) (e.target as HTMLElement).style.transform = "scale(0.98)" }}
          onMouseUp={e => { (e.target as HTMLElement).style.transform = "scale(1)" }}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>

      <p style={{ margin: "20px 0 0", fontSize: "13px", color: "#64748b", textAlign: "center" }}>
        <Link href="/auth/login" style={{ color: "#c9a87c", textDecoration: "none", fontWeight: 600 }}>
          ← Back to sign in
        </Link>
      </p>
    </div>
  )
}
