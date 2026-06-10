import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getTrackData } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
  Award, ArrowRight, CheckCircle2, BookOpen, Play,
  Lock, ChevronRight,
} from 'lucide-react'

export const Route = createFileRoute('/tracks/$trackSlug')({ component: TrackPage })

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
}

function ProgressRing({ pct, size = 52, stroke = 4 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className="text-muted/30" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="text-primary"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function TrackPage() {
  const { trackSlug } = Route.useParams()
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const { data: track, isLoading } = useQuery({
    queryKey: ['track-data', trackSlug],
    queryFn: async () => {
      const d = await getTrackData({ data: { trackSlug } })
      if (!d) throw notFound()
      return d
    },
  })

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20 space-y-4">
          <div className="h-40 bg-muted/40 animate-pulse rounded-2xl" />
          <div className="h-64 bg-muted/40 animate-pulse rounded-2xl" />
          <div className="h-64 bg-muted/40 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  if (!track) return null

  const { category, courses, exam, certification, overallPct, totalLessons, totalCompleted } = track as any
  const Icon = iconMap[category.icon ?? 'Sparkles'] ?? Sparkles

  // Find first incomplete lesson across all courses
  const firstIncompleteCourse = (courses as any[]).find((c) => c.pct < 100)
  const firstIncompleteLesson = firstIncompleteCourse?.lessons?.find(
    (l: any) => !(track.completedIds as string[]).includes(l.id),
  )

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative bg-glow overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-14 pb-10">
          <Link to="/tracks" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← All tracks
          </Link>

          <div
            className="mt-5"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 border border-primary/30 text-primary shrink-0">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs text-primary uppercase tracking-wider font-medium">Learning Track</p>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold">{category.name}</h1>
                </div>
              </div>

              {/* Overall progress ring */}
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 px-5 py-3">
                <div className="relative">
                  <ProgressRing pct={overallPct} size={56} stroke={5} />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary" style={{ transform: 'rotate(0deg)' }}>
                    {overallPct}%
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold">{totalCompleted}/{totalLessons}</div>
                  <div className="text-xs text-muted-foreground">lessons done</div>
                </div>
              </div>
            </div>

            {category.description && (
              <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">{category.description}</p>
            )}

            {certification && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary">
                <Award className="h-4 w-4" />
                You earned a certificate for this track! Score: {(certification as any).score}%
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {firstIncompleteLesson && user && (
                <Link
                  to="/tracks/$trackSlug/$lessonId"
                  params={{ trackSlug, lessonId: firstIncompleteLesson.id }}
                >
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <Play className="h-4 w-4" />
                    {totalCompleted === 0 ? 'Start track' : 'Continue learning'}
                  </Button>
                </Link>
              )}
              {exam && user && (
                <Link to="/exam/$trackSlug" params={{ trackSlug }}>
                  <Button variant="outline" className="gap-2">
                    <Award className="h-4 w-4" />
                    {certification ? 'Retake exam' : 'Take final exam'}
                  </Button>
                </Link>
              )}
              {!user && (
                <Link to="/auth">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <Lock className="h-4 w-4" />
                    Sign in to track progress
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course list */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
        {(courses as any[]).map((course: any, ci: number) => (
          <div
            key={course.id}
            className="rounded-2xl border border-border bg-card overflow-hidden card-glass"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${ci * 100 + 100}ms, transform 0.5s ease ${ci * 100 + 100}ms`,
            }}
          >
            {/* Course header */}
            <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ProgressRing pct={course.pct} size={44} stroke={4} />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary" style={{ transform: 'rotate(0deg)' }}>
                    {course.pct}%
                  </span>
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold">{course.title}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs border-border capitalize">{course.level}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </span>
                  </div>
                </div>
              </div>
              {course.pct === 100 && (
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
              )}
            </div>

            {/* Lesson list */}
            <div className="divide-y divide-border/50">
              {(course.lessons as any[]).map((lesson: any, li: number) => {
                const done = (track.completedIds as string[]).includes(lesson.id)
                const quizResult = (track.quizResults as any)[lesson.id]
                return (
                  <Link
                    key={lesson.id}
                    to="/tracks/$trackSlug/$lessonId"
                    params={{ trackSlug, lessonId: lesson.id }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors group"
                  >
                    <div
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold border-2 transition-all ${
                        done
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : li + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">{lesson.title}</div>
                      {lesson.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{lesson.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.duration_minutes > 0 && (
                        <span className="text-xs text-muted-foreground">{lesson.duration_minutes} min</span>
                      )}
                      {lesson.quiz && (
                        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          quizResult?.passed
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted/50 text-muted-foreground'
                        }`}>
                          <BookOpen className="h-3 w-3" />
                          {quizResult?.passed ? `${quizResult.score}%` : 'Quiz'}
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Exam card */}
        {exam && (
          <div
            className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-8 text-center glow-ring"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `opacity 0.5s ease ${(courses as any[]).length * 100 + 200}ms, transform 0.5s ease ${(courses as any[]).length * 100 + 200}ms`,
            }}
          >
            <Award className="mx-auto h-12 w-12 text-primary mb-4" />
            <h3 className="font-display text-xl font-bold">{exam.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {(exam.questions as any[]).length} questions · Pass at {exam.pass_score ?? 70}% to earn your certificate
            </p>
            {certification ? (
              <div className="mt-5">
                <Badge className="bg-primary text-primary-foreground px-4 py-1 text-sm">
                  Certified — {(certification as any).score}%
                </Badge>
              </div>
            ) : user ? (
              <Link to="/exam/$trackSlug" params={{ trackSlug }} className="mt-6 inline-block">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                  <Award className="h-4 w-4" />
                  Take final exam
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">Sign in to unlock the exam and earn a certificate.</p>
            )}
          </div>
        )}
      </section>
    </PageShell>
  )
}
