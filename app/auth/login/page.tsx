"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

/* ─────────────────────────────────────────────────────────────────────────────
   STYLES  — route flow, entrance animations, floating labels
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
  /* Route flow — dashes travel along path */
  @keyframes flow-fwd {
    from { stroke-dashoffset: 13; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes flow-rev {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: 13; }
  }
  /* Slower, longer dash variant */
  @keyframes flow-slow {
    from { stroke-dashoffset: 22; }
    to   { stroke-dashoffset: 0; }
  }

  /* Staggered form entrance */
  @keyframes rise {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .lx  { animation: rise 0.7s cubic-bezier(0.16,1,0.3,1) both; }
  .d1  { animation-delay: 0.05s; }
  .d2  { animation-delay: 0.12s; }
  .d3  { animation-delay: 0.19s; }
  .d4  { animation-delay: 0.26s; }
  .d5  { animation-delay: 0.33s; }
  .d6  { animation-delay: 0.40s; }
  .d7  { animation-delay: 0.47s; }

  /* ── Floating label field ── */
  .f {
    position: relative;
    padding-top: 20px;
  }
  .f label {
    position: absolute;
    top: 22px; left: 0;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.82rem;
    font-weight: 400;
    color: rgba(51,65,85,0.42);
    letter-spacing: 0.04em;
    pointer-events: none;
    transition:
      top 0.22s ease,
      font-size 0.22s ease,
      color 0.22s ease,
      letter-spacing 0.22s ease;
  }
  .f input:focus ~ label,
  .f input:not(:placeholder-shown) ~ label {
    top: 2px;
    font-size: 0.58rem;
    color: #a07840;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .fi {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(51,65,85,0.15);
    padding: 10px 0;
    font-family: var(--font-outfit, system-ui);
    font-size: 0.9375rem;
    font-weight: 400;
    color: #0f172a;
    outline: none;
    transition: border-color 0.22s ease;
    letter-spacing: 0.01em;
  }
  .fi::placeholder { color: transparent; }
  .fi:focus { border-bottom-color: rgba(201,168,124,0.6); }

  /* Gold underline sweep on focus */
  .f::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 0; height: 1px;
    background: linear-gradient(90deg, #c9a87c, #e0c090);
    transition: width 0.35s cubic-bezier(0.4,0,0.2,1);
  }
  .f:focus-within::after { width: 100%; }

  /* ── Primary CTA button ── */
  .btn-primary {
    width: 100%;
    padding: 15px 24px;
    background: #0d0d0d;
    color: #c9a87c;
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
    background: #1c1c1c;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(13,13,13,0.18);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
  .btn-primary:disabled { opacity: 0.28; cursor: not-allowed; }

  /* ── Links ── */
  .lk {
    color: #0d0d0d;
    text-decoration: none;
    font-weight: 500;
    border-bottom: 1px solid rgba(0,0,0,0.14);
    transition: color 0.2s, border-color 0.2s;
    padding-bottom: 1px;
  }
  .lk:hover { color: #c9a87c; border-color: rgba(201,168,124,0.4); }
  .lk-dim {
    color: rgba(71,85,105,0.55);
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    border-bottom: 1px solid rgba(71,85,105,0.12);
    transition: color 0.2s, border-color 0.2s;
    padding-bottom: 1px;
  }
  .lk-dim:hover { color: #a07840; border-color: rgba(160,120,64,0.35); }

  /* ── Mobile: form fills screen, map is subtle BG ── */
  @media (max-width: 720px) {
    .map-wrap  { opacity: 0.18 !important; }
    .grad-veil { background: rgba(240,244,248,0.94) !important; }
    .form-side {
      width: 100% !important;
      padding-left: clamp(1.5rem,5vw,2.5rem) !important;
      padding-right: clamp(1.5rem,5vw,2.5rem) !important;
    }
  }
`

/* ─────────────────────────────────────────────────────────────────────────────
   MAP PINS — reusable pulsing dispatch marker
───────────────────────────────────────────────────────────────────────────── */
function Pin({ cx, cy, delay = "0s", size = 7 }: { cx: number; cy: number; delay?: string; size?: number }) {
  return (
    <g>
      {/* Outer pulse ring */}
      <circle cx={cx} cy={cy} r={size + 7} stroke="rgba(201,168,124,0.22)" strokeWidth="1" fill="none">
        <animate attributeName="r" values={`${size + 7};${size + 20};${size + 7}`} dur="2.8s" begin={delay} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7" dur="2.8s" begin={delay} repeatCount="indefinite" />
      </circle>
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={size} stroke="#c9a87c" strokeWidth="1.4" fill="rgba(201,168,124,0.1)" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.38} fill="#c9a87c" />
    </g>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN FORM — inner component (needs useSearchParams → Suspense wrapper)
───────────────────────────────────────────────────────────────────────────── */
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
            ? "Incorrect email or password."
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
    <div style={{
      width: "100%",
      height: "100vh",
      position: "relative",
      overflow: "hidden",
      background: "#f0f4f8",
      fontFamily: "var(--font-outfit, system-ui)",
    }}>
      <style>{STYLES}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 1 — CITY MAP SVG
          Tesla-style navigation: light background, clean road network,
          animated gold dispatch routes, pulsing pickup/dropoff pins.
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="map-wrap" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          style={{ width: "100%", height: "100%", display: "block" }}
          aria-hidden
        >
          <defs>
            {/* Gold glow for routes and pins */}
            <filter id="glow-r" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-pin" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Subtle vignette */}
            <radialGradient id="vignette" cx="65%" cy="55%" r="72%">
              <stop offset="0%" stopColor="rgba(240,244,248,0)" />
              <stop offset="100%" stopColor="rgba(215,225,236,0.28)" />
            </radialGradient>
          </defs>

          {/* Base fill */}
          <rect width="1440" height="900" fill="#f0f4f8" />

          {/* ── Block fills — districts & zones ── */}
          {/* Subtle park/green zone */}
          <rect x="504" y="264" width="192" height="192" fill="rgba(187,247,208,0.14)" />
          {/* Water/terminal zone bottom-right */}
          <rect x="1020" y="624" width="360" height="252" fill="rgba(186,230,253,0.12)" />
          {/* Dense district top-right */}
          <rect x="984" y="24" width="432" height="216" fill="rgba(226,232,240,0.35)" />

          {/* ── Secondary horizontal streets ── */}
          {[60, 120, 180, 300, 420, 600, 660, 780, 840].map(y => (
            <line key={`sh${y}`} x1="0" y1={y} x2="1440" y2={y}
              stroke="rgba(148,163,184,0.2)" strokeWidth="0.75" />
          ))}

          {/* ── Secondary vertical streets ── */}
          {[60, 120, 180, 300, 420, 540, 660, 780, 900, 1020, 1140, 1260, 1380].map(x => (
            <line key={`sv${x}`} x1={x} y1="0" x2={x} y2="900"
              stroke="rgba(148,163,184,0.2)" strokeWidth="0.75" />
          ))}

          {/* ── Primary horizontal arteries ── */}
          {[240, 480, 720].map(y => (
            <line key={`ph${y}`} x1="0" y1={y} x2="1440" y2={y}
              stroke="rgba(100,116,139,0.3)" strokeWidth="2" />
          ))}

          {/* ── Primary vertical arteries ── */}
          {[240, 480, 720, 960, 1200].map(x => (
            <line key={`pv${x}`} x1={x} y1="0" x2={x} y2="900"
              stroke="rgba(100,116,139,0.3)" strokeWidth="2" />
          ))}

          {/* ── Intersection dots at primary crossings ── */}
          {[240, 480, 720].flatMap(y =>
            [240, 480, 720, 960, 1200].map(x => (
              <circle key={`id${x}-${y}`} cx={x} cy={y} r="2.5"
                fill="rgba(100,116,139,0.22)" />
            ))
          )}

          {/* ── Diagonal avenues ── */}
          <path d="M 0,900 L 480,0" stroke="rgba(100,116,139,0.16)" strokeWidth="1.5" />
          <path d="M 240,900 L 840,0" stroke="rgba(100,116,139,0.11)" strokeWidth="1" />
          <path d="M 1080,900 L 1440,330" stroke="rgba(100,116,139,0.13)" strokeWidth="1.2" />
          <path d="M 1440,720 L 840,0" stroke="rgba(100,116,139,0.09)" strokeWidth="0.9" />

          {/* ── Organic curved roads (park perimeter, ramps) ── */}
          <path d="M 480,480 Q 540,390 600,360" stroke="rgba(100,116,139,0.18)" strokeWidth="1.2" fill="none" />
          <path d="M 1200,720 Q 1110,665 1080,600" stroke="rgba(100,116,139,0.14)" strokeWidth="1" fill="none" />
          <path d="M 720,0 Q 740,120 720,240" stroke="rgba(100,116,139,0.2)" strokeWidth="1.8" fill="none" />

          {/* ════════════════════════════════
              ANIMATED DISPATCH ROUTES
          ════════════════════════════════ */}

          {/* ── Motion path for animateMotion (invisible) ── */}
          <path id="route-motion"
            d="M 1380,840 L 1200,840 L 1200,720 L 960,720 L 960,480 L 720,480 L 720,240 L 480,240"
            fill="none" />

          {/* ── Route Alpha — main dispatch, gold glow + flowing dashes ── */}
          {/* Soft glow halo beneath */}
          <path
            d="M 1380,840 L 1200,840 L 1200,720 L 960,720 L 960,480 L 720,480 L 720,240 L 480,240"
            stroke="rgba(201,168,124,0.22)" strokeWidth="12" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            filter="url(#glow-r)"
          />
          {/* Main route line */}
          <path
            d="M 1380,840 L 1200,840 L 1200,720 L 960,720 L 960,480 L 720,480 L 720,240 L 480,240"
            stroke="#c9a87c" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="8,5"
            style={{ animation: "flow-fwd 1.3s linear infinite" }}
          />

          {/* ── Route Beta — secondary, subtler ── */}
          <path
            d="M 1380,480 L 1200,480 L 1200,240 L 960,240 L 960,120"
            stroke="rgba(201,168,124,0.45)" strokeWidth="1.6" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="6,5"
            style={{ animation: "flow-rev 1.7s linear infinite" }}
          />

          {/* ── Route Gamma — short branch ── */}
          <path
            d="M 960,840 L 960,720 L 1200,720"
            stroke="rgba(201,168,124,0.32)" strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="5,5"
            style={{ animation: "flow-fwd 2s linear infinite" }}
          />

          {/* ── Route Delta — far right feeder ── */}
          <path
            d="M 1440,480 L 1380,480 L 1380,720 L 1200,720"
            stroke="rgba(201,168,124,0.25)" strokeWidth="1.2" fill="none"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="5,6"
            style={{ animation: "flow-slow 2.4s linear infinite" }}
          />

          {/* ════════════════════════════════
              MOVING VEHICLE DOT — Route Alpha
          ════════════════════════════════ */}
          {/* Lead vehicle */}
          <circle r="6" fill="#c9a87c" filter="url(#glow-pin)">
            <animateMotion dur="14s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>
          {/* Trail dot 1 */}
          <circle r="3.5" fill="rgba(201,168,124,0.65)">
            <animateMotion dur="14s" begin="-1.1s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>
          {/* Trail dot 2 */}
          <circle r="2" fill="rgba(201,168,124,0.35)">
            <animateMotion dur="14s" begin="-2s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>

          {/* ════════════════════════════════
              DISPATCH PINS — pickup & dropoff
          ════════════════════════════════ */}
          <g filter="url(#glow-pin)">
            {/* Pickup — top-center */}
            <Pin cx={480} cy={240} delay="0s" size={7} />
            {/* Dropoff — bottom-right */}
            <Pin cx={1380} cy={840} delay="1.4s" size={7} />
          </g>

          {/* Minor active dispatch nodes */}
          <circle cx={960} cy={240} r="5" stroke="rgba(201,168,124,0.5)" strokeWidth="1.2"
            fill="rgba(201,168,124,0.08)" />
          <circle cx={1200} cy={480} r="4" stroke="rgba(201,168,124,0.42)" strokeWidth="1.2"
            fill="rgba(201,168,124,0.07)" />
          <circle cx={720} cy={720} r="4" stroke="rgba(201,168,124,0.38)" strokeWidth="1"
            fill="rgba(201,168,124,0.06)" />
          <circle cx={960} cy={720} r="3.5" stroke="rgba(201,168,124,0.35)" strokeWidth="1"
            fill="rgba(201,168,124,0.06)" />

          {/* ── Street label text ── */}
          <text x="1210" y="235" fill="rgba(71,85,105,0.28)" fontSize="9.5"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.1em">
            PARK AVE N
          </text>
          <text x="730" y="476" fill="rgba(71,85,105,0.28)" fontSize="9.5"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.1em"
            transform="rotate(-90 730 476)" textAnchor="middle">
            5TH AVENUE
          </text>
          <text x="978" y="835" fill="rgba(71,85,105,0.24)" fontSize="9"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.08em">
            TERMINAL DR
          </text>
          <text x="490" y="235" fill="rgba(71,85,105,0.26)" fontSize="9"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.1em">
            PICKUP
          </text>
          <text x="1300" y="856" fill="rgba(71,85,105,0.26)" fontSize="9"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.1em">
            DESTINATION
          </text>

          {/* Vignette overlay inside SVG */}
          <rect width="1440" height="900" fill="url(#vignette)" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 2 — WHITE GRADIENT VEIL
          Creates clean reading zone on the left where the form lives.
          Fades naturally into the visible map on the right.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="grad-veil"
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
          background: [
            "linear-gradient(90deg,",
            "rgba(240,244,248,1) 0%,",
            "rgba(240,244,248,0.99) 25%,",
            "rgba(240,244,248,0.94) 42%,",
            "rgba(240,244,248,0.72) 55%,",
            "rgba(240,244,248,0.22) 68%,",
            "rgba(240,244,248,0) 78%)",
          ].join(" "),
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 3 — BRAND MARK  (top-left)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="lx d1"
        style={{
          position: "absolute",
          top: "clamp(1.5rem, 3.5vh, 2.75rem)",
          left: "clamp(2rem, 5vw, 4.5rem)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "11px",
        }}
      >
        {/* Diamond monogram */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="5" y="5" width="12" height="12" stroke="rgba(201,168,124,0.75)" strokeWidth="1.2"
            transform="rotate(45 11 11)" fill="none" />
          <circle cx="11" cy="11" r="2.2" fill="#c9a87c" />
        </svg>
        <span style={{
          fontFamily: "var(--font-outfit, system-ui)",
          fontSize: "0.6rem",
          fontWeight: 500,
          color: "#0d0d0d",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
        }}>
          Livery Connect
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 4 — FORM  (left-aligned, floats in gradient zone)
          NOT a card — the form breathes directly in clean white space.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="form-side"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "clamp(360px, 42%, 500px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "clamp(2rem, 5vw, 4.5rem)",
          paddingRight: "clamp(1.5rem, 3vw, 2.5rem)",
          paddingTop: "5rem",
          paddingBottom: "3rem",
          zIndex: 10,
        }}
      >

        {/* ── Heading block ── */}
        <div className="lx d2" style={{ marginBottom: "2.75rem" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "1.2rem" }}>
            <div style={{ width: "26px", height: "1px", background: "#c9a87c", flexShrink: 0 }} />
            <span style={{
              fontFamily: "var(--font-outfit, system-ui)",
              fontSize: "0.57rem",
              fontWeight: 500,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(160,120,64,0.8)",
            }}>
              Member Access
            </span>
          </div>

          {/* Main heading */}
          <h1 style={{
            fontFamily: "var(--font-cormorant, serif)",
            fontSize: "clamp(2.4rem, 3.8vw, 3.2rem)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#0d0d0d",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            marginBottom: "0.9rem",
          }}>
            Welcome back
          </h1>

          {/* Sub-copy */}
          <p style={{
            fontFamily: "var(--font-outfit, system-ui)",
            fontSize: "0.82rem",
            color: "rgba(71,85,105,0.55)",
            fontWeight: 300,
            letterSpacing: "0.01em",
            lineHeight: 1.6,
          }}>
            Sign in to your dispatch console
          </p>
        </div>

        {/* ── Error message ── */}
        {error && (
          <div style={{
            marginBottom: "1.5rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid rgba(180,50,50,0.15)",
            display: "flex", alignItems: "center", gap: "9px",
          }}>
            <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#c0392b", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.78rem", color: "#c0392b" }}>
              {error}
            </span>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="lx d3 f" style={{ marginBottom: "1.8rem" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoFocus
              className="fi"
              id="lx-email"
            />
            <label htmlFor="lx-email">Email address</label>
          </div>

          {/* Password */}
          <div className="lx d4 f" style={{ marginBottom: "0.5rem" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="fi"
              id="lx-pass"
            />
            <label htmlFor="lx-pass">Password</label>
          </div>

          {/* Forgot password */}
          <div className="lx d4" style={{ textAlign: "right", marginBottom: "2.6rem" }}>
            <Link
              href="/auth/forgot-password"
              className="lk-dim"
              style={{ fontFamily: "var(--font-outfit, system-ui)" }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <div className="lx d5">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        {/* ── Divider ── */}
        <div className="lx d6" style={{ display: "flex", alignItems: "center", gap: "1.2rem", margin: "1.8rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(71,85,105,0.1)" }} />
          <span style={{
            fontFamily: "var(--font-outfit, system-ui)",
            fontSize: "0.6rem",
            color: "rgba(71,85,105,0.3)",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(71,85,105,0.1)" }} />
        </div>

        {/* ── Signup link ── */}
        <p className="lx d7" style={{
          fontFamily: "var(--font-outfit, system-ui)",
          fontSize: "0.8rem",
          color: "rgba(71,85,105,0.48)",
          fontWeight: 300,
          textAlign: "center",
        }}>
          New to Livery Connect?{" "}
          <Link href="/auth/signup" className="lk">Create an account</Link>
        </p>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          LAYER 5 — LIVE DISPATCH TICKER  (bottom-right corner, atmospheric)
          Subtle data overlay that reinforces the "active platform" feeling.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="lx d3"
        style={{
          position: "absolute",
          bottom: "clamp(1.5rem, 3vh, 2.5rem)",
          right: "clamp(1.5rem, 3vw, 3rem)",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
          pointerEvents: "none",
        }}
      >
        {[
          { label: "Active Routes", value: "14" },
          { label: "En Route", value: "9" },
          { label: "Available", value: "5" },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              fontFamily: "var(--font-outfit, system-ui)",
              fontSize: "0.58rem",
              fontWeight: 400,
              color: "rgba(71,85,105,0.4)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              {label}
            </span>
            <span style={{
              fontFamily: "var(--font-cormorant, serif)",
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "rgba(201,168,124,0.7)",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}>
              {value}
            </span>
          </div>
        ))}
        <div style={{ width: "100%", height: "1px", background: "rgba(201,168,124,0.2)", marginTop: "2px" }} />
        <span style={{
          fontFamily: "var(--font-outfit, system-ui)",
          fontSize: "0.52rem",
          color: "rgba(71,85,105,0.3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          Live · NYC Metro
        </span>
      </div>

    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
