import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getCourse, getModules, getModuleTest, submitModuleTest } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Award, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/learn/$courseSlug/module/$moduleId/test')({ component: ModuleTestView })

type QuizQuestion = { q: string; options: string[]; answer: number }

function ModuleTestView() {
  const { courseSlug, moduleId } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null)

  const { data: course } = useQuery({
    queryKey: ['course-full', courseSlug],
    queryFn: () => getCourse({ data: { slug: courseSlug } }),
  })

  const { data: modules } = useQuery({
    queryKey: ['modules', course?.id, user?.id],
    enabled: !!course?.id,
    queryFn: () => getModules({ data: { courseId: course!.id as string } }),
  })

  const { data: test, isLoading } = useQuery({
    queryKey: ['module-test', moduleId],
    queryFn: () => getModuleTest({ data: { moduleId } }),
  })

  const questions: QuizQuestion[] = (test?.questions as QuizQuestion[]) ?? []

  useEffect(() => {
    if (questions.length && answers.length !== questions.length) {
      setAnswers(Array(questions.length).fill(null))
    }
  }, [questions.length])

  const saveMutation = useMutation({
    mutationFn: (d: { score: number; passed: boolean }) => submitModuleTest({ data: { moduleId, score: d.score, passed: d.passed } }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to save result'),
  })

  const handleSubmit = () => {
    const correct = answers.filter((a, i) => a === questions[i].answer).length
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0
    const passed = score >= (test?.pass_score ?? 70)
    setResult({ score, passed })
    saveMutation.mutate({ score, passed })
    if (passed) toast.success(`Module test passed! ${score}%`)
    else toast.error(`${score}% — need ${test?.pass_score ?? 70}% to pass.`)
  }

  if (isLoading || !course) {
    return <PageShell><div className="mx-auto max-w-3xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>
  }
  if (!test) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-muted-foreground">No test found for this module.</p>
          <Link to="/courses/$slug" params={{ slug: courseSlug }} className="mt-4 inline-block text-primary hover:underline">← Back to course</Link>
        </div>
      </PageShell>
    )
  }

  const moduleList = modules ?? []
  const moduleIdx = moduleList.findIndex((m: any) => m.id === moduleId)
  const nextModule = moduleIdx >= 0 && moduleIdx < moduleList.length - 1 ? moduleList[moduleIdx + 1] : null
  const lessonsOfCourse = ((course.lessons ?? []) as any[]).sort((a, b) => a.position - b.position)
  const nextModuleFirstLesson = nextModule ? lessonsOfCourse.find((l) => l.module_id === nextModule.id) : null

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <Link to="/courses/$slug" params={{ slug: courseSlug }} className="text-sm text-muted-foreground hover:text-primary">← Back to course</Link>

        <div className="mt-4 mb-6 p-5 rounded-2xl border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-6 w-6 text-primary" />
            <h1 className="font-display text-lg font-bold">{test.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions · Pass score: {test.pass_score ?? 70}%
          </p>
        </div>

        {result ? (
          <div className={`rounded-2xl border p-8 text-center ${result.passed ? 'border-primary bg-primary/10' : 'border-destructive bg-destructive/10'}`}>
            {result.passed ? <CheckCircle2 className="mx-auto h-14 w-14 text-primary mb-4" /> : <XCircle className="mx-auto h-14 w-14 text-destructive mb-4" />}
            <p className="font-display text-3xl font-bold">{result.score}%</p>
            <p className="mt-2 text-muted-foreground">{result.passed ? 'You passed this module test.' : 'Not quite. Review the lessons and try again.'}</p>
            {result.passed ? (
              nextModuleFirstLesson ? (
                <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug, lessonId: nextModuleFirstLesson.id }}>
                  <Button className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">
                    Next module <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/courses/$slug" params={{ slug: courseSlug }}>
                  <Button className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90">Back to course</Button>
                </Link>
              )
            ) : (
              <Button variant="outline" className="mt-4" onClick={() => { setAnswers(Array(questions.length).fill(null)); setResult(null) }}>
                Retry test
              </Button>
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
                      <input
                        type="radio"
                        name={`mt-${qi}`}
                        className="hidden"
                        onChange={() => setAnswers((p) => { const n = [...p]; n[qi] = oi; return n })}
                      />
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-xs">{String.fromCharCode(65 + oi)}</span>
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={answers.length !== questions.length || answers.some((a) => a === null) || !user || saveMutation.isPending}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
            >
              <Award className="h-4 w-4 mr-2" />
              {!user ? 'Sign in to submit' : answers.some((a) => a === null) ? 'Answer all questions first' : 'Submit test'}
            </Button>
          </div>
        )}
      </div>
    </PageShell>
  )
}
