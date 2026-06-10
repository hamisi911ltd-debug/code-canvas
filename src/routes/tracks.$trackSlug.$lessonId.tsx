import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getTrackData, markLessonComplete, submitQuiz } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  BookOpen, Award, Sparkles, Layout, Server, Brain, Cloud, Palette,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/tracks/$trackSlug/$lessonId')({ component: TrackLessonPage })

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function useConfetti() {
  return useCallback(() => {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999'
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d')!
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ['#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#fb923c']
    const particles = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 80,
      r: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2.5 + Math.random() * 4,
      ta: Math.random() * Math.PI * 2,
      ts: 0.05 + Math.random() * 0.06,
    }))
    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let allDone = true
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.ta += p.ts
        if (p.y < canvas.height + 20) allDone = false
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.ta)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2)
        ctx.restore()
      }
      if (!allDone) raf = requestAnimationFrame(draw)
      else if (canvas.parentNode) document.body.removeChild(canvas)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); if (canvas.parentNode) document.body.removeChild(canvas) }
  }, [])
}

// ── Inline quiz ───────────────────────────────────────────────────────────────
type QuizQ = { q: string; options: string[]; answer: number }

function InlineQuiz({
  lesson,
  priorResult,
  onPass,
}: {
  lesson: any
  priorResult: { score: number; passed: boolean } | null
  onPass: () => void
}) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const runConfetti = useConfetti()
  const questions: QuizQ[] = lesson.quiz?.questions ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(priorResult ?? null)
  const [visible, setVisible] = useState(false)

  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  const submitMutation = useMutation({
    mutationFn: (d: { score: number; passed: boolean }) =>
      submitQuiz({ data: { lessonId: lesson.id, score: d.score, passed: d.passed } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['track-data'] }),
  })

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= 70
    setResult({ score, passed })
    setSubmitted(true)
    submitMutation.mutate({ score, passed })
    if (passed) {
      toast.success(`Quiz passed! ${score}%`)
      runConfetti()
      onPass()
    } else {
      toast.error(`${score}% — need 70% to pass. Review and retry!`)
    }
  }

  const retry = () => {
    setAnswers(Array(questions.length).fill(null))
    setSubmitted(false)
    setResult(null)
  }

  if (!questions.length) return null

  return (
    <div
      className="mt-10 rounded-2xl border border-border bg-card overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/20">
        <BookOpen className="h-5 w-5 text-primary" />
        <div>
          <div className="font-semibold text-sm">Lesson Quiz</div>
          <div className="text-xs text-muted-foreground">{questions.length} questions · 70% to pass</div>
        </div>
        {result?.passed && (
          <Badge className="ml-auto bg-primary text-primary-foreground">Passed {result.score}%</Badge>
        )}
        {result && !result.passed && (
          <Badge variant="destructive" className="ml-auto">Failed {result.score}%</Badge>
        )}
      </div>

      <div className="p-6 space-y-7">
        {questions.map((q, qi) => {
          const chosen = answers[qi]
          return (
            <div key={qi}>
              <p className="text-sm font-medium mb-3">
                <span className="text-primary mr-2">{qi + 1}.</span>{q.q}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi
                  const isCorrect = oi === q.answer
                  let cls =
                    'flex items-center gap-3 rounded-xl border p-3 text-sm cursor-pointer select-none transition-all '
                  if (submitted) {
                    cls += isCorrect
                      ? 'border-primary bg-primary/10 text-primary'
                      : isChosen
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border opacity-40'
                  } else {
                    cls += isChosen
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/20'
                  }
                  return (
                    <label key={oi} className={cls}>
                      <input
                        type="radio"
                        name={`q${qi}`}
                        className="hidden"
                        disabled={submitted}
                        onChange={() =>
                          setAnswers((prev) => {
                            const n = [...prev]
                            n[qi] = oi
                            return n
                          })
                        }
                      />
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      {submitted && isChosen && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="flex gap-3 pt-2">
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={answers.some((a) => a === null) || !user || submitMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {!user ? 'Sign in to submit' : answers.some((a) => a === null) ? 'Answer all questions' : 'Submit quiz'}
            </Button>
          ) : (
            <>
              {!result?.passed && (
                <Button onClick={retry} variant="outline">
                  Retry quiz
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function TrackLessonPage() {
  const { trackSlug, lessonId } = Route.useParams()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: '/auth' })
  }, [authLoading, user, navigate])

  useEffect(() => {
    setContentVisible(false)
    const t = setTimeout(() => setContentVisible(true), 80)
    return () => clearTimeout(t)
  }, [lessonId])

  const { data: track, isLoading } = useQuery({
    queryKey: ['track-data', trackSlug],
    queryFn: () => getTrackData({ data: { trackSlug } }),
  })

  const markDone = useMutation({
    mutationFn: () => markLessonComplete({ data: { lessonId } }),
    onSuccess: () => {
      toast.success('Lesson complete!')
      qc.invalidateQueries({ queryKey: ['track-data'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  if (isLoading || !track) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20 space-y-4">
          <div className="h-8 w-1/3 bg-muted/40 animate-pulse rounded-lg" />
          <div className="h-96 bg-muted/40 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  const { category, courses, quizResults } = track as any
  const Icon = iconMap[category.icon ?? 'Sparkles'] ?? Sparkles

  // Flatten all lessons in order across courses
  const allLessons: any[] = (courses as any[]).flatMap((c: any) => c.lessons ?? [])
  const current = allLessons.find((l) => l.id === lessonId)
  const idx = allLessons.findIndex((l) => l.id === lessonId)
  const prev = idx > 0 ? allLessons[idx - 1] : null
  const next = idx < allLessons.length - 1 ? allLessons[idx + 1] : null

  const completedSet = new Set<string>(track.completedIds as string[])
  const isDone = completedSet.has(lessonId)
  const priorQuizResult = quizResults[lessonId] ?? null

  if (!current) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20 text-center">
          <p className="text-muted-foreground">Lesson not found.</p>
          <Link to="/tracks/$trackSlug" params={{ trackSlug }}>
            <Button variant="outline" className="mt-4">Back to track</Button>
          </Link>
        </div>
      </PageShell>
    )
  }

  // Find which course this lesson belongs to
  const parentCourse = (courses as any[]).find((c: any) =>
    (c.lessons ?? []).some((l: any) => l.id === lessonId),
  )

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link to="/tracks" className="hover:text-primary transition-colors">Tracks</Link>
            <span>/</span>
            <Link to="/tracks/$trackSlug" params={{ trackSlug }} className="hover:text-primary transition-colors flex items-center gap-1">
              <Icon className="h-3.5 w-3.5" />
              {category.name}
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{current.title}</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-4">{current.title}</h1>
          {current.description && (
            <p className="mt-2 text-muted-foreground">{current.description}</p>
          )}

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            {parentCourse && (
              <Badge variant="outline" className="border-border text-xs">{parentCourse.title}</Badge>
            )}
            {current.duration_minutes > 0 && (
              <span className="text-xs text-muted-foreground">{current.duration_minutes} min read</span>
            )}
            {isDone && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>

          {/* Lesson content */}
          {current.content && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 space-y-0">
                {current.content}
              </div>
            </div>
          )}

          {/* Inline quiz */}
          {current.quiz && (
            <InlineQuiz
              lesson={current}
              priorResult={priorQuizResult}
              onPass={() => {
                if (!isDone) markDone.mutate()
              }}
            />
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap pb-4">
            <div className="flex gap-2">
              {prev && (
                <Link to="/tracks/$trackSlug/$lessonId" params={{ trackSlug, lessonId: prev.id }}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                  </Button>
                </Link>
              )}
              {next && (
                <Link to="/tracks/$trackSlug/$lessonId" params={{ trackSlug, lessonId: next.id }}>
                  <Button variant="outline" size="sm">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
            <Button
              onClick={() => markDone.mutate()}
              disabled={markDone.isPending || isDone}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isDone ? 'Completed' : markDone.isPending ? 'Saving…' : 'Mark complete'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-1 rounded-2xl border border-border bg-card p-4 max-h-[80vh] overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 pb-3 flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {category.name}
          </div>

          {(courses as any[]).map((course: any) => (
            <div key={course.id} className="mb-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {course.title}
              </div>
              {(course.lessons as any[]).map((l: any, li: number) => {
                const done = completedSet.has(l.id)
                const active = l.id === lessonId
                return (
                  <Link
                    key={l.id}
                    to="/tracks/$trackSlug/$lessonId"
                    params={{ trackSlug, lessonId: l.id }}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                      active ? 'bg-primary/15 text-primary border border-primary/20' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[9px] font-bold ${
                        done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3 w-3" /> : li + 1}
                    </div>
                    <span className="flex-1 truncate leading-tight">{l.title}</span>
                    {quizResults[l.id]?.passed && (
                      <Award className="h-3 w-3 text-primary shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {track.exam && (
            <div className="mt-2 pt-2 border-t border-border">
              <Link
                to="/exam/$trackSlug"
                params={{ trackSlug }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted transition-colors text-primary"
              >
                <Award className="h-5 w-5 shrink-0" />
                <span className="flex-1 truncate font-medium">Final Exam</span>
              </Link>
            </div>
          )}
        </aside>
      </div>
    </PageShell>
  )
}
