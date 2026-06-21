import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getDashboard } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  BookOpen, CheckCircle2, PlayCircle, Award, Coins, ArrowRight, Search, MessageCircle, Play,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard')({ component: Dashboard })

function CompletionGauge({ pct }: { pct: number }) {
  const r = 54
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct / 100)
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
      <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
      <text x="60" y="60" textAnchor="middle" dominantBaseline="middle" className="rotate-90" style={{ transformOrigin: '60px 60px' }}>
        <tspan x="60" y="55" className="fill-foreground font-display text-2xl font-bold">{pct}%</tspan>
        <tspan x="60" y="74" className="fill-muted-foreground text-[9px] uppercase tracking-wider">completion</tspan>
      </text>
    </svg>
  )
}

function Dashboard() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  useEffect(() => { if (!isLoading && !user) navigate({ to: '/auth' }) }, [isLoading, user, navigate])

  const { data } = useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: !!user?.id,
    queryFn: () => getDashboard(),
  })

  const rows = data?.courses ?? []
  const tokenBalance = data?.tokenBalance ?? 0
  const certificates = data?.certificates ?? 0

  const completedCourses = rows.filter((r) => r.pct === 100).length
  const inProgressCourses = rows.filter((r) => r.pct > 0 && r.pct < 100).length
  const overallPct = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.pct, 0) / rows.length) : 0

  const continueCourse = rows.find((r) => r.pct > 0 && r.pct < 100) ?? rows[0]

  const stats = [
    { icon: CheckCircle2, label: 'Courses Completed', value: completedCourses, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: PlayCircle, label: 'In Progress', value: inProgressCourses, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: Coins, label: 'Token Balance', value: tokenBalance, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Award, label: 'Certificates', value: certificates, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ to: '/courses', search: search.trim() ? { q: search.trim() } : {} })
  }

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-8 sm:pt-12 pb-6 space-y-5">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, topics…"
              className="pl-10 h-11 bg-card border-border"
            />
          </form>

          {/* Welcome banner */}
          <div className="rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-5 sm:p-7 card-glass glow-ring">
            {continueCourse ? (
              <>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-primary uppercase tracking-wider font-semibold truncate">
                    {(continueCourse.courses as any).title} · <span className="capitalize">{(continueCourse.courses as any).level}</span>
                  </span>
                  <span className="shrink-0 font-bold text-primary">{continueCourse.pct}%</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2">
                  Welcome back, {user?.display_name ?? 'builder'} 👋
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Pick up where you left off — {continueCourse.completed}/{continueCourse.total} lessons done.
                </p>
                <Link to="/courses/$slug" params={{ slug: (continueCourse.courses as any).slug }}>
                  <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition">
                    <Play className="h-3.5 w-3.5 fill-current" /> Continue Learning
                  </button>
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">
                  Welcome, {user?.display_name ?? 'builder'} 👋
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground">You haven't enrolled in anything yet — pick a course to get started.</p>
                <Link to="/courses">
                  <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition">
                    Browse courses <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-2 sm:py-4 space-y-5">
        {/* Stats — 2x2 on mobile, 4 across on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-5 card-glass">
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${s.bg} ${s.color} mb-2`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="font-display text-xl sm:text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Curriculum progress */}
        {rows.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 card-glass">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-base sm:text-lg font-semibold">Curriculum Progress</h2>
              <Link to="/courses" className="text-xs text-primary hover:underline shrink-0">Browse all</Link>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              <CompletionGauge pct={overallPct} />
              <div className="w-full flex-1 space-y-3">
                {rows.map((r) => (
                  <Link
                    key={r.course_id as string}
                    to="/courses/$slug"
                    params={{ slug: (r.courses as any).slug }}
                    className="block group"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm mb-1">
                      <span className="font-medium truncate group-hover:text-primary">{(r.courses as any).title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{r.completed}/{r.total}</span>
                    </div>
                    <Progress value={r.pct} className="h-1.5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">You haven't enrolled in anything yet.</p>
            <Link to="/courses" className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-sm">
              Browse courses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* Help nudge */}
        <Link
          to="/community"
          className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent p-4 hover:border-primary/50 transition"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Need a hand?</div>
            <div className="text-xs text-muted-foreground">Ask the community — someone's probably hit the same snag.</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Link>
      </section>
    </PageShell>
  )
}
