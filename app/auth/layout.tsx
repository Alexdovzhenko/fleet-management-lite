import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google"

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
})

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-instrument",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${bricolage.variable} ${instrument.variable}`}
      style={{ fontFamily: "var(--font-instrument, system-ui, sans-serif)" }}
    >
      {/* ── LEFT PANEL — Fleet Route Map ────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[48%] relative flex-col overflow-hidden"
        style={{ background: "#faf8f4" }}
      >
        {/* Subtle grain texture */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.35 }} aria-hidden>
          <filter id="grain-lc">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-lc)" style={{ opacity: 0.04 }} />
        </svg>

        {/* Fleet route map — abstract network of dispatch routes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 480 700"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          {/* Route paths — bezier curves between nodes */}
          <g stroke="#0c2340" fill="none" strokeWidth="1" opacity="0.08">
            {/* Major routes */}
            <path d="M 120 210 Q 220 160 310 215" />
            <path d="M 310 215 Q 370 260 340 340" />
            <path d="M 120 210 Q 100 300 210 355" />
            <path d="M 210 355 Q 280 375 340 340" />
            <path d="M 310 215 Q 380 150 395 90" />
            <path d="M 120 210 Q 80 140 110 75" />
            <path d="M 340 340 Q 390 430 360 510" />
            <path d="M 210 355 Q 180 440 215 510" />
            <path d="M 215 510 Q 290 540 360 510" />
            <path d="M 110 75 Q 240 50 395 90" />
            {/* Minor routes */}
            <path d="M 60 310 Q 90 330 120 210" strokeDasharray="4 6" opacity="0.6" />
            <path d="M 420 300 Q 390 270 340 340" strokeDasharray="4 6" opacity="0.6" />
            <path d="M 155 590 Q 185 545 215 510" strokeDasharray="4 6" opacity="0.6" />
            <path d="M 415 560 Q 390 540 360 510" strokeDasharray="4 6" opacity="0.6" />
          </g>

          {/* Hub nodes — larger, more visible */}
          <g fill="#0c2340">
            {/* Primary hubs */}
            <circle cx="120" cy="210" r="6" opacity="0.18" />
            <circle cx="120" cy="210" r="12" opacity="0.05" />
            <circle cx="310" cy="215" r="6" opacity="0.18" />
            <circle cx="310" cy="215" r="12" opacity="0.05" />
            <circle cx="340" cy="340" r="5" opacity="0.15" />
            <circle cx="340" cy="340" r="10" opacity="0.04" />
            <circle cx="210" cy="355" r="5" opacity="0.15" />
            <circle cx="210" cy="355" r="10" opacity="0.04" />

            {/* Secondary nodes */}
            <circle cx="395" cy="90" r="4" opacity="0.12" />
            <circle cx="110" cy="75" r="4" opacity="0.12" />
            <circle cx="215" cy="510" r="4" opacity="0.12" />
            <circle cx="360" cy="510" r="4" opacity="0.12" />

            {/* Tertiary nodes */}
            <circle cx="60" cy="310" r="3" opacity="0.09" />
            <circle cx="420" cy="300" r="3" opacity="0.09" />
            <circle cx="155" cy="590" r="3" opacity="0.09" />
            <circle cx="415" cy="560" r="3" opacity="0.09" />
          </g>

          {/* Subtle grid underlay — like a map grid */}
          <g stroke="#0c2340" strokeWidth="0.5" opacity="0.025">
            {[0, 80, 160, 240, 320, 400, 480].map((x) => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="700" />
            ))}
            {[0, 100, 200, 300, 400, 500, 600, 700].map((y) => (
              <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y} />
            ))}
          </g>
        </svg>

        {/* Left navy accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: "#0c2340" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full pl-14 pr-12 py-14">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 44 30" className="h-6 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0c2340" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0c2340" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-instrument)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#0c2340",
                letterSpacing: "0.01em",
              }}
            >
              Livery Connect
            </span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center max-w-[340px]">
            <h1
              style={{
                fontFamily: "var(--font-bricolage)",
                fontSize: "clamp(2.6rem, 4vw, 3.6rem)",
                fontWeight: 800,
                color: "#0c2340",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: "1.25rem",
              }}
            >
              Your fleet,
              <br />
              fully connected.
            </h1>

            <p
              style={{
                fontFamily: "var(--font-instrument)",
                fontSize: "0.88rem",
                color: "#5a6878",
                lineHeight: 1.75,
                fontWeight: 400,
                marginBottom: "2.5rem",
              }}
            >
              Dispatch, affiliate management, and real-time fleet coordination — built for serious limo operators.
            </p>

            {/* Feature list */}
            {[
              "Real-time dispatch & tracking",
              "Affiliate network management",
              "Automated booking & quotes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 mb-3">
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "#0c2340",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg viewBox="0 0 12 12" width="8" height="8" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#faf8f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-instrument)",
                    fontSize: "0.82rem",
                    color: "#374558",
                    fontWeight: 400,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Bottom stats */}
          <div
            style={{
              borderTop: "1px solid rgba(12,35,64,0.1)",
              paddingTop: "1.5rem",
              display: "flex",
              gap: "2.5rem",
            }}
          >
            {[
              { value: "500+", label: "Operators" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "var(--font-bricolage)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "#0c2340",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-instrument)",
                    fontSize: "0.72rem",
                    color: "#8a97a6",
                    marginTop: "0.25rem",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-8 lg:p-16"
        style={{ background: "#ffffff", borderLeft: "1px solid rgba(12,35,64,0.07)" }}
      >
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <svg viewBox="0 0 44 30" className="h-6 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0c2340" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0c2340" />
            </svg>
            <span style={{ fontFamily: "var(--font-instrument)", fontSize: "0.9rem", fontWeight: 600, color: "#0c2340" }}>
              Livery Connect
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
