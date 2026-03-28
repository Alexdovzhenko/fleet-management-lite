"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  .lx  { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .d1  { animation-delay: 0.05s; }
  .d2  { animation-delay: 0.12s; }
  .d3  { animation-delay: 0.19s; }
  .d4  { animation-delay: 0.26s; }
  .d5  { animation-delay: 0.33s; }

  .f { position: relative; padding-top: 20px; }
  .f label {
    position: absolute;
    top: 22px; left: 0;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.82rem;
    font-weight: 400;
    color: rgba(200,212,228,0.32);
    letter-spacing: 0.04em;
    pointer-events: none;
    transition: top 0.22s ease, font-size 0.22s ease, color 0.22s ease, letter-spacing 0.22s ease;
  }
  .f input:focus ~ label,
  .f input:not(:placeholder-shown) ~ label {
    top: 2px;
    font-size: 0.58rem;
    color: #c9a87c;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .fi {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding: 10px 0;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.9375rem;
    font-weight: 400;
    color: rgba(255,255,255,0.88);
    outline: none;
    transition: border-color 0.22s ease;
    letter-spacing: 0.01em;
  }
  .fi::placeholder { color: transparent; }
  .fi:focus { border-bottom-color: rgba(201,168,124,0.55); }
  .f::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: linear-gradient(90deg, #c9a87c, #e0c090);
    transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
  }
  .f:focus-within::after { width: 100%; }

  .btn-primary {
    width: 100%;
    padding: 15px 24px;
    background: #c9a87c;
    color: #070a0f;
    border: none;
    cursor: pointer;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  }
  .btn-primary:hover:not(:disabled) {
    background: #d4b98c;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(201,168,124,0.28);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .btn-primary:disabled { opacity: 0.28; cursor: not-allowed; }

  .lk {
    color: #c9a87c;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid rgba(201,168,124,0.3);
    transition: color 0.2s, border-color 0.2s;
    padding-bottom: 1px;
  }
  .lk:hover { color: #e0c090; border-color: rgba(224,192,144,0.5); }

  .err-box {
    padding: 11px 14px;
    background: rgba(220,60,60,0.08);
    border: 1px solid rgba(220,60,60,0.22);
    border-radius: 4px;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.78rem;
    color: rgba(255,160,140,0.9);
    letter-spacing: 0.01em;
  }

  .success-icon {
    width: 52px; height: 52px;
    border-radius: 50%;
    background: rgba(201,168,124,0.1);
    border: 1px solid rgba(201,168,124,0.3);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
    animation: fade-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }
`

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSent(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ textAlign: "center" }}>
          <div className="success-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a87c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="lx d1" style={{ fontFamily: "var(--font-cormorant, Georgia)", fontSize: "1.55rem", fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em", marginBottom: "10px" }}>
            Check your inbox
          </div>
          <div className="lx d2" style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.82rem", color: "rgba(200,212,228,0.48)", lineHeight: 1.65, marginBottom: "6px" }}>
            We sent a reset link to
          </div>
          <div className="lx d3" style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.88rem", color: "rgba(201,168,124,0.9)", marginBottom: "28px" }}>
            {email}
          </div>
          <div className="lx d4" style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.72rem", color: "rgba(200,212,228,0.32)", letterSpacing: "0.03em" }}>
            Didn&apos;t receive it?{" "}
            <button
              onClick={() => setSent(false)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <span className="lk" style={{ fontSize: "0.72rem" }}>Try again</span>
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>

      <div className="lx d1" style={{ fontFamily: "var(--font-cormorant, Georgia)", fontSize: "1.7rem", fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "0.01em", marginBottom: "8px" }}>
        Reset password
      </div>
      <div className="lx d2" style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.82rem", color: "rgba(200,212,228,0.42)", letterSpacing: "0.02em", marginBottom: "32px", lineHeight: 1.6 }}>
        Enter your email and we&apos;ll send you a reset link.
      </div>

      {error && (
        <div className="lx d2 err-box" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div className="lx d3 f">
          <input
            className="fi"
            type="email"
            id="fp-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            autoComplete="email"
          />
          <label htmlFor="fp-email">Email address</label>
        </div>

        <div className="lx d4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </div>
      </form>

      <div className="lx d5" style={{ textAlign: "center", marginTop: "28px", fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.72rem", color: "rgba(200,212,228,0.32)", letterSpacing: "0.03em" }}>
        Remember your password?{" "}
        <Link href="/auth/login" className="lk" style={{ fontSize: "0.72rem" }}>
          Back to sign in
        </Link>
      </div>
    </>
  )
}
