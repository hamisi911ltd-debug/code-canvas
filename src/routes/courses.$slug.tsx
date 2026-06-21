import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { getCourse, getEnrollment, getLessonProgress, enroll } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Play, Clock, BookOpen, Lock, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/courses/$slug')({ component: CourseDetail })

function CourseDetail() {
  const { slug } = Route.useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

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

  const enrollMut = useMutation({
    mutationFn: () => enroll({ data: { courseId: course!.id as string } }),
    onSuccess: () => {
      toast.success("Enrolled! Let's go.")
      qc.invalidateQueries({ queryKey: ['enrollment'] })
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

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
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
            ) : (
              <Button size="lg" onClick={() => enrollMut.mutate()} disabled={enrollMut.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                Enroll for free
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
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
                      {l.video_url && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">▶ Video</span>}
                      {l.content && <span className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full">📄 Notes</span>}
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
      </section>
    </PageShell>
  )
}
