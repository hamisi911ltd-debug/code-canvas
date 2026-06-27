import { accentFor } from './palette'

type IllustrationProps = { seed?: number }

/** Vibecoding — a chat bubble with a "typing" indicator and a floating AI sparkle. */
export function VibecodingIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect x="14" y="28" width="100" height="56" rx="16" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.5" />
      <path d="M30 84 L24 98 L42 84 Z" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.5" />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={48 + i * 16} cy={56} r={4} fill={accent} className="illo-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
      ))}
      <g className="illo-float" style={{ animationDelay: '0.3s' }}>
        <path
          d="M154 22 L160 34 L172 38 L160 42 L154 54 L148 42 L136 38 L148 34 Z"
          fill={accent}
        />
      </g>
      <circle cx="154" cy="38" r="22" fill="none" stroke={accent} strokeOpacity="0.25" strokeDasharray="3 5" className="illo-orbit" />
    </svg>
  )
}

/** Frontend / React — component blocks snapping together. */
export function FrontendIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <line x1="100" y1="60" x2="56" y2="32" stroke={accent} strokeOpacity="0.4" strokeWidth="2" />
      <line x1="100" y1="60" x2="148" y2="32" stroke={accent} strokeOpacity="0.4" strokeWidth="2" />
      <line x1="100" y1="60" x2="100" y2="98" stroke={accent} strokeOpacity="0.4" strokeWidth="2" />
      <rect x="78" y="42" width="44" height="36" rx="10" fill={accent} />
      <g className="illo-float">
        <rect x="32" y="14" width="34" height="28" rx="8" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6" />
      </g>
      <g className="illo-float" style={{ animationDelay: '0.6s' }}>
        <rect x="132" y="14" width="34" height="28" rx="8" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6" />
      </g>
      <g className="illo-float" style={{ animationDelay: '1.1s' }}>
        <rect x="82" y="86" width="34" height="24" rx="8" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6" />
      </g>
    </svg>
  )
}

/** Backend / APIs — request and response flowing between client and server. */
export function BackendIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect x="16" y="36" width="48" height="48" rx="10" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6" />
      <rect x="136" y="36" width="48" height="48" rx="10" fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6" />
      <circle cx="40" cy="60" r="8" fill={accent} fillOpacity="0.85" />
      <rect x="150" y="52" width="20" height="16" rx="3" fill={accent} fillOpacity="0.85" />
      <path d="M68 50 H132" stroke={accent} strokeWidth="2.5" className="illo-dash-flow" markerEnd="url(#arrowFwd)" />
      <path d="M132 72 H68" stroke={accent} strokeOpacity="0.5" strokeWidth="2.5" className="illo-dash-flow" markerEnd="url(#arrowBack)" />
      <circle cx="178" cy="30" r="5" fill={accent} className="illo-blink" />
      <defs>
        <marker id="arrowFwd" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={accent} /></marker>
        <marker id="arrowBack" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={accent} fillOpacity="0.5" /></marker>
      </defs>
    </svg>
  )
}

/** AI & Machine Learning — a small pulsing neural network. */
export function AiMlIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  const inputs = [30, 90]
  const hidden = [20, 60, 100]
  const output = [60]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {inputs.map((y, i) =>
        hidden.map((hy, j) => (
          <line key={`${i}-${j}`} x1="44" y1={y} x2="100" y2={hy} stroke={accent} strokeOpacity="0.3" strokeWidth="1.5" className="illo-dash-flow" />
        )),
      )}
      {hidden.map((hy, j) => (
        <line key={`h-${j}`} x1="100" y1={hy} x2="156" y2={output[0]} stroke={accent} strokeOpacity="0.3" strokeWidth="1.5" className="illo-dash-flow" />
      ))}
      {inputs.map((y, i) => <circle key={`i-${i}`} cx="44" cy={y} r="6" fill={accent} className="illo-pulse" style={{ animationDelay: `${i * 0.25}s` }} />)}
      {hidden.map((y, i) => <circle key={`hd-${i}`} cx="100" cy={y} r="6" fill={accent} fillOpacity="0.8" className="illo-pulse" style={{ animationDelay: `${0.15 + i * 0.2}s` }} />)}
      <circle cx="156" cy={output[0]} r="7" fill={accent} className="illo-pulse" style={{ animationDelay: '0.4s' }} />
    </svg>
  )
}

/** DevOps & Cloud — deploying up into the cloud, with an orbiting edge node. */
export function DevopsIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <g className="illo-float">
        <path
          d="M62 64c-12 0-20-8-20-18 0-9 7-16 16-17 3-10 12-17 23-17 13 0 24 10 25 23 9 1 16 9 16 18 0 10-8 18-18 18Z"
          fill="currentColor" className="text-card" stroke={accent} strokeOpacity="0.6"
        />
      </g>
      <rect x="86" y="76" width="20" height="16" rx="3" fill={accent} fillOpacity="0.85" />
      <path d="M96 76 V96" stroke={accent} strokeWidth="2.5" markerEnd="url(#deployArrow)" className="illo-dash-flow" />
      <g className="illo-orbit">
        <circle cx="96" cy="14" r="5" fill={accent} />
      </g>
      <defs>
        <marker id="deployArrow" markerWidth="8" markerHeight="8" refX="4" refY="0" orient="auto"><path d="M0,8 L4,0 L8,8 Z" fill={accent} /></marker>
      </defs>
    </svg>
  )
}

/** UI Design — a palette of swatches and a pen drawing a curve. */
export function DesignIllustration({ seed = 0 }: IllustrationProps) {
  const accent = accentFor(seed)
  const swatches = [accent, accentFor(seed + 1), accentFor(seed + 2)]
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <path d="M30 70 C 60 20, 120 100, 170 40" fill="none" stroke={accent} strokeWidth="2.5" className="illo-draw" strokeLinecap="round" />
      <circle cx="170" cy="40" r="4" fill={accent} className="illo-blink" />
      {swatches.map((c, i) => (
        <rect key={i} x={40 + i * 30} y="86" width="24" height="24" rx="6" fill={c} className="illo-float" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </svg>
  )
}

const REGISTRY: Record<string, React.ComponentType<IllustrationProps>> = {
  vibecoding: VibecodingIllustration,
  frontend: FrontendIllustration,
  backend: BackendIllustration,
  'ai-ml': AiMlIllustration,
  devops: DevopsIllustration,
  design: DesignIllustration,
}

/** Card-wrapped, animated illustration matching a course category. Pure code/SVG —
 *  no network call, no AI generation step, renders instantly with every lesson. */
export function LessonIllustration({ categorySlug, seed = 0, className = '' }: { categorySlug?: string | null; seed?: number; className?: string }) {
  const Illo = (categorySlug && REGISTRY[categorySlug]) || VibecodingIllustration
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative h-40 sm:h-48">
        <Illo seed={seed} />
      </div>
    </div>
  )
}
