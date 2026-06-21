import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  getModuleDetail, getTokenBalance, submitQuiz, submitExam,
} from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play, FileText, Link2, ExternalLink, BookOpen, ArrowRight,
  CheckCircle2, XCircle, Award, Lock, ChevronDown, ChevronUp,
  Sparkles, Layout, Server, Brain, Cloud, Palette,
  Coins, ShieldCheck, Smartphone,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { initiateMpesaPayment, checkMpesaPaymentStatus } from '@/server-functions/intasend'

export const Route = createFileRoute('/library/$moduleSlug')({ component: ModulePage })

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
}

type QuizQuestion = { q: string; options: string[]; answer: number }

// ── Token Paywall ─────────────────────────────────────────────────────────────
function TokenPaywall({ category, Icon, onUnlocked }: {
  category: any
  Icon: React.ComponentType<{ className?: string }>
  onUnlocked: () => void
}) {
  const [step, setStep] = useState<'info' | 'pay' | 'waiting' | 'failed'>('info')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  const initiate = useMutation({
    mutationFn: () => initiateMpesaPayment({ data: { phoneNumber, categoryId: category.id } }),
    onSuccess: (res) => {
      setInvoiceId(res.invoiceId)
      setStep('waiting')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to start M-Pesa payment'),
  })

  const { data: statusData } = useQuery({
    queryKey: ['mpesa-status', invoiceId],
    queryFn: () => checkMpesaPaymentStatus({ data: { invoiceId: invoiceId! } }),
    enabled: !!invoiceId && step === 'waiting',
    refetchInterval: (q) => (q.state.data?.status === 'pending' || !q.state.data ? 3000 : false),
  })

  useEffect(() => {
    if (statusData?.status === 'complete') {
      toast.success('Payment confirmed! Welcome to the module.')
      onUnlocked()
    } else if (statusData?.status === 'failed') {
      setStep('failed')
    }
  }, [statusData?.status])

  return (
    <PageShell>
      <div className="min-h-[80vh] flex items-center justify-center px-5 py-12">
        <div className="max-w-md w-full space-y-4">
          <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-4 card-glass">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider font-medium">Module</p>
              <h2 className="font-display text-xl font-bold">{category.name}</h2>
            </div>
          </div>

          <div className="rounded-3xl border border-primary/30 bg-card p-8 text-center card-glass glow-ring">
            {step === 'info' && (
              <>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-5">
                  <Coins className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold">Unlock this module</h3>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
                  One-time payment of <span className="text-primary text-lg font-bold">KES 50</span> gives you full access to all videos, notes, tutorials, tests, and the final exam for <strong>{category.name}</strong>.
                </p>
                <ul className="mt-5 text-sm text-left space-y-2 text-muted-foreground">
                  {['All videos & written notes', 'Practice tests per lesson', 'Final exam + certificate', 'Lifetime access'].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={() => setStep('pay')} className="mt-7 w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-base">
                  Pay KES 50 to unlock
                </Button>
              </>
            )}

            {step === 'pay' && (
              <>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-green-500/15 text-green-400 mb-5">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Pay via M-Pesa</h3>
                <p className="mt-3 text-sm text-muted-foreground">Enter your Safaricom number — we'll send a payment prompt straight to your phone.</p>
                <input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0712345678"
                  inputMode="tel"
                  className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-center font-mono text-lg outline-none focus:border-primary transition"
                />
                <div className="mt-5 flex gap-3">
                  <Button variant="outline" onClick={() => setStep('info')} className="flex-1">Back</Button>
                  <Button
                    onClick={() => initiate.mutate()}
                    disabled={initiate.isPending || phoneNumber.trim().length < 9}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {initiate.isPending ? 'Sending…' : 'Send payment prompt'}
                  </Button>
                </div>
              </>
            )}

            {step === 'waiting' && (
              <>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-5 animate-pulse">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Check your phone</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  Enter your M-Pesa PIN on the prompt sent to <span className="font-mono">{phoneNumber}</span> to complete the KES 50 payment.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">Waiting for confirmation… this updates automatically.</p>
                <Button variant="outline" onClick={() => setStep('pay')} className="mt-5 w-full">Use a different number</Button>
              </>
            )}

            {step === 'failed' && (
              <>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive mb-5">
                  <XCircle className="h-8 w-8" />
                </div>
                <h3 className="font-display text-xl font-bold">Payment didn't go through</h3>
                <p className="mt-3 text-sm text-muted-foreground">The M-Pesa prompt was cancelled or timed out. You haven't been charged.</p>
                <Button onClick={() => setStep('pay')} className="mt-5 w-full bg-primary text-primary-foreground hover:bg-primary/90">Try again</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  )
}

// ── Certificate banner ─────────────────────────────────────────────────────
function CertificateBanner({ score, issuedAt, examTitle }: { score: number; issuedAt: string; examTitle: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-card to-accent/5 p-10 text-center glow-ring">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative">
        <Award className="mx-auto h-16 w-16 text-primary mb-4" />
        <p className="text-sm text-primary uppercase tracking-wider font-medium">Certificate of Completion</p>
        <h3 className="font-display text-3xl font-bold mt-2">{examTitle}</h3>
        <p className="mt-3 text-muted-foreground">
          Passed with <span className="text-primary font-semibold">{score}%</span> on{' '}
          {new Date(issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <Badge className="mt-4 bg-primary text-primary-foreground text-sm px-4 py-1">Certified</Badge>
      </div>
    </div>
  )
}

// ── Quiz (per-lesson) ─────────────────────────────────────────────────────
function LessonQuiz({
  lesson,
  userId,
  priorResult,
}: {
  lesson: any
  userId: string | undefined
  priorResult: { score: number; passed: boolean } | null
}) {
  const qc = useQueryClient()
  const questions: QuizQuestion[] = lesson.quiz?.questions ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(priorResult ?? null)
  const [open, setOpen] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (d: { score: number; passed: boolean }) =>
      submitQuiz({ data: { lessonId: lesson.id, score: d.score, passed: d.passed } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-detail'] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to save result'),
  })

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= 70
    setResult({ score, passed })
    setSubmitted(true)
    saveMutation.mutate({ score, passed })
    if (passed) toast.success(`Quiz passed! ${score}%`)
    else toast.error(`${score}% — need 70% to pass. Try again!`)
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{lesson.title}</div>
            <div className="text-xs text-muted-foreground">{questions.length} question{questions.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result?.passed && <Badge className="bg-primary/15 text-primary border-0 text-xs">Passed {result.score}%</Badge>}
          {result && !result.passed && <Badge variant="destructive" className="text-xs">Failed {result.score}%</Badge>}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-5 space-y-6">
          {questions.map((q, qi) => {
            const chosen = answers[qi]
            return (
              <div key={qi}>
                <p className="text-sm font-medium mb-3"><span className="text-primary mr-2">{qi + 1}.</span>{q.q}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isChosen = chosen === oi
                    const isCorrect = oi === q.answer
                    let cls = 'flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition '
                    if (submitted) {
                      cls += isCorrect ? 'border-primary bg-primary/10 text-primary' : isChosen ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border opacity-50'
                    } else {
                      cls += isChosen ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }
                    return (
                      <label key={oi} className={cls}>
                        <input type="radio" name={`lq-${lesson.id}-${qi}`} className="hidden" disabled={submitted} onChange={() => setAnswers((prev) => { const n = [...prev]; n[qi] = oi; return n })} />
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-xs">{String.fromCharCode(65 + oi)}</span>
                        {opt}
                        {submitted && isCorrect && <CheckCircle2 className="ml-auto h-4 w-4" />}
                        {submitted && isChosen && !isCorrect && <XCircle className="ml-auto h-4 w-4" />}
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}

          <div className="flex gap-3">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={answers.some((a) => a === null) || !userId || saveMutation.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {!userId ? 'Sign in to submit' : answers.some((a) => a === null) ? 'Answer all questions' : 'Submit quiz'}
              </Button>
            ) : (
              !result?.passed && (
                <Button variant="outline" onClick={() => { setAnswers(Array(questions.length).fill(null)); setSubmitted(false); setResult(null) }}>
                  Retry quiz
                </Button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Final exam ────────────────────────────────────────────────────────────
function FinalExam({ exam, categoryId, onCertified }: { exam: any; categoryId: string; onCertified: (score: number) => void }) {
  const qc = useQueryClient()
  const questions: QuizQuestion[] = exam.questions ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const saveMutation = useMutation({
    mutationFn: (score: number) => submitExam({ data: { categoryId, score } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['module-detail'] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to save result'),
  })

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const score = Math.round((correct / questions.length) * 100)
    const passed = score >= (exam.pass_score ?? 70)
    setResult({ score, passed })
    saveMutation.mutate(score)
    if (passed) onCertified(score)
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 p-5 rounded-2xl border border-primary/30 bg-primary/5">
        <div className="flex items-center gap-3 mb-2">
          <Award className="h-6 w-6 text-primary" />
          <h3 className="font-display text-lg font-bold">{exam.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          {questions.length} questions · Pass score: {exam.pass_score ?? 70}%
        </p>
      </div>

      {result ? (
        <div className={`rounded-2xl border p-8 text-center ${result.passed ? 'border-primary bg-primary/10' : 'border-destructive bg-destructive/10'}`}>
          {result.passed ? <CheckCircle2 className="mx-auto h-14 w-14 text-primary mb-4" /> : <XCircle className="mx-auto h-14 w-14 text-destructive mb-4" />}
          <p className="font-display text-3xl font-bold">{result.score}%</p>
          <p className="mt-2 text-muted-foreground">{result.passed ? 'You passed! Certificate issued.' : 'Not quite. Study and try again.'}</p>
          {!result.passed && (
            <Button variant="outline" className="mt-4" onClick={() => { setAnswers(Array(questions.length).fill(null)); setResult(null) }}>Retry exam</Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-medium mb-4"><span className="text-primary mr-2">Q{qi + 1}.</span>{q.q}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className={`flex items-center gap-3 rounded-lg border p-3 text-sm cursor-pointer transition ${answers[qi] === oi ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                    <input type="radio" name={`eq${qi}`} className="hidden" onChange={() => setAnswers((p) => { const n = [...p]; n[qi] = oi; return n })} />
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-xs">{String.fromCharCode(65 + oi)}</span>
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button
            onClick={handleSubmit}
            disabled={answers.some((a) => a === null) || saveMutation.isPending}
            size="lg"
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
          >
            <Award className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving…' : answers.some((a) => a === null) ? 'Answer all questions first' : 'Submit final exam'}
          </Button>
        </div>
      )}
    </div>
  )
}

function Empty({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="text-center py-20">
      <Icon className="mx-auto h-12 w-12 text-muted-foreground/40" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
function ModulePage() {
  const { moduleSlug } = Route.useParams()
  const { user } = useAuth()
  const [justCertified, setJustCertified] = useState(false)
  const [justScore, setJustScore] = useState(0)
  const [certTime] = useState(new Date().toISOString())

  const qc = useQueryClient()

  const { data: mod, isLoading } = useQuery({
    queryKey: ['module-detail', moduleSlug],
    queryFn: async () => {
      const m = await getModuleDetail({ data: { slug: moduleSlug } })
      if (!m) throw notFound()
      return m
    },
  })

  const { data: tokenBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['token-balance', user?.id],
    enabled: !!user,
    queryFn: () => getTokenBalance(),
  })

  const handleUnlocked = () => {
    refetchBalance()
    qc.invalidateQueries({ queryKey: ['token-balance'] })
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-40 bg-muted/40 animate-pulse rounded-2xl mb-6" />
          <div className="h-96 bg-muted/40 animate-pulse rounded-2xl" />
        </div>
      </PageShell>
    )
  }

  if (!mod) return null

  const { category, videoLessons, noteLessons, resources, quizLessons, exam, quizResults, certification } = mod as any
  const Icon = iconMap[category.icon ?? 'Sparkles'] ?? Sparkles
  const hasCert = justCertified || !!certification
  const certScore = justCertified ? justScore : (certification?.score ?? 0)
  const certIssuedAt = justCertified ? certTime : (certification?.issued_at ?? certTime)

  if (!user) {
    return (
      <PageShell>
        <div className="min-h-[70vh] flex items-center justify-center px-5">
          <div className="max-w-md w-full rounded-3xl border border-border bg-card p-10 text-center card-glass">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary mb-6">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold">Sign in to access this module</h2>
            <p className="mt-3 text-muted-foreground">
              Create a free account, then purchase access for <span className="text-primary font-semibold">KES 50</span> to unlock <strong>{category.name}</strong>.
            </p>
            <div className="mt-7 flex flex-col gap-3">
              <Link to="/auth"><Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11">Create free account</Button></Link>
              <Link to="/auth"><Button variant="outline" className="w-full h-11">Sign in</Button></Link>
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (tokenBalance !== undefined && tokenBalance < 1) {
    return <TokenPaywall category={category} Icon={Icon} onUnlocked={handleUnlocked} />
  }

  const tabs = [
    { id: 'videos', label: 'Videos', icon: Play, count: (videoLessons ?? []).length },
    { id: 'notes', label: 'Notes', icon: FileText, count: (noteLessons ?? []).length },
    { id: 'tutorials', label: 'Tutorials', icon: Link2, count: (resources ?? []).length },
    { id: 'tests', label: 'Tests', icon: BookOpen, count: (quizLessons ?? []).length },
    { id: 'exam', label: 'Final Exam', icon: Award, count: exam ? 1 : 0 },
  ]

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10">
          <Link to="/library" className="text-sm text-muted-foreground hover:text-primary">← All modules</Link>
          <div className="mt-5 flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary border border-primary/30">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider">Module</p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">{category.name}</h1>
            </div>
          </div>
          {category.description && <p className="mt-4 text-muted-foreground max-w-2xl">{category.description}</p>}

          {hasCert && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Award className="h-4 w-4" />
              {justCertified ? 'You just earned a certificate for this module!' : `Certified — ${certScore}%`}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {(videoLessons ?? []).length > 0 && <span className="flex items-center gap-1.5"><Play className="h-4 w-4 text-primary" /> {(videoLessons ?? []).length} videos</span>}
            {(noteLessons ?? []).length > 0 && <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> {(noteLessons ?? []).length} notes</span>}
            {exam && <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> Final exam + certificate</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Tabs defaultValue="videos">
          <TabsList className="mb-8 bg-muted/40 border border-border flex-wrap h-auto gap-1">
            {tabs.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.count > 0 && <Badge variant="secondary" className="ml-1 text-xs">{t.count}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="videos">
            {(videoLessons ?? []).length === 0 ? <Empty icon={Play} message="No video lessons in this module yet." /> : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {(videoLessons ?? []).map((l: any) => (
                  <Link key={l.id} to="/learn/$courseSlug/$lessonId" params={{ courseSlug: l.courses.slug, lessonId: l.id }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition card-glass">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-transparent grid place-items-center relative">
                      <Play className="h-10 w-10 text-primary/50 group-hover:text-primary transition" />
                      {l.duration_minutes && <span className="absolute bottom-2 right-3 text-xs bg-background/70 rounded px-1.5 py-0.5 text-muted-foreground">{l.duration_minutes} min</span>}
                    </div>
                    <div className="p-5">
                      <div className="text-xs text-primary uppercase tracking-wider">{l.courses?.title}</div>
                      <h3 className="mt-1 font-display text-base font-semibold group-hover:text-primary transition">{l.title}</h3>
                      {l.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes">
            {(noteLessons ?? []).length === 0 ? <Empty icon={FileText} message="No written notes in this module yet." /> : (
              <div className="grid gap-4 md:grid-cols-2">
                {(noteLessons ?? []).map((l: any) => (
                  <Link key={l.id} to="/learn/$courseSlug/$lessonId" params={{ courseSlug: l.courses.slug, lessonId: l.id }} className="group flex gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition card-glass">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary uppercase tracking-wider">{l.courses?.title}</div>
                      <h3 className="mt-0.5 font-display font-semibold group-hover:text-primary transition truncate">{l.title}</h3>
                      {l.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.description}</p>}
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                        Read notes <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tutorials">
            {(resources ?? []).length === 0 ? <Empty icon={Link2} message="No external tutorials for this module yet." /> : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(resources ?? []).map((r: any) => (
                  <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition card-glass">
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                        {r.type === 'video' ? <Play className="h-4 w-4" /> : r.type === 'article' ? <BookOpen className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition mt-1 shrink-0" />
                    </div>
                    <div>
                      <Badge variant="outline" className="text-xs border-border capitalize mb-2">{r.type || 'resource'}</Badge>
                      <h3 className="font-display font-semibold group-hover:text-primary transition line-clamp-2">{r.title}</h3>
                      {r.description && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{r.description}</p>}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tests">
            {(quizLessons ?? []).length === 0 ? <Empty icon={BookOpen} message="No lesson tests in this module yet." /> : (
              <div className="max-w-2xl space-y-3">
                <p className="text-sm text-muted-foreground mb-6">Each test checks your understanding of that lesson. Pass at 70% or above.</p>
                {(quizLessons ?? []).map((l: any) => (
                  <LessonQuiz
                    key={l.id}
                    lesson={l}
                    userId={user?.id}
                    priorResult={(quizResults ?? {})[l.id] ?? null}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="exam">
            {!exam ? (
              <div className="text-center py-20 max-w-md mx-auto">
                <Award className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 font-display text-lg font-semibold">No exam yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">The final exam for this module hasn't been published yet.</p>
              </div>
            ) : hasCert ? (
              <CertificateBanner score={certScore} issuedAt={certIssuedAt} examTitle={exam.title} />
            ) : (
              <FinalExam
                exam={exam}
                categoryId={category.id as string}
                onCertified={(score) => { setJustCertified(true); setJustScore(score); toast.success(`Certificate earned! Score: ${score}%`) }}
              />
            )}
          </TabsContent>
        </Tabs>
      </section>
    </PageShell>
  )
}
