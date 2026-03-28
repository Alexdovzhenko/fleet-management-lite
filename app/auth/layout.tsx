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
          LEFT PANEL
      ════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden"
        style={{ background: "#0a0f1e" }}
      >
        {/* Dot grid — full panel */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.7" fill="rgba(255,255,255,0.055)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />
        </svg>

        {/* Ambient glow — bottom-right where the map lives */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 55% at 75% 78%, rgba(0,113,227,0.14) 0%, transparent 65%)",
          }}
        />

        {/* Text protection gradient — fades out any map that drifts left */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, #0a0f1e 38%, rgba(10,15,30,0.85) 55%, transparent 75%)",
            zIndex: 2,
          }}
        />

        {/* ── City Grid Dispatch Map — bottom-right only ── */}
        <svg
          className="absolute pointer-events-none"
          style={{ bottom: 0, right: 0, width: "72%", height: "62%", zIndex: 1 }}
          viewBox="0 0 420 340"
          preserveAspectRatio="xMaxYMax meet"
          aria-hidden
        >
          <defs>
            <filter id="route-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feColorMatrix in="blur" type="matrix"
                values="0 0 0 0 0.1  0 0 0 0 0.5  0 0 0 0 1  0 0 0 0.55 0"
                result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="label-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/*
              City grid hub positions (within 420×340 viewBox, biased to right/bottom):
              AIRPORT    → AP  (310, 60)   top-right
              HOTEL      → HT  (180, 120)  upper-mid
              CONVENTION → CV  (330, 170)  mid-right
              DOWNTOWN   → DT  (200, 230)  center
              STADIUM    → ST  (90,  270)  lower-left
              MARINA     → MR  (355, 290)  lower-right
            */}
            <path id="mAP_HT" d="M 310 60  L 180 120" />
            <path id="mAP_CV" d="M 310 60  L 330 170" />
            <path id="mHT_CV" d="M 180 120 L 330 170" />
            <path id="mHT_DT" d="M 180 120 L 200 230" />
            <path id="mCV_DT" d="M 330 170 L 200 230" />
            <path id="mCV_MR" d="M 330 170 L 355 290" />
            <path id="mDT_ST" d="M 200 230 L 90  270" />
            <path id="mDT_MR" d="M 200 230 L 355 290" />
            <path id="mST_MR" d="M 90  270 L 355 290" />
            {/* Diagonal connectors — feels like real city diagonals */}
            <path id="mAP_DT" d="M 310 60  C 280 130 240 175 200 230" />
            <path id="mHT_ST" d="M 180 120 C 150 175 115 220  90 270" />
          </defs>

          {/* ── Faint city road grid underlay ── */}
          <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.75" fill="none">
            {/* Horizontals */}
            {[60, 120, 170, 230, 290].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="420" y2={y} />
            ))}
            {/* Verticals */}
            {[90, 180, 280, 355].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="340" />
            ))}
            {/* Diagonals */}
            <line x1="180" y1="0" x2="420" y2="240" strokeDasharray="6 10" opacity="0.6" />
            <line x1="0" y1="80" x2="280" y2="340" strokeDasharray="6 10" opacity="0.6" />
          </g>

          {/* ── Base routes (dim ghost lines, always visible) ── */}
          <g fill="none" strokeWidth="1" stroke="rgba(52,170,220,0.1)" strokeLinecap="round">
            <use href="#mAP_HT" /><use href="#mAP_CV" /><use href="#mHT_CV" />
            <use href="#mHT_DT" /><use href="#mCV_DT" /><use href="#mCV_MR" />
            <use href="#mDT_ST" /><use href="#mDT_MR" /><use href="#mST_MR" />
            <use href="#mAP_DT" /><use href="#mHT_ST" />
          </g>

          {/* ── Animated draw-on routes ── */}
          {[
            { d: "M 310 60  L 180 120",                       color: "#34aadc", w: "1.5", begin: "0.3s",  dur: "0.9s" },
            { d: "M 310 60  L 330 170",                       color: "#0071e3", w: "1.5", begin: "0.9s",  dur: "0.8s" },
            { d: "M 180 120 L 330 170",                       color: "#34aadc", w: "1.2", begin: "1.5s",  dur: "0.7s" },
            { d: "M 180 120 L 200 230",                       color: "#5ac8fa", w: "1.2", begin: "2.0s",  dur: "0.8s" },
            { d: "M 330 170 L 200 230",                       color: "#0071e3", w: "1.2", begin: "2.6s",  dur: "0.7s" },
            { d: "M 330 170 L 355 290",                       color: "#34aadc", w: "1.2", begin: "3.1s",  dur: "0.8s" },
            { d: "M 200 230 L  90 270",                       color: "#5ac8fa", w: "1",   begin: "3.7s",  dur: "0.7s" },
            { d: "M 200 230 L 355 290",                       color: "#0071e3", w: "1.2", begin: "4.2s",  dur: "0.9s" },
            { d: "M  90 270 L 355 290",                       color: "#34aadc", w: "1",   begin: "4.9s",  dur: "0.9s" },
            { d: "M 310 60 C 280 130 240 175 200 230",        color: "#5ac8fa", w: "1",   begin: "2.2s",  dur: "1.1s" },
            { d: "M 180 120 C 150 175 115 220  90 270",       color: "#5ac8fa", w: "1",   begin: "3.4s",  dur: "0.9s" },
          ].map(({ d, color, w, begin, dur }, i) => (
            <path
              key={i}
              d={d}
              stroke={color}
              strokeWidth={w}
              fill="none"
              strokeLinecap="round"
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset="1"
              filter="url(#route-glow)"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="1" to="0"
                dur={dur} begin={begin}
                fill="freeze"
                calcMode="spline"
                keySplines="0.4 0 0.2 1"
                keyTimes="0;1"
              />
            </path>
          ))}

          {/* ── Traveling light dots ── */}
          <g filter="url(#dot-glow)">
            <circle r="2.8" fill="#ffffff" opacity="0.95">
              <animateMotion dur="3.2s" repeatCount="indefinite" begin="1.4s">
                <mpath href="#mAP_CV" />
              </animateMotion>
            </circle>
            <circle r="2.4" fill="#5ac8fa" opacity="0.9">
              <animateMotion dur="2.8s" repeatCount="indefinite" begin="2.2s">
                <mpath href="#mHT_DT" />
              </animateMotion>
            </circle>
            <circle r="2.4" fill="#ffffff" opacity="0.85">
              <animateMotion dur="3.6s" repeatCount="indefinite" begin="3.0s">
                <mpath href="#mDT_MR" />
              </animateMotion>
            </circle>
            <circle r="2" fill="#34aadc" opacity="0.9">
              <animateMotion dur="4.0s" repeatCount="indefinite" begin="1.8s">
                <mpath href="#mAP_DT" />
              </animateMotion>
            </circle>
            <circle r="2" fill="#ffffff" opacity="0.8">
              <animateMotion dur="3.0s" repeatCount="indefinite" begin="5.2s" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                <mpath href="#mST_MR" />
              </animateMotion>
            </circle>
            <circle r="1.8" fill="#5ac8fa" opacity="0.85">
              <animateMotion dur="2.6s" repeatCount="indefinite" begin="4.5s">
                <mpath href="#mCV_MR" />
              </animateMotion>
            </circle>
          </g>

          {/* ── Hub nodes ── */}
          {/* AIRPORT — primary, largest */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 1.0s forwards" }}>
            <circle cx="310" cy="60" r="7" fill="#0071e3" />
            <circle cx="310" cy="60" r="3" fill="white" />
            <circle cx="310" cy="60" r="7" fill="none" stroke="#0071e3" strokeWidth="1.5">
              <animate attributeName="r" values="7;20" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2.5s" begin="1.5s" repeatCount="indefinite" />
            </circle>
            {/* AIRPORT pill — plane icon + label */}
            <rect x="320" y="48" width="80" height="20" rx="10" fill="rgba(0,80,180,0.55)" stroke="rgba(100,180,255,0.5)" strokeWidth="0.8" />
            {/* plane icon */}
            <g transform="translate(329, 54)" fill="rgba(255,255,255,0.9)">
              <path d="M0 4.5 L6 1.5 Q7.5 0.5 8 2 L8 3 L4.5 4.5 L8 6 L8 7 Q7.5 8.5 6 7.5 L0 4.5Z" />
            </g>
            <text x="362" y="61.5" textAnchor="start" fill="rgba(255,255,255,0.95)" fontSize="8.5" fontFamily="var(--font-jakarta,system-ui)" fontWeight="700" letterSpacing="0.06em">AIRPORT</text>
          </g>

          {/* HOTEL */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 2.2s forwards" }}>
            <circle cx="180" cy="120" r="5.5" fill="#34aadc" />
            <circle cx="180" cy="120" r="2.5" fill="white" />
            <circle cx="180" cy="120" r="5.5" fill="none" stroke="#34aadc" strokeWidth="1.2">
              <animate attributeName="r" values="5.5;16" dur="2.8s" begin="2.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="2.8s" begin="2.7s" repeatCount="indefinite" />
            </circle>
            {/* HOTEL pill — bed icon */}
            <rect x="122" y="109" width="62" height="19" rx="9.5" fill="rgba(30,120,180,0.5)" stroke="rgba(90,190,240,0.45)" strokeWidth="0.8" />
            {/* bed icon */}
            <g transform="translate(130, 115)" fill="rgba(255,255,255,0.9)">
              <rect x="0" y="4" width="10" height="2" rx="0.5" />
              <rect x="3" y="1.5" width="7" height="3" rx="1.5" />
              <rect x="0" y="5.5" width="1.5" height="3" rx="0.5" />
              <rect x="8.5" y="5.5" width="1.5" height="3" rx="0.5" />
            </g>
            <text x="144" y="121.5" textAnchor="start" fill="rgba(255,255,255,0.9)" fontSize="8.5" fontFamily="var(--font-jakarta,system-ui)" fontWeight="700" letterSpacing="0.06em">HOTEL</text>
          </g>

          {/* CONVENTION CTR */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 3.0s forwards" }}>
            <circle cx="330" cy="170" r="6" fill="#0071e3" />
            <circle cx="330" cy="170" r="2.5" fill="white" />
            <circle cx="330" cy="170" r="6" fill="none" stroke="#0071e3" strokeWidth="1.2">
              <animate attributeName="r" values="6;18" dur="3.0s" begin="3.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="3.0s" begin="3.5s" repeatCount="indefinite" />
            </circle>
            {/* CONVENTION pill — star icon */}
            <rect x="340" y="159" width="78" height="19" rx="9.5" fill="rgba(0,80,180,0.5)" stroke="rgba(100,170,255,0.45)" strokeWidth="0.8" />
            {/* star icon */}
            <g transform="translate(348, 164)" fill="rgba(255,255,255,0.9)">
              <path d="M5 0 L6.2 3.6 L10 3.6 L7 5.8 L8.1 9.4 L5 7.2 L1.9 9.4 L3 5.8 L0 3.6 L3.8 3.6Z" transform="scale(0.9)" />
            </g>
            <text x="360" y="171.5" textAnchor="start" fill="rgba(255,255,255,0.92)" fontSize="8" fontFamily="var(--font-jakarta,system-ui)" fontWeight="700" letterSpacing="0.05em">CONVENTION</text>
          </g>

          {/* DOWNTOWN — central hub, largest pulse */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 3.8s forwards" }}>
            <circle cx="200" cy="230" r="8" fill="#0071e3" />
            <circle cx="200" cy="230" r="3.5" fill="white" />
            <circle cx="200" cy="230" r="8" fill="none" stroke="#0071e3" strokeWidth="2">
              <animate attributeName="r" values="8;24" dur="2.2s" begin="4.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="2.2s" begin="4.3s" repeatCount="indefinite" />
            </circle>
            {/* DOWNTOWN pill — building icon + connection badge */}
            <rect x="212" y="219" width="80" height="21" rx="10.5" fill="rgba(0,90,210,0.65)" stroke="rgba(100,180,255,0.6)" strokeWidth="1" />
            {/* building icon */}
            <g transform="translate(220, 224)" fill="rgba(255,255,255,0.95)">
              <rect x="1" y="0" width="8" height="10" rx="0.5" />
              <rect x="2.5" y="1.5" width="2" height="2" rx="0.3" fill="rgba(0,90,210,0.8)" />
              <rect x="5.5" y="1.5" width="2" height="2" rx="0.3" fill="rgba(0,90,210,0.8)" />
              <rect x="2.5" y="5" width="2" height="2" rx="0.3" fill="rgba(0,90,210,0.8)" />
              <rect x="5.5" y="5" width="2" height="2" rx="0.3" fill="rgba(0,90,210,0.8)" />
              <rect x="3.5" y="7.5" width="3" height="2.5" rx="0.3" fill="rgba(0,90,210,0.8)" />
            </g>
            <text x="234" y="232.5" textAnchor="start" fill="white" fontSize="9" fontFamily="var(--font-jakarta,system-ui)" fontWeight="800" letterSpacing="0.05em">DOWNTOWN</text>
            {/* Connection badge */}
            <circle cx="292" cy="218" r="7" fill="#0071e3" stroke="#0a0f1e" strokeWidth="1.5" />
            <text x="292" y="221.5" textAnchor="middle" fill="white" fontSize="7.5" fontFamily="var(--font-jakarta,system-ui)" fontWeight="800">6</text>
          </g>

          {/* STADIUM */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 4.6s forwards" }}>
            <circle cx="90" cy="270" r="5" fill="#5ac8fa" />
            <circle cx="90" cy="270" r="2" fill="white" />
            <circle cx="90" cy="270" r="5" fill="none" stroke="#5ac8fa" strokeWidth="1">
              <animate attributeName="r" values="5;14" dur="3.2s" begin="5.1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="3.2s" begin="5.1s" repeatCount="indefinite" />
            </circle>
            {/* STADIUM pill — flag icon */}
            <rect x="100" y="260" width="66" height="19" rx="9.5" fill="rgba(40,140,200,0.45)" stroke="rgba(90,200,250,0.4)" strokeWidth="0.8" />
            {/* flag icon */}
            <g transform="translate(108, 265)" fill="rgba(255,255,255,0.85)">
              <rect x="0" y="0" width="1.5" height="9" rx="0.5" />
              <path d="M1.5 0 L8 2 L1.5 4.5Z" />
            </g>
            <text x="121" y="272.5" textAnchor="start" fill="rgba(255,255,255,0.88)" fontSize="8.5" fontFamily="var(--font-jakarta,system-ui)" fontWeight="700" letterSpacing="0.05em">STADIUM</text>
          </g>

          {/* MARINA */}
          <g opacity="0" style={{ animation: "nodeIn 0.5s ease 5.2s forwards" }}>
            <circle cx="355" cy="290" r="5.5" fill="#34aadc" />
            <circle cx="355" cy="290" r="2.2" fill="white" />
            <circle cx="355" cy="290" r="5.5" fill="none" stroke="#34aadc" strokeWidth="1">
              <animate attributeName="r" values="5.5;16" dur="2.8s" begin="5.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="2.8s" begin="5.7s" repeatCount="indefinite" />
            </circle>
            {/* MARINA pill — anchor icon */}
            <rect x="270" y="279" width="66" height="19" rx="9.5" fill="rgba(30,120,180,0.5)" stroke="rgba(90,190,240,0.45)" strokeWidth="0.8" />
            {/* anchor icon */}
            <g transform="translate(278, 284)" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" strokeLinecap="round">
              <circle cx="5" cy="2" r="1.5" />
              <line x1="5" y1="3.5" x2="5" y2="9" />
              <path d="M2 5.5 C2 8.5 8 8.5 8 5.5" />
              <line x1="3" y1="4.5" x2="7" y2="4.5" />
            </g>
            <text x="291" y="291.5" textAnchor="start" fill="rgba(255,255,255,0.9)" fontSize="8.5" fontFamily="var(--font-jakarta,system-ui)" fontWeight="700" letterSpacing="0.05em">MARINA</text>
          </g>
        </svg>

        {/* ── Panel content — z-index 3, always above everything ── */}
        <div className="relative flex flex-col h-full px-14 py-14" style={{ zIndex: 3 }}>
          {/* Brand */}
          <div className="flex items-center gap-2.5" style={{ animation: "lcFadeUp 0.6s ease 0.1s both" }}>
            <svg viewBox="0 0 44 30" style={{ height: "20px", width: "auto" }} aria-label="LC">
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0071e3" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0071e3" />
            </svg>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.01em" }}>
              Livery Connect
            </span>
          </div>

          {/* Hero — constrained to left half, text always sharp */}
          <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: "300px" }}>
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
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
                fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)",
                fontWeight: 800,
                color: "#f5f5f7",
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                marginBottom: "1.1rem",
                animation: "lcFadeUp 0.6s ease 0.3s both",
              }}
            >
              Your fleet,
              <br />
              <span style={{ color: "#34aadc" }}>fully connected.</span>
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.48)",
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
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: "1.4rem",
              display: "grid",
              gridTemplateColumns: "repeat(3,auto)",
              gap: "0 2rem",
              animation: "lcFadeUp 0.6s ease 0.5s both",
              maxWidth: "300px",
            }}
          >
            {[
              { value: "500+", label: "Operators" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Support" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f5f5f7", letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {value}
                </div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.32)", marginTop: "0.28rem" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          RIGHT PANEL — living light background
      ════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex items-center justify-center p-8 lg:p-12 relative overflow-hidden"
        style={{ background: "#eef1f6" }}
      >
        {/* Slow-drifting gradient orbs — create depth under the card */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "70%", height: "70%",
            top: "-15%", right: "-10%",
            background: "radial-gradient(circle, rgba(0,113,227,0.07) 0%, transparent 70%)",
            animation: "orb1 18s ease-in-out infinite alternate",
          }} />
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "55%", height: "55%",
            bottom: "-10%", left: "-8%",
            background: "radial-gradient(circle, rgba(52,170,220,0.06) 0%, transparent 70%)",
            animation: "orb2 22s ease-in-out infinite alternate",
          }} />
          <div style={{
            position: "absolute", borderRadius: "50%",
            width: "45%", height: "45%",
            top: "40%", left: "30%",
            background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 70%)",
            animation: "orb3 15s ease-in-out infinite alternate",
          }} />
        </div>
        {/* Subtle diagonal line texture */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden style={{ opacity: 0.025 }}>
          <defs>
            <pattern id="diag-lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#0071e3" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diag-lines)" />
        </svg>
        <div style={{ width: "100%", maxWidth: "400px", position: "relative", zIndex: 1 }}>
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <svg viewBox="0 0 44 30" style={{ height: "20px", width: "auto" }}>
              <path d="M3 2 L3 24 Q3 28 7 28 L15 28 L13 24 L8 24 Q7 24 7 23 L7 2 Z" fill="#0071e3" />
              <path d="M30 6 L23 6 Q17 6 17 15 Q17 24 23 24 L30 24 L32 28 L23 28 Q11 28 11 15 Q11 2 23 2 L32 2 Z" fill="#0071e3" />
            </svg>
            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1d1d1f" }}>Livery Connect</span>
          </div>

          {/* macOS-style card */}
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

          <p
            style={{
              textAlign: "center",
              fontSize: "0.7rem",
              color: "rgba(29,29,31,0.38)",
              marginTop: "1.2rem",
              lineHeight: 1.6,
            }}
          >
            By continuing, you agree to our{" "}
            <a href="#" style={{ color: "#0071e3", textDecoration: "none" }}>Terms</a>
            {" & "}
            <a href="#" style={{ color: "#0071e3", textDecoration: "none" }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes lcFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nodeIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes orb1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-6%, 8%) scale(1.12); }
        }
        @keyframes orb2 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(8%, -6%) scale(1.08); }
        }
        @keyframes orb3 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(-4%, 5%) scale(0.92); }
        }
      `}</style>
    </div>
  )
}
