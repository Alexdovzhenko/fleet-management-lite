import { Plus_Jakarta_Sans } from "next/font/google"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${jakarta.variable}`}
      style={{ fontFamily: "var(--font-jakarta, system-ui)", background: "#f5f5f7" }}
    >
      {/* ═══════════════════════════════════════════════════════
          LEFT PANEL — Animated Fleet Network
      ════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden"
        style={{ background: "#0a0f1e" }}
      >
        {/* Dot grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.06)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Ambient glow — blue center */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 55% 52%, rgba(0,113,227,0.12) 0%, transparent 70%)",
          }}
        />

        {/* ── Animated Fleet Network SVG ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 520 720"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            {/* Blue glow filter for routes */}
            <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feColorMatrix in="blur" type="matrix"
                values="0 0 0 0 0.2   0 0 0 0 0.55   0 0 0 0 1   0 0 0 0.6 0"
                result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Dot glow */}
            <filter id="dot-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Route paths (defined once, reused by animateMotion) */}
            {/* Hub positions: A(110,200) B(330,165) C(400,345) D(255,430) E(90,405) F(170,575) G(355,555) */}
            <path id="rAB" d="M 110 200 C 185 158 258 158 330 165" />
            <path id="rBC" d="M 330 165 C 395 218 408 285 400 345" />
            <path id="rCD" d="M 400 345 C 358 388 308 415 255 430" />
            <path id="rDE" d="M 255 430 C 195 432 138 422 90 405" />
            <path id="rEA" d="M 90 405 C 76 328 84 264 110 200" />
            <path id="rAD" d="M 110 200 C 148 278 190 368 255 430" />
            <path id="rBD" d="M 330 165 C 318 268 292 365 255 430" />
            <path id="rDG" d="M 255 430 C 285 478 318 522 355 555" />
            <path id="rFD" d="M 170 575 C 192 522 218 478 255 430" />
            <path id="rCG" d="M 400 345 C 396 432 380 502 355 555" />
          </defs>

          {/* ── Base route lines (dim, always visible) ── */}
          <g fill="none" strokeWidth="1" stroke="rgba(255,255,255,0.06)">
            <use href="#rAB" /><use href="#rBC" /><use href="#rCD" />
            <use href="#rDE" /><use href="#rEA" /><use href="#rAD" />
            <use href="#rBD" /><use href="#rDG" /><use href="#rFD" /><use href="#rCG" />
          </g>

          {/* ── Animated draw-on routes ── */}
          <g fill="none" strokeLinecap="round" filter="url(#route-glow)">
            {/* Each path draws in sequence with pathLength trick */}
            {[
              { href: "#rAB", color: "#34aadc", w: "1.5", delay: "0.2s", dur: "1.4s" },
              { href: "#rBC", color: "#0071e3", w: "1.5", delay: "1.4s", dur: "1.2s" },
              { href: "#rCD", color: "#34aadc", w: "1.2", delay: "2.4s", dur: "1.1s" },
              { href: "#rDE", color: "#0071e3", w: "1.2", delay: "3.3s", dur: "1.0s" },
              { href: "#rEA", color: "#34aadc", w: "1.2", delay: "4.1s", dur: "1.0s" },
              { href: "#rAD", color: "#5ac8fa", w: "1",   delay: "1.8s", dur: "1.3s" },
              { href: "#rBD", color: "#5ac8fa", w: "1",   delay: "2.8s", dur: "1.2s" },
              { href: "#rDG", color: "#0071e3", w: "1.2", delay: "5.0s", dur: "0.9s" },
              { href: "#rFD", color: "#34aadc", w: "1",   delay: "5.5s", dur: "0.9s" },
              { href: "#rCG", color: "#5ac8fa", w: "1",   delay: "5.8s", dur: "0.9s" },
            ].map(({ href, color, w, delay, dur }) => (
              <path
                key={href}
                stroke={color}
                strokeWidth={w}
                fill="none"
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: 1,
                  pathLength: 1,
                  animation: `drawRoute ${dur} cubic-bezier(0.4,0,0.2,1) ${delay} forwards`,
                } as React.CSSProperties}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur={dur}
                  begin={delay}
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                  keyTimes="0;1"
                />
              </path>
            ))}
          </g>

          {/* ── Re-render animated paths (with pathLength on real elements) ── */}
          {/* Route A→B */}
          <path d="M 110 200 C 185 158 258 158 330 165"
            stroke="#34aadc" strokeWidth="1.5" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)"
            style={{ animation: "none" }}>
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.4s" begin="0.2s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 330 165 C 395 218 408 285 400 345"
            stroke="#0071e3" strokeWidth="1.5" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.2s" begin="1.4s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 400 345 C 358 388 308 415 255 430"
            stroke="#34aadc" strokeWidth="1.2" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.1s" begin="2.4s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 255 430 C 195 432 138 422 90 405"
            stroke="#0071e3" strokeWidth="1.2" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.0s" begin="3.3s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 90 405 C 76 328 84 264 110 200"
            stroke="#34aadc" strokeWidth="1.2" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.0s" begin="4.1s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 110 200 C 148 278 190 368 255 430"
            stroke="#5ac8fa" strokeWidth="1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.3s" begin="1.8s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 330 165 C 318 268 292 365 255 430"
            stroke="#5ac8fa" strokeWidth="1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.2s" begin="2.8s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 255 430 C 285 478 318 522 355 555"
            stroke="#0071e3" strokeWidth="1.2" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="0.9s" begin="5.0s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 170 575 C 192 522 218 478 255 430"
            stroke="#34aadc" strokeWidth="1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="0.9s" begin="5.5s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>
          <path d="M 400 345 C 396 432 380 502 355 555"
            stroke="#5ac8fa" strokeWidth="1" fill="none" strokeLinecap="round"
            pathLength="1" strokeDasharray="1" strokeDashoffset="1"
            filter="url(#route-glow)">
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="0.9s" begin="5.8s" fill="freeze" calcMode="spline"
              keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>

          {/* ── Traveling light dots ── */}
          <g filter="url(#dot-glow)">
            {/* Dot on A→B loop */}
            <circle r="3" fill="#ffffff" opacity="0.9">
              <animateMotion dur="4s" repeatCount="indefinite" begin="2s">
                <mpath href="#rAB" />
              </animateMotion>
            </circle>
            {/* Dot on B→C loop */}
            <circle r="2.5" fill="#5ac8fa" opacity="0.95">
              <animateMotion dur="3.5s" repeatCount="indefinite" begin="2.8s">
                <mpath href="#rBC" />
              </animateMotion>
            </circle>
            {/* Dot on C→D loop */}
            <circle r="2.5" fill="#ffffff" opacity="0.85">
              <animateMotion dur="3.8s" repeatCount="indefinite" begin="4s">
                <mpath href="#rCD" />
              </animateMotion>
            </circle>
            {/* Dot on A→D diagonal */}
            <circle r="2" fill="#34aadc" opacity="0.9">
              <animateMotion dur="5s" repeatCount="indefinite" begin="3.5s">
                <mpath href="#rAD" />
              </animateMotion>
            </circle>
            {/* Dot on D→G */}
            <circle r="2" fill="#5ac8fa" opacity="0.85">
              <animateMotion dur="3.2s" repeatCount="indefinite" begin="6.5s">
                <mpath href="#rDG" />
              </animateMotion>
            </circle>
            {/* Reverse dot on D→E */}
            <circle r="2" fill="#ffffff" opacity="0.75">
              <animateMotion dur="4.2s" repeatCount="indefinite" begin="4.8s" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                <mpath href="#rDE" />
              </animateMotion>
            </circle>
          </g>

          {/* ── Hub nodes with pulse rings ── */}
          {/* Primary hubs */}
          {[
            { cx: 110, cy: 200, r: 5, delay: "1.6s" },
            { cx: 330, cy: 165, r: 5, delay: "2.6s" },
            { cx: 400, cy: 345, r: 4.5, delay: "3.6s" },
            { cx: 255, cy: 430, r: 5, delay: "4.4s" },
            { cx: 90,  cy: 405, r: 4, delay: "5.1s" },
          ].map(({ cx, cy, r, delay }) => (
            <g key={`hub-${cx}-${cy}`}>
              {/* Pulse ring */}
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0071e3" strokeWidth="1.5"
                opacity="0" style={{ animation: `nodeAppear 0.4s ease ${delay} forwards` }}>
                <animate attributeName="r" values={`${r};${r + 14}`}
                  dur="2.4s" begin={`${parseFloat(delay) + 0.4}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0"
                  dur="2.4s" begin={`${parseFloat(delay) + 0.4}s`} repeatCount="indefinite" />
              </circle>
              {/* Core dot */}
              <circle cx={cx} cy={cy} r={r} fill="#0071e3" opacity="0"
                style={{ animation: `nodeAppear 0.4s ease ${delay} forwards` }} />
              <circle cx={cx} cy={cy} r={r * 0.45} fill="white" opacity="0"
                style={{ animation: `nodeAppear 0.4s ease ${delay} forwards` }} />
            </g>
          ))}
          {/* Secondary nodes */}
          {[
            { cx: 355, cy: 555, delay: "6.2s" },
            { cx: 170, cy: 575, delay: "6.4s" },
          ].map(({ cx, cy, delay }) => (
            <g key={`sec-${cx}-${cy}`}>
              <circle cx={cx} cy={cy} r="3.5" fill="#34aadc" opacity="0"
                style={{ animation: `nodeAppear 0.4s ease ${delay} forwards` }} />
            </g>
          ))}
        </svg>

        {/* ── Panel content ── */}
        <div className="relative z-10 flex flex-col h-full px-14 py-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5" style={{ animation: "lcFadeUp 0.6s ease 0.1s both" }}>
            <svg viewBox="0 0 44 30" className="h-5 w-auto" aria-label="LC">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0071e3" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0071e3" />
            </svg>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.01em" }}>
              Livery Connect
            </span>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: "340px" }}>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#0071e3",
                marginBottom: "1rem",
                animation: "lcFadeUp 0.6s ease 0.2s both",
              }}
            >
              Fleet Management Platform
            </p>
            <h1
              style={{
                fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
                fontWeight: 800,
                color: "#f5f5f7",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: "1.25rem",
                animation: "lcFadeUp 0.6s ease 0.3s both",
              }}
            >
              Your fleet,
              <br />
              <span style={{ color: "#34aadc" }}>fully connected.</span>
            </h1>
            <p
              style={{
                fontSize: "0.88rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.75,
                fontWeight: 300,
                animation: "lcFadeUp 0.6s ease 0.4s both",
              }}
            >
              Real-time dispatch, affiliate management, and fleet coordination — built for serious operators.
            </p>
          </div>

          {/* Stats */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "0",
              animation: "lcFadeUp 0.6s ease 0.5s both",
            }}
          >
            {[
              { value: "500+", label: "Operators" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                  paddingLeft: i > 0 ? "1.5rem" : undefined,
                }}
              >
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f5f5f7", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginTop: "0.3rem", fontWeight: 400 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — macOS-style form card
      ════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex items-center justify-center p-8 lg:p-12"
        style={{ background: "#f5f5f7" }}
      >
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <svg viewBox="0 0 44 30" className="h-5 w-auto">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0071e3" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0071e3" />
            </svg>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1d1d1f" }}>Livery Connect</span>
          </div>

          {/* Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              borderRadius: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.6)",
              padding: "40px 36px",
            }}
          >
            {children}
          </div>

          {/* Apple-style legal */}
          <p
            style={{
              textAlign: "center",
              fontSize: "0.7rem",
              color: "rgba(29,29,31,0.4)",
              marginTop: "1.25rem",
              lineHeight: 1.6,
            }}
          >
            By continuing, you agree to our{" "}
            <a href="#" style={{ color: "#0071e3", textDecoration: "none" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="#" style={{ color: "#0071e3", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes lcFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nodeAppear {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
