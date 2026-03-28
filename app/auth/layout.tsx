import { Bebas_Neue, IBM_Plex_Mono } from "next/font/google"

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
})

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${bebas.variable} ${mono.variable}`}
      style={{ background: "#080706", fontFamily: "var(--font-mono, monospace)" }}
    >
      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden">

        {/* Horizontal scan lines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.007) 3px, rgba(255,255,255,0.007) 4px)",
          }}
        />

        {/* Lime spotlight — electric glow from center-left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 75% 65% at 20% 58%, rgba(163,230,53,0.08) 0%, transparent 68%)",
          }}
        />

        {/* Enormous LC watermark */}
        <div
          className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden"
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "55vw",
            color: "rgba(255,255,255,0.015)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
            paddingLeft: "2rem",
            paddingTop: "4rem",
          }}
          aria-hidden
        >
          LC
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-14 py-12">

          {/* Logo mark */}
          <div>
            <svg viewBox="0 0 44 30" className="h-6 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#a3e635" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#a3e635" />
            </svg>
          </div>

          {/* Hero headline */}
          <div className="flex-1 flex flex-col justify-center">
            <h1
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "clamp(5rem, 9.5vw, 9rem)",
                color: "#fafaf9",
                lineHeight: 0.9,
                letterSpacing: "0.025em",
              }}
            >
              LIVERY
              <br />
              CONNECT
            </h1>

            {/* Terminal tag line */}
            <div className="flex items-center gap-3 mt-7 mb-8">
              <div style={{ width: "28px", height: "1px", background: "#a3e635", flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  color: "rgba(163,230,53,0.65)",
                  letterSpacing: "0.18em",
                }}
              >
                // DISPATCH TERMINAL
              </span>
              <span className="terminal-cursor" aria-hidden />
            </div>

            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.76rem",
                color: "rgba(255,255,255,0.28)",
                fontWeight: 300,
                lineHeight: 1.9,
                maxWidth: "310px",
              }}
            >
              Real-time fleet intelligence for premium limo operators. Manage dispatch, affiliates,
              and bookings from a single command center.
            </p>
          </div>

          {/* Stats row */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "1.75rem",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {[
              { value: "500+", label: "OPERATORS" },
              { value: "99.9%", label: "UPTIME" },
              { value: "24/7", label: "SUPPORT" },
            ].map(({ value, label }, i) => (
              <div
                key={label}
                style={{
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  paddingLeft: i > 0 ? "1.5rem" : undefined,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-bebas)",
                    fontSize: "2.25rem",
                    color: "#a3e635",
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.58rem",
                    color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.18em",
                    marginTop: "0.3rem",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center relative"
        style={{ borderLeft: "1px solid rgba(255,255,255,0.055)" }}
      >
        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 50% 38%, rgba(163,230,53,0.025) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 w-full max-w-[360px] px-8 lg:px-0">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <svg viewBox="0 0 44 30" className="h-5 w-auto" aria-label="Livery Connect">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#a3e635" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#a3e635" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "1.5rem",
                color: "#fafaf9",
                letterSpacing: "0.05em",
              }}
            >
              LIVERY CONNECT
            </span>
          </div>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes terminal-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .terminal-cursor {
          display: inline-block;
          width: 7px;
          height: 12px;
          background: #a3e635;
          animation: terminal-blink 1.1s step-end infinite;
          vertical-align: middle;
        }
      `}</style>
    </div>
  )
}
