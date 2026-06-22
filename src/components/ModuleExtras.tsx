import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { submitQuiz, submitExam } from '@/server-functions/data'
import { Award, BookOpen, CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react'

type QuizQuestion = { q: string; options: string[]; answer: number }

export function CertificateBanner({ score, issuedAt, examTitle }: { score: number; issuedAt: string; examTitle: string }) {
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

export function LessonQuiz({
  lesson,
  userId,
  priorResult,
  onSaved,
}: {
  lesson: any
  userId: string | undefined
  priorResult: { score: number; passed: boolean } | null
  onSaved?: () => void
}) {
  const questions: QuizQuestion[] = lesson.quiz?.questions ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(priorResult ?? null)
  const [open, setOpen] = useState(false)

  const saveMutation = useMutation({
    mutationFn: (d: { score: number; passed: boolean }) =>
      submitQuiz({ data: { lessonId: lesson.id, score: d.score, passed: d.passed } }),
    onSuccess: () => onSaved?.(),
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
      <button onClick={() => setOpen((p) => !p)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-muted/20 transition">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">{lesson.title}</div>
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

export function FinalExam({ exam, categoryId, onCertified, onSaved }: { exam: any; categoryId: string; onCertified: (score: number) => void; onSaved?: () => void }) {
  const questions: QuizQuestion[] = exam.questions ?? []
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const saveMutation = useMutation({
    mutationFn: (score: number) => submitExam({ data: { categoryId, score } }),
    onSuccess: () => onSaved?.(),
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
