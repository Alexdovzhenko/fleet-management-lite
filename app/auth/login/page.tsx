"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const STYLES = `
  @keyframes flow-fwd {
    from { stroke-dashoffset: 13; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes flow-rev {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: 13; }
  }
  @keyframes flow-slow {
    from { stroke-dashoffset: 22; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(1.4); }
  }
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
    color: var(--lc-text-primary);
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
  .lk-dim {
    color: var(--lc-text-muted);
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.03em;
    border-bottom: 1px solid rgba(200,212,228,0.1);
    transition: color 0.2s, border-color 0.2s;
    padding-bottom: 1px;
  }
  .lk-dim:hover { color: #c9a87c; border-color: rgba(201,168,124,0.35); }

  @media (max-width: 720px) {
    .map-wrap  { opacity: 0.22 !important; }
    .grad-veil { background: rgba(8,12,22,0.94) !important; }
    .form-side {
      width: 100% !important;
      padding-left: clamp(1.5rem,5vw,2.5rem) !important;
      padding-right: clamp(1.5rem,5vw,2.5rem) !important;
    }
  }
`

function Pin({ cx, cy, delay = "0s", size = 7 }: { cx: number; cy: number; delay?: string; size?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={size + 7} stroke="rgba(201,168,124,0.22)" strokeWidth="1" fill="none">
        <animate attributeName="r" values={`${size + 7};${size + 20};${size + 7}`} dur="2.8s" begin={delay} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0;0.7" dur="2.8s" begin={delay} repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r={size} stroke="#c9a87c" strokeWidth="1.4" fill="rgba(201,168,124,0.12)" />
      <circle cx={cx} cy={cy} r={size * 0.38} fill="#c9a87c" />
    </g>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next") || "/dispatch"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
        setError(signInError.message === "Invalid login credentials" ? "Incorrect email or password." : signInError.message)
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
    <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden", background: "var(--lc-bg-page)", fontFamily: "var(--font-outfit, system-ui)" }}>
      <style>{STYLES}</style>

      {/* ══ LAYER 1 — DARK CITY MAP ══ */}
      <div className="map-wrap" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
          style={{ width: "100%", height: "100%", display: "block" }} aria-hidden>
          <defs>
            <filter id="glow-r" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glow-pin" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="poi-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.55)" />
            </filter>
            <radialGradient id="vignette" cx="65%" cy="55%" r="72%">
              <stop offset="0%" stopColor="rgba(8,12,22,0)" />
              <stop offset="100%" stopColor="rgba(4,7,14,0.45)" />
            </radialGradient>
            {/* Subtle grid glow for depth */}
            <radialGradient id="center-glow" cx="72%" cy="50%" r="55%">
              <stop offset="0%" stopColor="rgba(201,168,124,0.03)" />
              <stop offset="100%" stopColor="rgba(201,168,124,0)" />
            </radialGradient>
          </defs>

          {/* Base */}
          <rect width="1440" height="900" fill="var(--lc-bg-page)" />
          {/* Center warm glow — city light bloom */}
          <rect width="1440" height="900" fill="url(#center-glow)" />

          {/* ══ WATER ══ */}
          <path d="M 1295,0 L 1440,0 L 1440,900 L 1295,900
            C 1268,820 1255,730 1275,640 C 1292,555 1315,470 1288,385
            C 1265,305 1248,215 1278,128 C 1290,62 1295,28 1295,0 Z"
            fill="rgba(8,30,62,0.9)" />
          <path d="M 1440,762 L 1440,900 L 820,900 L 820,876
            Q 930,854 1052,869 Q 1168,882 1270,856 Q 1362,833 1440,762 Z"
            fill="rgba(8,30,62,0.85)" />
          {/* Harbor shimmer lines */}
          {[330, 470, 605, 710].map(y => (
            <line key={`wl${y}`} x1="1292" y1={y} x2="1432" y2={y}
              stroke="rgba(40,100,180,0.18)" strokeWidth="0.8" />
          ))}
          <text x="1363" y="582" fill="rgba(60,120,200,0.3)" fontSize="8.5"
            fontFamily="system-ui" letterSpacing="0.14em" textAnchor="middle">HARBOR</text>

          {/* ══ ZONES ══ */}
          {/* City Park */}
          <rect x="504" y="246" width="212" height="228" rx="4" fill="rgba(15,40,22,0.85)" />
          <path d="M 520,302 Q 576,280 622,318 Q 662,354 706,340"
            stroke="rgba(40,100,55,0.3)" strokeWidth="1.2" fill="none" />
          <path d="M 504,374 Q 558,356 600,386 Q 640,412 716,400"
            stroke="rgba(40,100,55,0.22)" strokeWidth="1" fill="none" />
          <text x="610" y="374" fill="rgba(60,160,80,0.28)" fontSize="8.5"
            fontFamily="system-ui" letterSpacing="0.1em" textAnchor="middle">CITY PARK</text>
          {/* Small parks */}
          <rect x="960" y="108" width="132" height="82" rx="3" fill="rgba(15,40,22,0.7)" />
          <rect x="1200" y="242" width="72" height="176" rx="2" fill="rgba(15,40,22,0.6)" />

          {/* Airport grounds */}
          <rect x="788" y="626" width="478" height="256" rx="5" fill="rgba(14,22,38,0.88)" />
          <rect x="788" y="626" width="478" height="256" rx="5"
            fill="none" stroke="var(--lc-bg-glass-mid)" strokeWidth="1.2" strokeDasharray="7,5" />
          {/* Runway 1 */}
          <line x1="810" y1="856" x2="1242" y2="646"
            stroke="rgba(30,42,65,1)" strokeWidth="12" strokeLinecap="round" />
          <line x1="810" y1="856" x2="1242" y2="646"
            stroke="var(--lc-border)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="18,14" />
          {/* Runway 2 */}
          <line x1="832" y1="648" x2="1152" y2="858"
            stroke="rgba(30,42,65,0.9)" strokeWidth="9" strokeLinecap="round" />
          <line x1="832" y1="648" x2="1152" y2="858"
            stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round" strokeDasharray="14,11" />
          {/* Taxiways */}
          <path d="M 1022,726 L 1022,678 L 1094,678"
            stroke="var(--lc-bg-glass-mid)" strokeWidth="4" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 950,756 L 950,708 L 880,708"
            stroke="var(--lc-bg-glass)" strokeWidth="3.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* Terminal */}
          <rect x="866" y="744" width="150" height="62" rx="4"
            fill="rgba(20,32,52,0.95)" stroke="var(--lc-bg-glass-hover)" strokeWidth="1" />
          <rect x="884" y="756" width="114" height="38" rx="2" fill="rgba(25,38,60,0.6)" />
          {[890,914,938,962,986].map(x => (
            <rect key={`gf${x}`} x={x} y={806} width={17} height={24} rx="1.5"
              fill="rgba(28,44,68,0.8)" />
          ))}
          <text x="984" y="874" fill="var(--lc-text-muted)" fontSize="7.5"
            fontFamily="system-ui" letterSpacing="0.14em" textAnchor="middle">
            INTERNATIONAL AIRPORT
          </text>

          {/* ══ BUILDING BLOCKS ══ */}
          {/* Downtown upper */}
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 10 }, (_, col) => ({
              x: 726 + col * 50 + (row % 2 ? 23 : 0),
              y: 38 + row * 42,
              w: 34 + (col % 3) * 5,
              h: 24 + (row % 2) * 6,
            }))
          ).flat().filter(b => b.x + b.w < 1268).map((b, i) => (
            <rect key={`db${i}`} x={b.x} y={b.y} width={b.w} height={b.h}
              fill="rgba(22,32,52,0.9)" rx="1.5" />
          ))}
          {/* Midtown */}
          {Array.from({ length: 3 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => ({
              x: 724 + col * 54 + (row % 2 ? 26 : 0),
              y: 298 + row * 44,
              w: 38 + (col % 3) * 4,
              h: 26 + (row % 2) * 5,
            }))
          ).flat().filter(b => b.x + b.w < 1268 && !(b.x >= 504 && b.x < 720 && b.y >= 246 && b.y < 478)).map((b, i) => (
            <rect key={`mt${i}`} x={b.x} y={b.y} width={b.w} height={b.h}
              fill="rgba(20,30,48,0.85)" rx="1.5" />
          ))}
          {/* South district */}
          {Array.from({ length: 2 }, (_, row) =>
            Array.from({ length: 8 }, (_, col) => ({
              x: 730 + col * 60,
              y: 504 + row * 48,
              w: 42 + (col % 3) * 4,
              h: 28 + (row % 2) * 6,
            }))
          ).flat().filter(b => b.x + b.w < 1250).map((b, i) => (
            <rect key={`sd${i}`} x={b.x} y={b.y} width={b.w} height={b.h}
              fill="rgba(18,28,44,0.82)" rx="1.5" />
          ))}

          {/* ══ ROAD NETWORK ══ */}
          {/* Local streets H */}
          {[66,106,148,174,208,260,338,380,416,454,508,560,614,652,694].map(y => (
            <line key={`hl${y}`} x1="0" y1={y} x2="1288" y2={y}
              stroke="rgba(255,255,255,0.045)" strokeWidth="0.75" />
          ))}
          {/* Local streets V */}
          {[64,108,152,190,228,266,314,356,398,440,506,560,608,656,704,752,800,836,878,932,968,1016,1062,1106,1150,1194,1252].map(x => (
            <line key={`vl${x}`} x1={x} y1="0" x2={x} y2="900"
              stroke="rgba(255,255,255,0.045)" strokeWidth="0.75" />
          ))}
          {/* Secondary H */}
          {[120, 360, 600].map(y => (
            <line key={`hs${y}`} x1="0" y1={y} x2="1288" y2={y}
              stroke="var(--lc-bg-glass-hover)" strokeWidth="1.2" />
          ))}
          {/* Secondary V */}
          {[300, 540, 840, 1080].map(x => (
            <line key={`vs${x}`} x1={x} y1="0" x2={x} y2="900"
              stroke="var(--lc-bg-glass-hover)" strokeWidth="1.2" />
          ))}
          {/* Primary arteries H */}
          {[240, 480, 720].map(y => (
            <line key={`hp${y}`} x1="0" y1={y} x2="1288" y2={y}
              stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          ))}
          {/* Primary arteries V */}
          {[240, 480, 720, 960, 1200].map(x => (
            <line key={`vp${x}`} x1={x} y1="0" x2={x} y2="900"
              stroke="rgba(255,255,255,0.16)" strokeWidth="2" />
          ))}
          {/* Expressways */}
          <path d="M 960,900 L 960,752 Q 960,724 986,714 L 1082,714"
            stroke="var(--lc-border-medium)" strokeWidth="4" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 1200,0 L 1200,608 Q 1200,624 1182,634 L 1088,680"
            stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* Diagonal boulevards */}
          <path d="M 240,900 L 720,0" stroke="rgba(255,255,255,0.055)" strokeWidth="1.4" />
          <path d="M 720,900 L 1200,0" stroke="rgba(255,255,255,0.048)" strokeWidth="1.2" />
          {/* Intersection dots */}
          {[240, 480, 720].flatMap(y =>
            [240, 480, 720, 960, 1200].map(x => (
              <circle key={`id${x}-${y}`} cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.1)" />
            ))
          )}

          {/* ══ DISPATCH ROUTES ══ */}
          <path id="route-motion"
            d="M 1140,680 L 1200,680 L 1200,480 L 960,480 L 960,360 L 900,360"
            fill="none" />
          {/* Glow halo */}
          <path d="M 1140,680 L 1200,680 L 1200,480 L 960,480 L 960,360 L 900,360"
            stroke="rgba(201,168,124,0.15)" strokeWidth="16" fill="none"
            strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-r)" />
          {/* Gold dashes */}
          <path d="M 1140,680 L 1200,680 L 1200,480 L 960,480 L 960,360 L 900,360"
            stroke="#c9a87c" strokeWidth="2.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8,5"
            style={{ animation: "flow-fwd 1.3s linear infinite" }} />
          {/* Beta route */}
          <path d="M 960,720 L 960,600 L 1200,600 L 1200,480"
            stroke="rgba(201,168,124,0.32)" strokeWidth="1.6" fill="none"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,5"
            style={{ animation: "flow-rev 1.8s linear infinite" }} />
          {/* Gamma route */}
          <path d="M 1080,240 L 1080,180 L 1020,180"
            stroke="rgba(201,168,124,0.22)" strokeWidth="1.4" fill="none"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5,5"
            style={{ animation: "flow-fwd 2.2s linear infinite" }} />

          {/* Moving vehicle */}
          <circle r="6" fill="#c9a87c" filter="url(#glow-pin)">
            <animateMotion dur="12s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>
          <circle r="3.5" fill="rgba(201,168,124,0.62)">
            <animateMotion dur="12s" begin="-1s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>
          <circle r="2" fill="rgba(201,168,124,0.32)">
            <animateMotion dur="12s" begin="-1.9s" repeatCount="indefinite" calcMode="linear">
              <mpath href="#route-motion" />
            </animateMotion>
          </circle>

          {/* Dispatch pins */}
          <g filter="url(#glow-pin)">
            <Pin cx={900} cy={360} delay="0s" size={7} />
            <Pin cx={1140} cy={680} delay="1.4s" size={7} />
          </g>
          <circle cx={1080} cy={180} r="4.5" stroke="rgba(201,168,124,0.44)" strokeWidth="1.2" fill="rgba(201,168,124,0.07)" />
          <circle cx={960} cy={600} r="4" stroke="rgba(201,168,124,0.34)" strokeWidth="1.2" fill="rgba(201,168,124,0.06)" />

          {/* ══ POI MARKERS ══ */}

          {/* Airport */}
          <g filter="url(#poi-shadow)">
            <circle cx={960} cy={720} r="17" fill="#0d1626" stroke="#c9a87c" strokeWidth="1.4" />
          </g>
          <path transform="translate(953,712)"
            d="M 7,0 C 8.1,0 9,0.9 9,2 L 9,6.5 L 15.5,10 L 15.5,12 L 9,10.5 L 9,14 L 11,15 L 11,16.5 L 7,15.5 L 3,16.5 L 3,15 L 5,14 L 5,10.5 L -1.5,12 L -1.5,10 L 5,6.5 L 5,2 C 5,0.9 5.9,0 7,0 Z"
            fill="#c9a87c" />
          <rect x="930" y="741" width="60" height="15" rx="3"
            fill="rgba(10,16,30,0.96)" stroke="rgba(201,168,124,0.22)" strokeWidth="0.5" />
          <text x="960" y="751.5" textAnchor="middle"
            fill="rgba(200,212,228,0.88)" fontSize="7.5" fontFamily="system-ui" fontWeight="600" letterSpacing="0.1em">AIRPORT</text>

          {/* FBO */}
          <g filter="url(#poi-shadow)">
            <circle cx={1140} cy={680} r="15" fill="#0d1626" stroke="#c9a87c" strokeWidth="1.4" />
          </g>
          <path d="M 1140,668 L 1152,680 L 1140,692 L 1128,680 Z"
            fill="none" stroke="#c9a87c" strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx={1140} cy={680} r="3" fill="#c9a87c" />
          <rect x="1114" y="699" width="52" height="15" rx="3"
            fill="rgba(10,16,30,0.96)" stroke="rgba(201,168,124,0.22)" strokeWidth="0.5" />
          <text x="1140" y="709.5" textAnchor="middle"
            fill="rgba(200,212,228,0.88)" fontSize="7.5" fontFamily="system-ui" fontWeight="600" letterSpacing="0.15em">FBO</text>

          {/* Hotel */}
          <g filter="url(#poi-shadow)">
            <circle cx={900} cy={360} r="16" fill="#0d1626" stroke="#c9a87c" strokeWidth="1.4" />
          </g>
          <text x="900" y="365.5" textAnchor="middle"
            fill="#c9a87c" fontSize="16" fontFamily="system-ui" fontWeight="700">H</text>
          <rect x="872" y="380" width="56" height="15" rx="3"
            fill="rgba(10,16,30,0.96)" stroke="rgba(201,168,124,0.22)" strokeWidth="0.5" />
          <text x="900" y="390.5" textAnchor="middle"
            fill="rgba(200,212,228,0.88)" fontSize="7.5" fontFamily="system-ui" fontWeight="600" letterSpacing="0.1em">HOTEL</text>

          {/* Restaurant */}
          <g filter="url(#poi-shadow)">
            <circle cx={1080} cy={180} r="15" fill="#0d1626" stroke="#c9a87c" strokeWidth="1.4" />
          </g>
          <line x1="1076" y1="172" x2="1076" y2="188" stroke="#c9a87c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 1074,172 Q 1074,178 1076,179 Q 1078,178 1078,172"
            stroke="#c9a87c" strokeWidth="1.3" fill="none" />
          <line x1="1084" y1="172" x2="1084" y2="188" stroke="#c9a87c" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 1084,172 Q 1088,175 1084,179"
            stroke="#c9a87c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <rect x="1050" y="199" width="60" height="15" rx="3"
            fill="rgba(10,16,30,0.96)" stroke="rgba(201,168,124,0.22)" strokeWidth="0.5" />
          <text x="1080" y="209.5" textAnchor="middle"
            fill="rgba(200,212,228,0.88)" fontSize="7" fontFamily="system-ui" fontWeight="600" letterSpacing="0.08em">RESTAURANT</text>

          {/* Street labels */}
          <text x="728" y="476" fill="var(--lc-border-medium)" fontSize="8.5"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.09em"
            transform="rotate(-90 728 476)" textAnchor="middle">5TH AVENUE</text>
          <text x="968" y="476" fill="var(--lc-border)" fontSize="8"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.09em"
            transform="rotate(-90 968 476)" textAnchor="middle">PARK BLVD</text>
          <text x="494" y="236" fill="var(--lc-border)" fontSize="8.5"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.09em">GRAND AVE</text>
          <text x="736" y="236" fill="var(--lc-border)" fontSize="8.5"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.09em">MIDTOWN BLVD</text>
          <text x="1208" y="470" fill="rgba(255,255,255,0.1)" fontSize="8"
            fontFamily="system-ui" fontWeight="400" letterSpacing="0.08em"
            transform="rotate(-90 1208 470)" textAnchor="middle">HARBOR DR</text>

          <rect width="1440" height="900" fill="url(#vignette)" />
        </svg>
      </div>

      {/* ══ LAYER 2 — DARK GRADIENT VEIL ══ */}
      <div className="grad-veil" aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(90deg, rgba(8,12,22,1) 0%, rgba(8,12,22,0.99) 25%, rgba(8,12,22,0.95) 42%, rgba(8,12,22,0.75) 55%, rgba(8,12,22,0.24) 68%, rgba(8,12,22,0) 78%)",
      }} />

      {/* ══ LAYER 3 — BRAND MARK ══ */}
      <div className="lx d1" style={{
        position: "absolute",
        top: "clamp(1.5rem, 3.5vh, 2.75rem)",
        left: "clamp(2rem, 5vw, 4.5rem)",
        zIndex: 10, display: "flex", alignItems: "center", gap: "11px",
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <rect x="5" y="5" width="12" height="12" stroke="rgba(201,168,124,0.75)" strokeWidth="1.2"
            transform="rotate(45 11 11)" fill="none" />
          <circle cx="11" cy="11" r="2.2" fill="#c9a87c" />
        </svg>
        <span style={{
          fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.6rem", fontWeight: 500,
          color: "var(--lc-text-secondary)", letterSpacing: "0.28em", textTransform: "uppercase",
        }}>Livery Connect</span>
      </div>

      {/* ══ LAYER 4 — FORM ══ */}
      <div className="form-side" style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: "clamp(360px, 42%, 500px)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        paddingLeft: "clamp(2rem, 5vw, 4.5rem)",
        paddingRight: "clamp(1.5rem, 3vw, 2.5rem)",
        paddingTop: "5rem", paddingBottom: "3rem", zIndex: 10,
      }}>
        <div className="lx d2" style={{ marginBottom: "2.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px", marginBottom: "1.2rem" }}>
            <div style={{ width: "26px", height: "1px", background: "#c9a87c", flexShrink: 0 }} />
            <span style={{
              fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.57rem", fontWeight: 500,
              letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(201,168,124,0.7)",
            }}>Member Access</span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-cormorant, serif)",
            fontSize: "clamp(2.4rem, 3.8vw, 3.2rem)", fontWeight: 400, fontStyle: "italic",
            color: "var(--lc-text-primary)", letterSpacing: "-0.02em", lineHeight: 1.12, marginBottom: "0.9rem",
          }}>Welcome back</h1>
          <p style={{
            fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.82rem",
            color: "rgba(200,212,228,0.4)", fontWeight: 300, letterSpacing: "0.01em", lineHeight: 1.6,
          }}>Sign in to your dispatch console</p>
        </div>

        {error && (
          <div style={{
            marginBottom: "1.5rem", paddingBottom: "0.75rem",
            borderBottom: "1px solid rgba(200,60,60,0.18)",
            display: "flex", alignItems: "center", gap: "9px",
          }}>
            <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#e06060", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.78rem", color: "#e06060" }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="lx d3 f" style={{ marginBottom: "1.8rem" }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email address" required autoFocus className="fi" id="lx-email" />
            <label htmlFor="lx-email">Email address</label>
          </div>
          <div className="lx d4 f" style={{ marginBottom: "0.5rem", position: "relative" }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" required className="fi" id="lx-pass" style={{ paddingRight: "28px" }} />
            <label htmlFor="lx-pass">Password</label>
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              style={{
                position: "absolute", right: 0, bottom: "10px",
                background: "none", border: "none", padding: 0, cursor: "pointer",
                color: "rgba(200,212,228,0.3)", lineHeight: 1, transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(201,168,124,0.8)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(200,212,228,0.3)")}
            >
              {showPassword ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
          <div className="lx d4" style={{ textAlign: "right", marginBottom: "2.6rem" }}>
            <Link href="/auth/forgot-password" className="lk-dim"
              style={{ fontFamily: "var(--font-outfit, system-ui)" }}>Forgot password?</Link>
          </div>
          <div className="lx d5">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </div>
        </form>

        <div className="lx d6" style={{
          marginTop: "1.75rem",
          paddingTop: "1.4rem",
          borderTop: "1px solid var(--lc-bg-glass-mid)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.9rem",
            color: "rgba(200,212,228,0.5)", fontWeight: 300, letterSpacing: "0.01em",
          }}>New to Livery Connect?</span>
          <Link href="/auth/signup" className="lk" style={{
            fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "5px",
          }}>
            Create an account <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>→</span>
          </Link>
        </div>
      </div>

      {/* ══ LAYER 5 — DISPATCH STATS ══ */}
      <div className="lx d3" style={{
        position: "absolute",
        bottom: "clamp(1.5rem, 3vh, 2.5rem)",
        right: "clamp(1.5rem, 3vw, 3rem)",
        zIndex: 10, pointerEvents: "none",
      }}>
        <div style={{
          background: "rgba(8,12,22,0.88)",
          border: "1px solid rgba(201,168,124,0.18)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 var(--lc-bg-card)",
          padding: "14px 20px 16px",
          minWidth: "168px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            paddingBottom: "10px", marginBottom: "10px",
            borderBottom: "1px solid rgba(201,168,124,0.1)",
          }}>
            <div style={{
              width: "7px", height: "7px", borderRadius: "50%",
              background: "#22c55e", flexShrink: 0,
              animation: "pulse-dot 2s ease-in-out infinite",
            }} />
            <span style={{
              fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.54rem", fontWeight: 500,
              color: "var(--lc-text-muted)", letterSpacing: "0.16em", textTransform: "uppercase",
            }}>Dispatch Active</span>
          </div>
          {[
            { label: "Active Routes", value: "14" },
            { label: "En Route",      value: "9"  },
            { label: "Available",     value: "5"  },
          ].map(({ label, value }, i) => (
            <div key={label} style={{
              display: "flex", alignItems: "baseline",
              justifyContent: "space-between", gap: "28px",
              marginTop: i === 0 ? 0 : "8px",
            }}>
              <span style={{
                fontFamily: "var(--font-outfit, system-ui)", fontSize: "0.62rem", fontWeight: 400,
                color: "var(--lc-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>{label}</span>
              <span style={{
                fontFamily: "var(--font-cormorant, serif)", fontSize: "1.45rem", fontWeight: 600,
                color: "#c9a87c", letterSpacing: "-0.02em", lineHeight: 1,
              }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
