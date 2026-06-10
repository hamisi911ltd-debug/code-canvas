import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getCategories, getCertifications } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
  Award, ArrowRight, BookOpen, Zap, CheckCircle2,
} from 'lucide-react'

export const Route = createFileRoute('/tracks')({ component: TracksPage })

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
}

const trackColors: Record<string, string> = {
  vibecoding: 'from-violet-500/20 via-purple-500/10 to-transparent',
  frontend: 'from-blue-500/20 via-cyan-500/10 to-transparent',
  backend: 'from-emerald-500/20 via-teal-500/10 to-transparent',
  'ai-ml': 'from-orange-500/20 via-amber-500/10 to-transparent',
  devops: 'from-sky-500/20 via-blue-500/10 to-transparent',
  design: 'from-pink-500/20 via-rose-500/10 to-transparent',
}

function TracksPage() {
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const { data: tracks, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const { data: certs } = useQuery({
    queryKey: ['certifications', user?.id],
    enabled: !!user,
    queryFn: () => getCertifications(),
  })

  const certSet = new Set((certs ?? []).map((c: any) => c.category_id as string))

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative bg-glow overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-14">
          <div
            className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs text-primary font-medium mb-5">
              <Zap className="h-3.5 w-3.5" />
              Learning Tracks
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Pick your track.<br />
              <span className="text-primary">Ship something real.</span>
            </h1>
            <p className="mt-5 text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Each track is a curated path from zero to shipped — lessons, quizzes, and a final exam that earns you a certificate.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {[
                { icon: BookOpen, label: '20+ lessons' },
                { icon: CheckCircle2, label: 'Per-lesson quizzes' },
                { icon: Award, label: 'Certificates on completion' },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Track grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(tracks ?? []).map((track: any, idx: number) => {
              const Icon = iconMap[track.icon ?? 'Sparkles'] ?? Sparkles
              const gradient = trackColors[track.slug] ?? 'from-primary/20 via-accent/10 to-transparent'
              const certified = certSet.has(track.id)
              return (
                <Link
                  key={track.id}
                  to="/tracks/$trackSlug"
                  params={{ trackSlug: track.slug }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 card-glass"
                  style={{
                    transitionDelay: `${idx * 60}ms`,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${idx * 60}ms, transform 0.5s ease ${idx * 60}ms, border-color 0.2s`,
                  }}
                >
                  {/* Gradient top */}
                  <div className={`h-28 bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 grid-pattern opacity-20" />
                    <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-background/60 backdrop-blur border border-border group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    {certified && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        <Award className="h-3 w-3" />
                        Certified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{track.name}</h3>
                    {track.description && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{track.description}</p>
                    )}
                    <div className="mt-5 flex items-center justify-between">
                      <Badge variant="outline" className="border-border text-muted-foreground text-xs capitalize">
                        {track.slug === 'vibecoding' ? 'Most popular' : track.slug === 'frontend' ? 'In-demand' : 'Track'}
                      </Badge>
                      <span className="flex items-center gap-1.5 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Start track <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Bottom CTA */}
        {!user && (
          <div
            className="mt-16 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-10 text-center glow-ring"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease 400ms, transform 0.6s ease 400ms',
            }}
          >
            <Award className="mx-auto h-12 w-12 text-primary mb-4" />
            <h3 className="font-display text-2xl font-bold">Earn certificates, track progress</h3>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              Create a free account to track which lessons you have completed, take quizzes, and earn a shareable certificate for each track.
            </p>
            <Link to="/auth">
              <button className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Create free account <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  )
}
