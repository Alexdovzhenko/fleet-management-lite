import { Outfit } from "next/font/google"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${outfit.variable}`}
      style={{ fontFamily: "var(--font-outfit, system-ui, sans-serif)" }}
    >
      {/* ── Left gradient mesh panel ───────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden"
        style={{ background: "#06080f" }}
      >
        {/* Gradient mesh layers */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,102,241,0.45) 0%, transparent 60%),
              radial-gradient(ellipse 60% 70% at 80% 80%, rgba(14,165,233,0.3) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 60% 30%, rgba(139,92,246,0.25) 0%, transparent 50%),
              radial-gradient(ellipse 70% 40% at 10% 80%, rgba(6,182,212,0.15) 0%, transparent 50%)
            `,
          }}
        />

        {/* Geometric grid overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.07 }}
          aria-hidden
        >
          <defs>
            <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        {/* Noise texture */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.03 }} aria-hidden>
          <filter id="noise-auth">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-auth)" />
        </svg>

        {/* Glow orbs */}
        <div
          className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%)" }}
        />

        {/* Decorative circle outline */}
        <div
          className="absolute right-[-140px] top-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        />
        <div
          className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ border: "1px solid rgba(255,255,255,0.04)" }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <svg viewBox="0 0 44 30" className="h-4 w-auto" aria-label="LC">
                <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="white" />
                <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="white" />
              </svg>
            </div>
            <span
              className="text-sm font-medium tracking-wide"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Livery Connect
            </span>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center max-w-[400px]">
            {/* Tag line */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 w-fit"
              style={{
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: "0 0 6px rgba(129,140,248,0.8)" }} />
              <span className="text-xs font-medium" style={{ color: "rgba(165,180,252,0.9)", letterSpacing: "0.05em" }}>
                Fleet Management Platform
              </span>
            </div>

            <h1
              className="font-bold leading-[1.08] mb-6"
              style={{
                fontSize: "clamp(2.6rem, 4.5vw, 4rem)",
                color: "#ffffff",
                letterSpacing: "-0.03em",
              }}
            >
              Dispatch smarter.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Move faster.
              </span>
            </h1>

            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)", fontWeight: 300, lineHeight: 1.8 }}
            >
              The all-in-one platform for premium limo operators. Real-time dispatch, affiliate network, and fleet intelligence — built for operators who don't compromise.
            </p>
          </div>

          {/* Bottom stats */}
          <div className="flex items-center gap-0">
            {[
              { value: "500+", label: "Operators" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                className="flex-1 py-4"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                  paddingLeft: i > 0 ? "1.5rem" : undefined,
                }}
              >
                <div className="text-xl font-semibold" style={{ color: "#ffffff", letterSpacing: "-0.02em" }}>
                  {value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontWeight: 300 }}>
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
        style={{ background: "#ffffff" }}
      >
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}
            >
              <svg viewBox="0 0 44 30" className="h-3.5 w-auto" aria-label="LC">
                <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="white" />
                <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="white" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Livery Connect</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
