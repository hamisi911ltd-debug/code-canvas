import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getTrackData, submitExam } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Award, CheckCircle2, XCircle, ChevronLeft, ChevronRight,
  Sparkles, Layout, Server, Brain, Cloud, Palette, BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/exam/$trackSlug')({ component: ExamPage })

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
    const colors = ['#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#fb923c', '#e879f9']
    const particles = Array.from({ length: 220 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 120,
      r: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: 2 + Math.random() * 5,
      ta: Math.random() * Math.PI * 2,
      ts: 0.04 + Math.random() * 0.07,
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

// ── Certificate ───────────────────────────────────────────────────────────────
function Certificate({
  trackName,
  score,
  passScore,
  issuedAt,
  onRetake,
}: {
  trackName: string
  score: number
  passScore: number
  issuedAt: string
  onRetake: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  return (
    <div
      className="max-w-2xl mx-auto text-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-accent/5 p-10 sm:p-14 glow-ring">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="relative space-y-5">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30">
            <Award className="h-10 w-10" />
          </div>
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-semibold">Certificate of Completion</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">{trackName}</h2>
          </div>
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Score: <strong className="text-primary text-lg">{score}%</strong>
            </span>
            <span>Pass mark: {passScore}%</span>
            <span>
              Issued:{' '}
              {new Date(issuedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
          </div>
          <Badge className="bg-primary text-primary-foreground px-5 py-1.5 text-sm">Certified</Badge>
          <div className="pt-2 flex justify-center gap-3 flex-wrap">
            <Button variant="outline" onClick={onRetake} size="sm">Retake exam</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Exam ──────────────────────────────────────────────────────────────────────
type QuizQ = { q: string; options: string[]; answer: number }

function Exam({
  questions,
  passScore,
  categoryId,
  onDone,
}: {
  questions: QuizQ[]
  passScore: number
  categoryId: string
  onDone: (score: number, passed: boolean) => void
}) {
  const qc = useQueryClient()
  const runConfetti = useConfetti()
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [currentQ, setCurrentQ] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const submitMutation = useMutation({
    mutationFn: (d: { score: number }) => submitExam({ data: { categoryId, score: d.score } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['track-data'] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Submission failed'),
  })

  const answered = answers.filter((a) => a !== null).length
  const progressPct = Math.round((answered / questions.length) * 100)

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= passScore
    setResult({ score, passed })
    setSubmitted(true)
    submitMutation.mutate({ score })
    if (passed) {
      toast.success(`Congratulations! You scored ${score}%`)
      setTimeout(() => runConfetti(), 300)
    } else {
      toast.error(`${score}% — you need ${passScore}% to pass. Review and try again.`)
    }
    onDone(score, passed)
  }

  const q = questions[currentQ]
  const allAnswered = answers.every((a) => a !== null)

  if (submitted && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className={`rounded-2xl border p-10 text-center ${result.passed ? 'border-primary bg-primary/10' : 'border-destructive/40 bg-destructive/5'}`}>
          {result.passed ? (
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary mb-4" />
          ) : (
            <XCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          )}
          <p className="font-display text-5xl font-bold">{result.score}%</p>
          <p className="mt-3 text-muted-foreground text-lg">
            {result.passed
              ? 'You passed! Your certificate is being generated.'
              : `You need ${passScore}% to pass. Study the lessons and try again.`}
          </p>
          {!result.passed && (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setAnswers(Array(questions.length).fill(null))
                setResult(null)
                setSubmitted(false)
                setCurrentQ(0)
              }}
            >
              Retry exam
            </Button>
          )}
        </div>

        {/* Question review */}
        <div className="mt-8 space-y-4">
          <h3 className="font-display text-lg font-bold">Review answers</h3>
          {questions.map((question, qi) => {
            const chosen = answers[qi]
            const isCorrect = chosen === question.answer
            return (
              <div key={qi} className={`rounded-xl border p-4 ${isCorrect ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <p className="text-sm font-medium mb-3">
                  <span className="text-muted-foreground mr-2">Q{qi + 1}.</span>{question.q}
                </p>
                <div className="flex items-start gap-2 text-sm">
                  {isCorrect ? (
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  )}
                  <span>
                    Your answer: <strong>{chosen !== null ? question.options[chosen] : 'Not answered'}</strong>
                    {!isCorrect && (
                      <span className="text-primary"> · Correct: <strong>{question.options[question.answer]}</strong></span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{answered} answered</span>
        </div>
        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {/* Question dots */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`h-6 w-6 rounded text-xs font-bold transition-all ${
                i === currentQ
                  ? 'bg-primary text-primary-foreground'
                  : answers[i] !== null
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Current question */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="font-display text-lg font-semibold mb-6">
          <span className="text-primary mr-2">Q{currentQ + 1}.</span>{q.q}
        </p>
        <div className="space-y-3">
          {q.options.map((opt, oi) => {
            const isChosen = answers[currentQ] === oi
            return (
              <label
                key={oi}
                className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer select-none transition-all ${
                  isChosen
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted/20'
                }`}
              >
                <input
                  type="radio"
                  name={`exam-q${currentQ}`}
                  className="hidden"
                  onChange={() =>
                    setAnswers((prev) => {
                      const n = [...prev]
                      n[currentQ] = oi
                      return n
                    })
                  }
                />
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-all ${
                    isChosen ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                <span className="flex-1">{opt}</span>
              </label>
            )
          })}
        </div>

        {/* Q navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentQ === 0}
            onClick={() => setCurrentQ((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          {currentQ < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentQ((p) => p + 1)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!allAnswered || submitMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
            >
              <Award className="h-4 w-4 mr-1.5" />
              {!allAnswered ? `${questions.length - answered} unanswered` : 'Submit exam'}
            </Button>
          )}
        </div>
      </div>

      {/* Submit from any point when all answered */}
      {allAnswered && currentQ < questions.length - 1 && (
        <div className="mt-4 text-center">
          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
          >
            <Award className="h-4 w-4 mr-1.5" />
            All answered — Submit exam
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ExamPage() {
  const { trackSlug } = Route.useParams()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [examDone, setExamDone] = useState(false)
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [visible, setVisible] = useState(false)
  const [issuedAt] = useState(new Date().toISOString())

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: '/auth' })
  }, [authLoading, user, navigate])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const { data: track, isLoading } = useQuery({
    queryKey: ['track-data', trackSlug],
    queryFn: () => getTrackData({ data: { trackSlug } }),
  })

  if (isLoading || !track) {
    return (
      <PageShell>
        <div className="mx-auto max-w-5xl px-4 py-20 space-y-4">
          <div className="h-40 bg-muted/40 animate-pulse rounded-2xl" />
          <div className="h-96 bg-muted/40 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  const { category, exam, certification } = track as any
  const Icon = iconMap[category.icon ?? 'Sparkles'] ?? Sparkles
  const passScore: number = exam?.pass_score ?? 70
  const questions: QuizQ[] = exam?.questions ?? []

  // Show existing certificate if not retaking
  const showCert = (certification && !examDone) || (examDone && examResult?.passed)
  const certScore = examDone ? examResult?.score ?? 0 : (certification as any)?.score ?? 0

  return (
    <PageShell>
      {/* Header */}
      <section className="relative bg-glow overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-14 pb-10">
          <Link to="/tracks/$trackSlug" params={{ trackSlug }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Back to track
          </Link>

          <div
            className="mt-5"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 border border-primary/30 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-primary uppercase tracking-wider font-medium">Final Exam</p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">{category.name}</h1>
              </div>
            </div>

            {exam && !showCert && (
              <div className="mt-5 flex flex-wrap gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  {questions.length} questions
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Pass at {passScore}%
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Earn a certificate
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        {!exam ? (
          <div className="text-center py-20">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-xl font-bold">No exam published yet</h3>
            <p className="mt-2 text-muted-foreground">The final exam for this track has not been published yet.</p>
            <Link to="/tracks/$trackSlug" params={{ trackSlug }}>
              <Button variant="outline" className="mt-6">Back to track</Button>
            </Link>
          </div>
        ) : showCert ? (
          <Certificate
            trackName={`${category.name} Track`}
            score={certScore}
            passScore={passScore}
            issuedAt={issuedAt}
            onRetake={() => {
              setExamDone(false)
              setExamResult(null)
            }}
          />
        ) : (
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s ease 100ms, transform 0.5s ease 100ms',
            }}
          >
            <Exam
              questions={questions}
              passScore={passScore}
              categoryId={category.id as string}
              onDone={(score, passed) => {
                setExamResult({ score, passed })
                setExamDone(true)
              }}
            />
          </div>
        )}
      </section>
    </PageShell>
  )
}

