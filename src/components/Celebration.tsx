import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { ArrowRight, type LucideIcon } from 'lucide-react'

export function fireConfetti() {
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 35,
    origin: { y: 0.65 },
    colors: ['#2dd4a8', '#60a5fa', '#f59e0b', '#f472b6'],
  })
}

export function fireBigConfetti() {
  const colors = ['#2dd4a8', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa']
  confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.6 }, colors })
  setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 65, origin: { x: 0 }, colors }), 200)
  setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 65, origin: { x: 1 }, colors }), 200)
}

/** Full-screen celebration card that auto-advances after `autoMs`, with a manual skip button. */
export function CelebrationOverlay({
  icon: Icon,
  title,
  subtitle,
  ctaLabel = 'Continue',
  autoMs = 1800,
  big = false,
  onDone,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  ctaLabel?: string
  autoMs?: number
  big?: boolean
  onDone: () => void
}) {
  const [remaining, setRemaining] = useState(Math.ceil(autoMs / 1000))
  const firedRef = useRef(false)

  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true
      big ? fireBigConfetti() : fireConfetti()
    }
    const tick = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    const timeout = setTimeout(onDone, autoMs)
    return () => { clearInterval(tick); clearTimeout(timeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200 px-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-primary/40 bg-card p-8 text-center shadow-2xl glow-ring animate-in zoom-in-95 fade-in-0 duration-300">
        <div className="absolute inset-0 rounded-3xl grid-pattern opacity-20 pointer-events-none" />
        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary mb-4 animate-bounce">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          <button
            onClick={onDone}
            className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">Continuing automatically in {remaining}s…</p>
        </div>
      </div>
    </div>
  )
}
