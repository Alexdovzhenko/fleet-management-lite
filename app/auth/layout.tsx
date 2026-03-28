import { Playfair_Display, DM_Sans } from "next/font/google"

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm",
  display: "swap",
})

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`min-h-screen flex ${playfair.variable} ${dmSans.variable}`}
      style={{ fontFamily: "var(--font-dm, system-ui)" }}
    >

      {/* ═══════════════════════════════════════
          LEFT PANEL — Editorial / Atmospheric
      ════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[46%] relative flex-col overflow-hidden"
        style={{ background: "#0d0d0d" }}
      >
        {/* Grain overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            opacity: 0.4,
          }}
        />

        {/* Vignette edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Warm gold ambient glow — bottom third */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: "55%",
            background: "radial-gradient(ellipse 80% 60% at 30% 100%, rgba(201,168,124,0.08) 0%, transparent 65%)",
          }}
        />

        {/* ── Luxury Car Line Illustration ── */}
        <svg
          className="absolute pointer-events-none"
          style={{ bottom: "8%", right: "-4%", width: "78%", opacity: 0.9 }}
          viewBox="0 0 440 180"
          fill="none"
          aria-hidden
        >
          <defs>
            <filter id="gold-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feColorMatrix in="blur" type="matrix"
                values="1 0.8 0.3 0 0  0.8 0.6 0.1 0 0  0.1 0.05 0 0 0  0 0 0 0.5 0"
                result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Single continuous luxury sedan silhouette — hairline gold */}
          {/* Body + roofline */}
          <path
            d="
              M 20 130
              L 40 130
              Q 50 130 55 125
              L 75 85
              Q 82 72 95 68
              L 160 62
              Q 175 60 188 58
              L 230 52
              Q 255 50 275 52
              L 330 58
              Q 348 61 358 68
              L 378 85
              Q 385 92 390 100
              L 415 105
              Q 428 107 432 115
              L 432 130
              L 410 130
            "
            stroke="#c9a87c"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#gold-glow)"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="1" to="0"
              dur="2.8s"
              begin="0.3s"
              fill="freeze"
              calcMode="spline"
              keySplines="0.4 0 0.2 1"
              keyTimes="0;1"
            />
          </path>

          {/* Underbody / ground line */}
          <path
            d="M 75 130 L 130 130 M 175 130 L 285 130 M 340 130 L 410 130"
            stroke="#c9a87c"
            strokeWidth="0.8"
            strokeLinecap="round"
            filter="url(#gold-glow)"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
          >
            <animate attributeName="stroke-dashoffset" from="1" to="0"
              dur="1.2s" begin="2.6s" fill="freeze"
              calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </path>

          {/* Front wheel */}
          <circle cx="130" cy="130" r="26" stroke="#c9a87c" strokeWidth="0.8" filter="url(#gold-glow)"
            strokeDasharray="163.4" strokeDashoffset="163.4">
            <animate attributeName="stroke-dashoffset" from="163.4" to="0"
              dur="1.0s" begin="2.4s" fill="freeze"
              calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </circle>
          <circle cx="130" cy="130" r="10" stroke="rgba(201,168,124,0.4)" strokeWidth="0.6"
            strokeDasharray="62.8" strokeDashoffset="62.8">
            <animate attributeName="stroke-dashoffset" from="62.8" to="0"
              dur="0.8s" begin="3.2s" fill="freeze" />
          </circle>
          <circle cx="130" cy="130" r="3" fill="#c9a87c" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" dur="0.3s" begin="3.8s" fill="freeze" />
          </circle>

          {/* Rear wheel */}
          <circle cx="330" cy="130" r="26" stroke="#c9a87c" strokeWidth="0.8" filter="url(#gold-glow)"
            strokeDasharray="163.4" strokeDashoffset="163.4">
            <animate attributeName="stroke-dashoffset" from="163.4" to="0"
              dur="1.0s" begin="2.5s" fill="freeze"
              calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
          </circle>
          <circle cx="330" cy="130" r="10" stroke="rgba(201,168,124,0.4)" strokeWidth="0.6"
            strokeDasharray="62.8" strokeDashoffset="62.8">
            <animate attributeName="stroke-dashoffset" from="62.8" to="0"
              dur="0.8s" begin="3.3s" fill="freeze" />
          </circle>
          <circle cx="330" cy="130" r="3" fill="#c9a87c" opacity="0">
            <animate attributeName="opacity" from="0" to="0.7" dur="0.3s" begin="3.9s" fill="freeze" />
          </circle>

          {/* Door line detail */}
          <path
            d="M 180 68 L 182 120 M 270 60 L 272 118"
            stroke="rgba(201,168,124,0.35)"
            strokeWidth="0.7"
            strokeLinecap="round"
            strokeDasharray="60" strokeDashoffset="60"
          >
            <animate attributeName="stroke-dashoffset" from="60" to="0"
              dur="0.6s" begin="3.0s" fill="freeze" />
          </path>

          {/* Window line */}
          <path
            d="M 85 80 Q 90 68 100 66 L 165 61 Q 178 60 180 68 L 175 82 Q 130 84 85 80 Z"
            stroke="rgba(201,168,124,0.3)" strokeWidth="0.7" fill="none"
            strokeDasharray="200" strokeDashoffset="200"
          >
            <animate attributeName="stroke-dashoffset" from="200" to="0"
              dur="1.0s" begin="1.6s" fill="freeze" />
          </path>
          <path
            d="M 183 68 L 185 58 Q 230 50 275 52 L 340 58 Q 355 62 360 68 L 355 80 Q 270 84 183 80 Z"
            stroke="rgba(201,168,124,0.3)" strokeWidth="0.7" fill="none"
            strokeDasharray="400" strokeDashoffset="400"
          >
            <animate attributeName="stroke-dashoffset" from="400" to="0"
              dur="1.2s" begin="1.8s" fill="freeze" />
          </path>

          {/* Headlight */}
          <path d="M 390 100 Q 420 102 432 115" stroke="rgba(201,168,124,0.5)" strokeWidth="1.2"
            strokeLinecap="round" filter="url(#gold-glow)"
            strokeDasharray="50" strokeDashoffset="50">
            <animate attributeName="stroke-dashoffset" from="50" to="0"
              dur="0.5s" begin="3.5s" fill="freeze" />
          </path>
          {/* Headlight beam — subtle */}
          <path d="M 432 118 L 440 110 M 432 122 L 440 118 M 432 126 L 440 128"
            stroke="rgba(201,168,124,0.15)" strokeWidth="0.6" strokeLinecap="round"
            opacity="0">
            <animate attributeName="opacity" from="0" to="1" dur="0.8s" begin="4.0s" fill="freeze" />
          </path>
        </svg>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col h-full px-14 py-14">

          {/* Brand wordmark */}
          <div
            className="flex items-center gap-3"
            style={{ animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
          >
            <div
              style={{
                width: "28px",
                height: "1px",
                background: "#c9a87c",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm)",
                fontSize: "0.65rem",
                fontWeight: 500,
                color: "#c9a87c",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Livery Connect
            </span>
          </div>

          {/* Editorial headline */}
          <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: "380px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm)",
                fontSize: "0.62rem",
                fontWeight: 400,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "rgba(201,168,124,0.5)",
                marginBottom: "1.5rem",
                animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.25s both",
              }}
            >
              Executive Fleet Management
            </p>

            <h1
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "clamp(2.8rem, 4.2vw, 4rem)",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#f5f0e8",
                lineHeight: 1.18,
                letterSpacing: "-0.01em",
                marginBottom: "2.5rem",
                animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.35s both",
              }}
            >
              Where precision
              <br />
              <span style={{ fontStyle: "normal", fontWeight: 600, color: "#ffffff" }}>
                meets service.
              </span>
            </h1>

            {/* Gold hairline */}
            <div
              style={{
                width: "40px",
                height: "1px",
                background: "linear-gradient(90deg, #c9a87c, transparent)",
                marginBottom: "1.75rem",
                animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s both",
              }}
            />

            <p
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "0.9rem",
                fontStyle: "italic",
                color: "rgba(245,240,232,0.45)",
                lineHeight: 1.8,
                letterSpacing: "0.01em",
                animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.55s both",
              }}
            >
              &ldquo;The standard of excellence
              <br />
              in every dispatch.&rdquo;
            </p>
          </div>

          {/* Bottom — stats in luxury treatment */}
          <div
            style={{
              animation: "fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) 0.65s both",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "1px",
                background: "linear-gradient(90deg, rgba(201,168,124,0.25), transparent)",
                marginBottom: "1.75rem",
              }}
            />
            <div style={{ display: "flex", gap: "2.5rem" }}>
              {[
                { value: "500+", label: "Operators" },
                { value: "99.9%", label: "Uptime" },
                { value: "24 / 7", label: "Support" },
              ].map(({ value, label }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: "1.4rem",
                      fontWeight: 600,
                      color: "#c9a87c",
                      letterSpacing: "-0.01em",
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm)",
                      fontSize: "0.62rem",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.25)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginTop: "0.35rem",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT PANEL — Pristine form space
      ════════════════════════════════════════ */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: "#ffffff", padding: "clamp(2rem, 6vw, 5rem)" }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>

          {/* Mobile wordmark */}
          <div
            className="lg:hidden flex items-center gap-3 mb-12"
            style={{ justifyContent: "center" }}
          >
            <div style={{ width: "20px", height: "1px", background: "#c9a87c" }} />
            <span
              style={{
                fontFamily: "var(--font-dm)",
                fontSize: "0.65rem",
                fontWeight: 500,
                color: "#c9a87c",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Livery Connect
            </span>
            <div style={{ width: "20px", height: "1px", background: "#c9a87c" }} />
          </div>

          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
