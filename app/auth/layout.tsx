import { Cormorant_Garamond, DM_Sans } from "next/font/google"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${cormorant.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-dm-sans, system-ui, sans-serif)" }}
    >
      {/* ── Left atmospheric panel ─────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #080c14 0%, #0d1524 60%, #07090f 100%)",
        }}
      >
        {/* Grain texture */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.04 }}
          aria-hidden
        >
          <filter id="grain-auth">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-auth)" />
        </svg>

        {/* Atmospheric glow — top right */}
        <div
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Atmospheric glow — bottom left */}
        <div
          className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)",
          }}
        />

        {/* Decorative ring — center right */}
        <div
          className="absolute right-[-120px] top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(201,169,110,0.07)" }}
        />
        <div
          className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(201,169,110,0.05)" }}
        />

        {/* Horizontal hairlines */}
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: "36%",
            background: "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.18) 40%, transparent 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            top: "64%",
            background: "linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.09) 50%, transparent 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-16 py-14">
          {/* Brand mark */}
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 44 30" className="h-7 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#c9a96e" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#c9a96e" />
            </svg>
            <span
              className="text-xs tracking-[0.22em] uppercase"
              style={{ color: "rgba(201,169,110,0.65)", fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Livery Connect
            </span>
          </div>

          {/* Hero copy */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Large watermark monogram */}
            <div
              className="absolute right-0 top-1/2 -translate-y-[45%] pointer-events-none select-none"
              style={{
                color: "rgba(201,169,110,0.025)",
                fontFamily: "var(--font-cormorant)",
                fontSize: "32rem",
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: "-0.05em",
              }}
              aria-hidden
            >
              LC
            </div>

            <p
              className="text-xs tracking-[0.3em] uppercase mb-7"
              style={{ color: "rgba(201,169,110,0.45)" }}
            >
              Fleet Management Platform
            </p>

            <h1
              style={{
                fontFamily: "var(--font-cormorant)",
                fontSize: "clamp(3rem, 4.5vw, 4.75rem)",
                fontWeight: 300,
                color: "#f0ebe0",
                lineHeight: 1.05,
                letterSpacing: "-0.01em",
                marginBottom: "2rem",
              }}
            >
              Move with
              <br />
              <em style={{ fontStyle: "italic", color: "#c9a96e" }}>elegance.</em>
            </h1>

            <p
              className="text-sm leading-relaxed"
              style={{
                color: "rgba(255,255,255,0.3)",
                fontWeight: 300,
                maxWidth: "300px",
                lineHeight: 1.8,
              }}
            >
              The dispatch platform built for premium limo operators. Manage your fleet, affiliates, and bookings — all in one place.
            </p>
          </div>

          {/* Bottom trust indicators */}
          <div className="flex items-end gap-10">
            {[
              { value: "500+", label: "Operators" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "var(--font-cormorant)",
                    fontSize: "1.75rem",
                    fontWeight: 400,
                    color: "#c9a96e",
                    lineHeight: 1,
                  }}
                >
                  {value}
                </div>
                <div
                  className="text-[10px] tracking-[0.2em] uppercase mt-1.5"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ───────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center p-8 lg:p-16"
        style={{ background: "#fafaf8" }}
      >
        <div className="w-full max-w-[380px]">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <svg viewBox="0 0 44 30" className="h-6 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#c9a96e" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#c9a96e" />
            </svg>
            <span
              className="text-xs tracking-[0.18em] uppercase"
              style={{ color: "#8c8680", fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Livery Connect
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
