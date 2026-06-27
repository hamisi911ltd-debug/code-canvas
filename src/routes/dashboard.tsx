import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getDashboard } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Progress } from '@/components/ui/progress'
import { fireBigConfetti } from '@/components/Celebration'
import {
  BookOpen, CheckCircle2, PlayCircle, Award, Coins, ArrowRight, Play, GraduationCap,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard')({ component: Dashboard })

function Dashboard() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!isLoading && !user) navigate({ to: '/auth' }) }, [isLoading, user, navigate])

  const { data } = useQuery({
    queryKey: ['dashboard', user?.id],
    enabled: !!user?.id,
    queryFn: () => getDashboard(),
  })

  const rows = data?.courses ?? []
  const tokenBalance = data?.tokenBalance ?? 0
  const certificates = data?.certificates ?? 0
  const coursesForPlatformCert = data?.coursesForPlatformCert ?? 6
  const platformCertificate = data?.platformCertificate

  const completedCourses = rows.filter((r) => r.pct === 100).length
  const inProgressCourses = rows.filter((r) => r.pct > 0 && r.pct < 100).length

  const continueCourse = rows.find((r) => r.pct > 0 && r.pct < 100) ?? rows[0]

  useEffect(() => {
    if (!platformCertificate) return
    const seenKey = `vl_platform_cert_seen_${(platformCertificate as any).user_id}`
    if (localStorage.getItem(seenKey)) return
    localStorage.setItem(seenKey, '1')
    fireBigConfetti()
  }, [platformCertificate])

  const stats = [
    { icon: PlayCircle, label: 'In Progress', value: inProgressCourses, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { icon: CheckCircle2, label: 'Completed', value: `${completedCourses}/${coursesForPlatformCert}`, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: Coins, label: 'Tokens', value: tokenBalance, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: Award, label: 'Certificates', value: certificates + (platformCertificate ? 1 : 0), color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ]

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-3 sm:pt-6 pb-4">
          {/* Welcome banner */}
          <div className="rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-4 sm:p-7 card-glass glow-ring">
            {continueCourse ? (
              <>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-primary uppercase tracking-wider font-semibold truncate">
                    {(continueCourse.courses as any).title}
                  </span>
                  <span className="shrink-0 font-bold text-primary">{continueCourse.pct}%</span>
                </div>
                <h1 className="font-display text-xl sm:text-3xl font-bold mt-1.5">
                  Welcome back, {user?.display_name ?? 'builder'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {continueCourse.completed}/{continueCourse.total} lessons done — keep going.
                </p>
                <Link to="/courses/$slug" params={{ slug: (continueCourse.courses as any).slug }}>
                  <button className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition">
                    <Play className="h-3.5 w-3.5 fill-current" /> Continue Learning
                  </button>
                </Link>
              </>
            ) : (
              <>
                <h1 className="font-display text-xl sm:text-3xl font-bold">
                  Welcome, {user?.display_name ?? 'builder'}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">You haven't enrolled in anything yet.</p>
                <Link to="/courses">
                  <button className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover:bg-primary/90 transition">
                    Browse courses <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-8 space-y-4">
        {/* Stats — 2x2 on mobile, 4 across on larger screens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-2.5 sm:p-5 card-glass">
              <div className={`grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg ${s.bg} ${s.color} mb-1.5 sm:mb-2`}>
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="font-display text-lg sm:text-2xl font-bold">{s.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Platform graduation certificate */}
        {platformCertificate ? (
          <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-accent/5 p-5 sm:p-7 text-center glow-ring animate-in fade-in-0 zoom-in-95 duration-500">
            <div className="absolute inset-0 grid-pattern opacity-20" />
            <div className="relative">
              <GraduationCap className="mx-auto h-12 w-12 text-primary mb-3" />
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">VibeLearn Certified Graduate</p>
              <h3 className="font-display text-xl sm:text-2xl font-bold mt-1.5">You completed all {coursesForPlatformCert} courses! 🎉</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Issued {new Date((platformCertificate as any).issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        ) : completedCourses > 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-card/50 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-sm font-medium flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Graduation progress</span>
              <span className="text-xs text-muted-foreground shrink-0">{completedCourses}/{coursesForPlatformCert} courses</span>
            </div>
            <Progress value={(completedCourses / coursesForPlatformCert) * 100} className="h-1.5" />
            <p className="mt-2 text-xs text-muted-foreground">Complete all {coursesForPlatformCert} courses to earn your VibeLearn certificate.</p>
          </div>
        ) : null}

        {/* My courses */}
        {rows.length > 0 ? (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 card-glass">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base sm:text-lg font-semibold">My Courses</h2>
              <Link to="/courses" className="text-xs text-primary hover:underline shrink-0">Browse all</Link>
            </div>
            <div className="space-y-3">
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
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 sm:p-10 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground text-sm">You haven't enrolled in anything yet.</p>
            <Link to="/courses" className="inline-flex items-center gap-1 mt-3 text-primary hover:underline text-sm">
              Browse courses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </section>
    </PageShell>
  )
}
