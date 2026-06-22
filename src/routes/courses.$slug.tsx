import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getCourse, getEnrollment, getLessonProgress, enroll, getTokenBalance, getCourseExtras } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BuyTokens } from '@/components/BuyTokens'
import { CertificateBanner, FinalExam, LessonQuiz } from '@/components/ModuleExtras'
import { CheckCircle2, Play, Clock, BookOpen, Lock, ArrowRight, FileText, Link2, ExternalLink, Award } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/courses/$slug')({ component: CourseDetail })

// Same illustrated photos used across the courses grid and tracks pages, keyed by category slug.
const CATEGORY_PHOTOS: Record<string, string> = {
  vibecoding: '/photo.png',
  frontend: '/photo..png',
  'ai-ml': '/photo...png',
  backend: '/photo....png',
  devops: '/photo5.svg',
  design: '/photo6.svg',
}

function CourseDetail() {
  const { slug } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showBuy, setShowBuy] = useState(false)
  const [justCertified, setJustCertified] = useState(false)
  const [justScore, setJustScore] = useState(0)
  const [certTime] = useState(new Date().toISOString())

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: async () => {
      const c = await getCourse({ data: { slug } })
      if (!c) throw notFound()
      return c
    },
  })

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: () => getEnrollment({ data: { courseId: course!.id as string } }),
  })

  const { data: completedIds } = useQuery({
    queryKey: ['progress', course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const ids = ((course?.lessons ?? []) as any[]).map((l) => l.id)
      if (!ids.length) return new Set<string>()
      const done = await getLessonProgress({ data: { lessonIds: ids } })
      return new Set(done)
    },
  })

  const { data: tokenBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['token-balance', user?.id],
    enabled: !!user,
    queryFn: () => getTokenBalance(),
  })

  const { data: extras } = useQuery({
    queryKey: ['course-extras', course?.id],
    enabled: !!course?.id,
    queryFn: () => getCourseExtras({ data: { courseId: course!.id as string, categoryId: (course as any).category_id ?? null } }),
  })

  const enrollMut = useMutation({
    mutationFn: () => enroll({ data: { courseId: course!.id as string } }),
    onSuccess: () => {
      toast.success("Enrolled! Let's go.")
      setShowBuy(false)
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['token-balance'] })
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('authenticated')) navigate({ to: '/auth' })
      else toast.error(msg)
    },
  })

  if (isLoading) return <PageShell><div className="mx-auto max-w-5xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>
  if (!course) return null

  const lessons = ((course.lessons ?? []) as any[]).sort((a, b) => a.position - b.position)
  const done = completedIds ?? new Set<string>()
  const pct = lessons.length ? Math.round((done.size / lessons.length) * 100) : 0
  const cost = (course as any).token_cost ?? 0
  const balance = tokenBalance ?? 0
  const tokensNeeded = Math.max(0, cost - balance)
  const categoryId = (course as any).category_id as string | null
  const quizLessons = lessons.filter((l) => l.quiz)
  const hasCert = justCertified || !!extras?.certification
  const certScore = justCertified ? justScore : ((extras?.certification as any)?.score ?? 0)
  const certIssuedAt = justCertified ? certTime : ((extras?.certification as any)?.issued_at ?? certTime)

  const heroPhoto = (course as any).thumbnail_url || CATEGORY_PHOTOS[(course as any).categories?.slug] || '/photo.png'

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroPhoto} alt="" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />
          <div className="absolute inset-0 grid-pattern opacity-20" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-6 sm:pt-10 pb-8">
          <Link to="/courses" className="text-sm text-muted-foreground hover:text-primary">← All courses</Link>
          <div className="mt-4 flex items-center gap-2">
            {(course as any).categories && (
              <Badge variant="outline" className="border-primary/50 text-primary">{(course as any).categories.name}</Badge>
            )}
            <Badge className="bg-muted text-foreground capitalize">{(course as any).level}</Badge>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4">{(course as any).title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{(course as any).description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-primary" /> {lessons.length} lessons</span>
            {(course as any).duration_minutes ? <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {(course as any).duration_minutes} min</span> : null}
          </div>
          {user && enrollment && (
            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Your progress</span><span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
          <div className="mt-7">
            {!user ? (
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">Sign up to enroll</Button>
              </Link>
            ) : enrollment ? (
              lessons[0] && (
                <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug: (course as any).slug, lessonId: lessons[0].id }}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                    {done.size > 0 ? 'Continue learning' : 'Start course'} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )
            ) : showBuy ? (
              <div className="max-w-sm">
                <BuyTokens
                  tokens={tokensNeeded}
                  onPurchased={() => { refetchBalance(); enrollMut.mutate() }}
                />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => (tokensNeeded > 0 ? setShowBuy(true) : enrollMut.mutate())}
                disabled={enrollMut.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring"
              >
                {cost > 0
                  ? tokensNeeded > 0
                    ? `Buy ${tokensNeeded} token${tokensNeeded === 1 ? '' : 's'} & enroll`
                    : `Enroll for ${cost} token${cost === 1 ? '' : 's'}`
                  : 'Enroll for free'}
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <Tabs defaultValue="content">
          <TabsList className="mb-6 bg-muted/40 border border-border flex-wrap h-auto gap-1">
            <TabsTrigger value="content" className="gap-1.5"><BookOpen className="h-4 w-4" />Content</TabsTrigger>
            {quizLessons.length > 0 && (
              <TabsTrigger value="tests" className="gap-1.5">
                <CheckCircle2 className="h-4 w-4" />Tests
                <Badge variant="secondary" className="ml-1 text-xs">{quizLessons.length}</Badge>
              </TabsTrigger>
            )}
            {(extras?.resources?.length ?? 0) > 0 && (
              <TabsTrigger value="resources" className="gap-1.5">
                <Link2 className="h-4 w-4" />Resources
                <Badge variant="secondary" className="ml-1 text-xs">{extras!.resources.length}</Badge>
              </TabsTrigger>
            )}
            {extras?.exam && (
              <TabsTrigger value="exam" className="gap-1.5"><Award className="h-4 w-4" />Final Exam</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold">Course Content</h2>
              <span className="text-xs text-muted-foreground">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
            </div>
            {lessons.length === 0 ? (
              <p className="text-muted-foreground">Lessons coming soon.</p>
            ) : (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                {lessons.map((l: any, i: number) => {
                  const isDone = done.has(l.id)
                  const accessible = !!enrollment
                  const Inner = (
                    <div className={`group flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4 transition ${accessible ? 'hover:border-primary/50 cursor-pointer' : 'opacity-60'} border-border`}>
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : accessible ? <Play className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground mb-0.5">Lesson {i + 1}</div>
                        <div className="font-medium text-sm">{l.title}</div>
                        {l.description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{l.description}</div>}
                        <div className="flex items-center gap-2 mt-1">
                          {l.video_url && <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"><Play className="h-2.5 w-2.5" />Video</span>}
                          {l.content && <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full"><FileText className="h-2.5 w-2.5" />Notes</span>}
                          {l.duration_minutes ? <span className="text-[10px] text-muted-foreground">{l.duration_minutes}m</span> : null}
                        </div>
                      </div>
                    </div>
                  )
                  return accessible ? (
                    <Link key={l.id} to="/learn/$courseSlug/$lessonId" params={{ courseSlug: (course as any).slug, lessonId: l.id }}>{Inner}</Link>
                  ) : (
                    <div key={l.id}>{Inner}</div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {quizLessons.length > 0 && (
            <TabsContent value="tests">
              <p className="text-sm text-muted-foreground mb-6">Each test checks your understanding of that lesson. Pass at 70% or above.</p>
              <div className="max-w-2xl space-y-3">
                {quizLessons.map((l: any) => (
                  <LessonQuiz
                    key={l.id}
                    lesson={l}
                    userId={user?.id}
                    priorResult={(extras?.quizResults ?? {})[l.id] ?? null}
                    onSaved={() => qc.invalidateQueries({ queryKey: ['course-extras', course.id] })}
                  />
                ))}
              </div>
            </TabsContent>
          )}

          {(extras?.resources?.length ?? 0) > 0 && (
            <TabsContent value="resources">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {extras!.resources.map((r: any) => (
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
            </TabsContent>
          )}

          {extras?.exam && (
            <TabsContent value="exam">
              {!enrollment ? (
                <div className="text-center py-16 max-w-md mx-auto">
                  <Lock className="mx-auto h-12 w-12 text-muted-foreground/40" />
                  <h3 className="mt-4 font-display text-lg font-semibold">Enroll to take the final exam</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Finish the course content, then come back here for your certificate.</p>
                </div>
              ) : hasCert ? (
                <CertificateBanner score={certScore} issuedAt={certIssuedAt} examTitle={extras.exam.title} />
              ) : (
                <FinalExam
                  exam={extras.exam}
                  categoryId={categoryId!}
                  onSaved={() => qc.invalidateQueries({ queryKey: ['course-extras', course.id] })}
                  onCertified={(score) => { setJustCertified(true); setJustScore(score); toast.success(`Certificate earned! Score: ${score}%`) }}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </section>
    </PageShell>
  )
}
