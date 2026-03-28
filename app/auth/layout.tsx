import { Cormorant_Garamond, Outfit } from "next/font/google"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-outfit",
  display: "swap",
})

const STYLES = `
  @keyframes sclass-run {
    0%   { transform: translateX(-350px); opacity: 0; }
    7%   { opacity: 0.48; }
    93%  { opacity: 0.48; }
    100% { transform: translateX(calc(100vw + 350px)); opacity: 0; }
  }
  @keyframes escalade-run {
    0%   { transform: translateX(calc(100vw + 350px)); opacity: 0; }
    7%   { opacity: 0.36; }
    93%  { opacity: 0.36; }
    100% { transform: translateX(-350px); opacity: 0; }
  }
  @keyframes sprinter-run {
    0%   { transform: translateX(-350px); opacity: 0; }
    7%   { opacity: 0.42; }
    93%  { opacity: 0.42; }
    100% { transform: translateX(calc(100vw + 350px)); opacity: 0; }
  }
  @keyframes bokeh-drift {
    0%, 100% { transform: translate(0,0) scale(1); }
    33%       { transform: translate(-28px,-22px) scale(1.06); }
    66%       { transform: translate(18px,-32px) scale(0.94); }
  }
  @keyframes card-emerge {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lx-bokeh {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    filter: blur(72px);
    animation: bokeh-drift ease-in-out infinite;
  }
  .lx-vehicle {
    position: absolute;
    left: 0;
    pointer-events: none;
    will-change: transform;
  }
  .lx-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 430px;
    padding: clamp(2rem, 5vw, 3rem) clamp(1.75rem, 4.5vw, 2.75rem);
    background: rgba(10, 14, 24, 0.96);
    border: 1px solid rgba(201, 168, 124, 0.14);
    box-shadow:
      inset 0 1px 0 rgba(201, 168, 124, 0.09),
      0 70px 140px rgba(0, 0, 0, 0.75),
      0 30px 60px rgba(0, 0, 0, 0.45);
    animation: card-emerge 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
  }
  @media (max-width: 500px) {
    .lx-card { max-width: 100%; margin: 0.5rem; }
  }
`

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${cormorant.variable} ${outfit.variable}`}
      style={{
        minHeight: "100vh",
        background: "#070a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-outfit, system-ui)",
        padding: "clamp(0.75rem, 2vw, 1.5rem)",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Atmospheric layers ── */}
      {/* Warm ground glow — city lights reflected upward */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 110% 50% at 50% 115%, rgba(201,168,124,0.07) 0%, transparent 55%)",
      }} />
      {/* Upper dark vignette */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "linear-gradient(165deg, rgba(5,10,28,0.65) 0%, transparent 50%)",
      }} />
      {/* Grain texture for depth */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.88' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.55,
      }} />

      {/* ── Bokeh city lights ── */}
      <div className="lx-bokeh" style={{ width: 290, height: 290, bottom: "2%", left: "3%", background: "rgba(201,168,124,0.08)", animationDuration: "15s" }} />
      <div className="lx-bokeh" style={{ width: 210, height: 210, bottom: "18%", right: "4%", background: "rgba(55,75,190,0.06)", animationDuration: "19s", animationDelay: "-6s" }} />
      <div className="lx-bokeh" style={{ width: 165, height: 165, bottom: "0%", left: "44%", background: "rgba(225,170,55,0.07)", animationDuration: "12s", animationDelay: "-9s" }} />
      <div className="lx-bokeh" style={{ width: 105, height: 105, bottom: "22%", left: "17%", background: "rgba(201,168,124,0.05)", animationDuration: "17s", animationDelay: "-3s" }} />

      {/* ── Perspective road ── */}
      <svg
        aria-hidden
        style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "33%", pointerEvents: "none", opacity: 0.15 }}
        viewBox="0 0 1440 350"
        preserveAspectRatio="none"
      >
        {/* Road surface */}
        <polygon points="612,0 828,0 1440,350 0,350" fill="rgba(20,27,46,0.95)" />
        {/* Road edge lines */}
        <line x1="612" y1="0" x2="0" y2="350" stroke="rgba(201,168,124,0.65)" strokeWidth="1.5" />
        <line x1="828" y1="0" x2="1440" y2="350" stroke="rgba(201,168,124,0.65)" strokeWidth="1.5" />
        {/* Lane dashes — 3 lanes */}
        <line x1="678" y1="0" x2="145" y2="350" stroke="rgba(201,168,124,0.28)" strokeWidth="1" strokeDasharray="20,16" />
        <line x1="720" y1="0" x2="720" y2="350" stroke="rgba(201,168,124,0.35)" strokeWidth="1" strokeDasharray="20,16" />
        <line x1="762" y1="0" x2="1295" y2="350" stroke="rgba(201,168,124,0.28)" strokeWidth="1" strokeDasharray="20,16" />
      </svg>

      {/* ════════════════════════════════
          Animated Vehicle Silhouettes
      ════════════════════════════════ */}

      {/* ── Mercedes S-Class (W223) — LTR, mid-distance ── */}
      <div className="lx-vehicle" style={{ bottom: "26%", animation: "sclass-run 24s linear 2s infinite" }}>
        <svg viewBox="0 0 258 62" width="200" height="48" fill="none" aria-hidden>
          <defs>
            <filter id="vg-s" x="-15%" y="-50%" width="130%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="b" />
              <feColorMatrix in="b" type="matrix"
                values="1 0.78 0.28 0 0  0.8 0.58 0.08 0 0  0.08 0.02 0 0 0  0 0 0 0.42 0"
                result="g" />
              <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g stroke="#c9a87c" strokeLinecap="round" strokeLinejoin="round" filter="url(#vg-s)">
            {/* Body — long graceful sedan profile */}
            <path strokeWidth="0.85" d="
              M 6 54 L 6 46 Q 11 40 25 40 L 54 38 Q 66 35 76 27
              L 85 11 Q 124 6 162 9 L 185 18 Q 210 28 220 38
              L 234 44 L 238 52 L 238 54
            " />
            {/* Underbody with wheel arch gaps */}
            <path strokeWidth="0.85" d="M 6 54 L 36 54 M 62 54 L 178 54 M 204 54 L 238 54" />
            {/* Front wheel */}
            <circle cx="49" cy="54" r="13" strokeWidth="0.85" />
            <circle cx="49" cy="54" r="5.5" strokeWidth="0.6" stroke="rgba(201,168,124,0.4)" />
            {/* Rear wheel */}
            <circle cx="191" cy="54" r="13" strokeWidth="0.85" />
            <circle cx="191" cy="54" r="5.5" strokeWidth="0.6" stroke="rgba(201,168,124,0.4)" />
          </g>
        </svg>
      </div>

      {/* ── Cadillac Escalade — RTL, lower layer ── */}
      {/* scaleX(-1) flips it so the front faces the direction of travel */}
      <div className="lx-vehicle" style={{ bottom: "15%", animation: "escalade-run 31s linear 9s infinite" }}>
        <svg viewBox="0 0 212 76" width="182" height="65" fill="none" aria-hidden style={{ transform: "scaleX(-1)" }}>
          <g stroke="#c9a87c" strokeLinecap="round" strokeLinejoin="round">
            {/* Body — boxy, imposing SUV */}
            <path strokeWidth="0.85" d="
              M 8 65 L 8 20 Q 10 13 20 13 L 190 13 Q 198 13 199 20
              L 199 42 L 201 56 L 202 65
            " />
            {/* Window band */}
            <path strokeWidth="0.55" stroke="rgba(201,168,124,0.3)"
              d="M 12 21 L 12 38 L 196 38 L 196 21 Q 195 16 190 16 L 22 16 Q 14 16 12 21 Z" />
            {/* Underbody */}
            <path strokeWidth="0.85" d="M 8 65 L 27 65 M 57 65 L 152 65 M 182 65 L 202 65" />
            {/* Front wheel */}
            <circle cx="42" cy="65" r="15" strokeWidth="0.85" />
            <circle cx="42" cy="65" r="6" strokeWidth="0.65" stroke="rgba(201,168,124,0.38)" />
            {/* Rear wheel */}
            <circle cx="167" cy="65" r="15" strokeWidth="0.85" />
            <circle cx="167" cy="65" r="6" strokeWidth="0.65" stroke="rgba(201,168,124,0.38)" />
          </g>
        </svg>
      </div>

      {/* ── Mercedes Sprinter — LTR, foreground ── */}
      <div className="lx-vehicle" style={{ bottom: "5%", animation: "sprinter-run 40s linear 18s infinite" }}>
        <svg viewBox="0 0 294 83" width="244" height="69" fill="none" aria-hidden>
          <g stroke="#c9a87c" strokeLinecap="round" strokeLinejoin="round">
            {/* Body — high-roof van, characteristic tall profile */}
            <path strokeWidth="0.85" d="
              M 14 70 L 14 33 Q 16 20 27 18 L 91 16 Q 95 11 275 11
              L 280 16 L 280 66 L 280 70
            " />
            {/* Underbody */}
            <path strokeWidth="0.85" d="M 14 70 L 35 70 M 67 70 L 246 70 M 278 70 L 280 70" />
            {/* Cab window — distinctive trapezoid */}
            <path strokeWidth="0.58" stroke="rgba(201,168,124,0.32)"
              d="M 18 33 L 90 18 L 90 46 L 18 46 Z" />
            {/* Cargo panel divider */}
            <line x1="150" y1="14" x2="150" y2="70" stroke="rgba(201,168,124,0.18)" strokeWidth="0.55" />
            {/* Front wheel */}
            <circle cx="51" cy="70" r="16" strokeWidth="0.85" />
            <circle cx="51" cy="70" r="6.5" strokeWidth="0.65" stroke="rgba(201,168,124,0.38)" />
            {/* Rear wheel */}
            <circle cx="263" cy="70" r="16" strokeWidth="0.85" />
            <circle cx="263" cy="70" r="6.5" strokeWidth="0.65" stroke="rgba(201,168,124,0.38)" />
          </g>
        </svg>
      </div>

      {/* ══ Auth Card ══ */}
      <div className="lx-card">
        {/* Brand wordmark with flanking hairlines */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          marginBottom: "2.5rem",
        }}>
          <div style={{
            flex: 1, maxWidth: "68px", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(201,168,124,0.5))",
          }} />
          <span style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "0.6rem",
            fontWeight: 500,
            color: "#c9a87c",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            Livery Connect
          </span>
          <div style={{
            flex: 1, maxWidth: "68px", height: "1px",
            background: "linear-gradient(90deg, rgba(201,168,124,0.5), transparent)",
          }} />
        </div>

        {children}
      </div>
    </div>
  )
}
