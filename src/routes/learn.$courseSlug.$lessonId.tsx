import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getCourse, getLessonProgress, markLessonComplete, getModules, getTokenBalance, unlockModule } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { BuyTokens } from '@/components/BuyTokens'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Check, Lock, Coins } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/learn/$courseSlug/$lessonId')({ component: LessonView })

function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return url
}

function NoteRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const rendered: ReactNode[] = []
  let ulBuffer: string[] = []
  let olBuffer: string[] = []
  let key = 0

  const inlineFormat = (text: string): ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-primary text-xs font-mono">{part.slice(1, -1)}</code>
      if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>
      return part
    })
  }

  const renderListItem = (item: string, i: number) => {
    const checkMatch = item.match(/^\[([ xX])\]\s+(.*)$/)
    if (checkMatch) {
      const checked = checkMatch[1].toLowerCase() === 'x'
      return (
        <li key={i} className="flex items-start gap-2 list-none -ml-5">
          <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/50'}`}>
            {checked && <Check className="h-3 w-3" />}
          </span>
          {inlineFormat(checkMatch[2])}
        </li>
      )
    }
    return <li key={i}>{inlineFormat(item)}</li>
  }

  const flushUl = () => {
    if (ulBuffer.length) {
      const items = [...ulBuffer]
      rendered.push(
        <ul key={`ul-${key++}`} className="list-disc list-inside space-y-1 my-2 text-sm text-foreground/90">
          {items.map(renderListItem)}
        </ul>,
      )
      ulBuffer = []
    }
  }
  const flushOl = () => {
    if (olBuffer.length) {
      const items = [...olBuffer]
      rendered.push(
        <ol key={`ol-${key++}`} className="list-decimal list-inside space-y-1 my-2 text-sm text-foreground/90">
          {items.map((item, i) => <li key={i}>{inlineFormat(item)}</li>)}
        </ol>,
      )
      olBuffer = []
    }
  }
  const flushLists = () => { flushUl(); flushOl() }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      flushLists()
      const lang = fence[1]
      const codeLines: string[] = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        codeLines.push(lines[i])
        i++
      }
      rendered.push(
        <div key={`code-${key++}`} className="my-3 rounded-xl border border-border bg-muted/40 overflow-hidden">
          {lang && <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/60">{lang}</div>}
          <pre className="p-3 overflow-x-auto text-xs leading-relaxed"><code className="font-mono text-foreground/90">{codeLines.join('\n')}</code></pre>
        </div>,
      )
      i++ // skip closing fence
      continue
    }

    if (line.startsWith('### ')) { flushLists(); rendered.push(<h3 key={i} className="text-base font-bold mt-5 mb-1.5 text-foreground">{line.slice(4)}</h3>) }
    else if (line.startsWith('## ')) { flushLists(); rendered.push(<h2 key={i} className="text-lg font-bold mt-6 mb-2 text-foreground border-b border-border pb-1">{line.slice(3)}</h2>) }
    else if (line.startsWith('# ')) { flushLists(); rendered.push(<h1 key={i} className="text-xl font-bold mt-6 mb-2 text-foreground">{line.slice(2)}</h1>) }
    else if (line.startsWith('- ') || line.startsWith('* ')) { flushOl(); ulBuffer.push(line.slice(2)) }
    else if (/^\d+\.\s/.test(line)) { flushUl(); olBuffer.push(line.replace(/^\d+\.\s/, '')) }
    else if (line.startsWith('> ')) { flushLists(); rendered.push(<blockquote key={i} className="border-l-4 border-primary/50 pl-4 my-2 text-sm text-muted-foreground italic">{inlineFormat(line.slice(2))}</blockquote>) }
    else if (line.trim() === '') { flushLists(); rendered.push(<div key={i} className="h-2" />) }
    else { flushLists(); rendered.push(<p key={i} className="text-sm leading-relaxed text-foreground/90 my-1">{inlineFormat(line)}</p>) }
    i++
  }
  flushLists()

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      {rendered}
    </div>
  )
}

function LessonView() {
  const { courseSlug, lessonId } = Route.useParams()
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [unlocking, setUnlocking] = useState(false)

  useEffect(() => { if (!isLoading && !user) navigate({ to: '/auth' }) }, [isLoading, user, navigate])

  const { data: course } = useQuery({
    queryKey: ['course-full', courseSlug],
    queryFn: () => getCourse({ data: { slug: courseSlug } }),
  })

  const lessons = ((course?.lessons ?? []) as any[]).sort((a, b) => a.position - b.position)
  const current = lessons.find((l) => l.id === lessonId)
  const idx = lessons.findIndex((l) => l.id === lessonId)
  const prev = idx > 0 ? lessons[idx - 1] : null
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null

  const { data: modules } = useQuery({
    queryKey: ['modules', course?.id, user?.id],
    enabled: !!course?.id,
    queryFn: () => getModules({ data: { courseId: course!.id as string } }),
  })
  const currentModule = (modules ?? []).find((m: any) => m.id === current?.module_id) ?? null
  const locked = !!currentModule && !currentModule.unlocked

  const { data: tokenBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['token-balance', user?.id],
    enabled: !!user,
    queryFn: () => getTokenBalance(),
  })
  const balance = tokenBalance ?? 0
  const tokensNeeded = currentModule ? Math.max(0, currentModule.token_cost - balance) : 0

  const unlockMut = useMutation({
    mutationFn: (moduleId: string) => unlockModule({ data: { moduleId } }),
    onSuccess: () => {
      toast.success('Module unlocked!')
      qc.invalidateQueries({ queryKey: ['modules'] })
      refetchBalance()
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to unlock module'),
  })

  const { data: completedIds } = useQuery({
    queryKey: ['lesson-progress', course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const ids = lessons.map((l) => l.id)
      if (!ids.length) return new Set<string>()
      const done = await getLessonProgress({ data: { lessonIds: ids } })
      return new Set(done)
    },
  })
  const done = completedIds ?? new Set<string>()

  const moduleLessons = current ? lessons.filter((l) => l.module_id === current.module_id) : []
  const idxInModule = moduleLessons.findIndex((l) => l.id === lessonId)
  const nextInModule = idxInModule >= 0 && idxInModule < moduleLessons.length - 1 ? moduleLessons[idxInModule + 1] : null

  const markDone = useMutation({
    mutationFn: () => markLessonComplete({ data: { lessonId } }),
    onSuccess: () => {
      toast.success('Lesson complete!')
      qc.invalidateQueries({ queryKey: ['lesson-progress'] })
      if (nextInModule) {
        navigate({ to: '/learn/$courseSlug/$lessonId', params: { courseSlug, lessonId: nextInModule.id } })
      } else if (current?.module_id) {
        navigate({ to: '/learn/$courseSlug/module/$moduleId/test', params: { courseSlug, moduleId: current.module_id } })
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  if (!course || !current) {
    return <PageShell><div className="mx-auto max-w-5xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>
  }

  const embed = getEmbedUrl(current.video_url)

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <Link to="/courses/$slug" params={{ slug: courseSlug }} className="text-sm text-muted-foreground hover:text-primary">← Back to course</Link>
          <h1 className="font-display text-3xl font-bold mt-3">{current.title}</h1>
          {current.description && <p className="mt-2 text-muted-foreground">{current.description}</p>}

          {locked ? (
            <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 font-display text-lg font-semibold">{currentModule.title} is locked</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Unlock this module to read its lessons.
              </p>
              <Button
                className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={unlockMut.isPending}
                onClick={() => (tokensNeeded > 0 ? setUnlocking(true) : unlockMut.mutate(currentModule.id))}
              >
                <Coins className="h-4 w-4 mr-1.5" />
                {tokensNeeded > 0 ? `Buy ${tokensNeeded} token${tokensNeeded === 1 ? '' : 's'} & unlock` : `Unlock for ${currentModule.token_cost} token${currentModule.token_cost === 1 ? '' : 's'}`}
              </Button>
              <BuyTokens
                tokens={tokensNeeded}
                courseTitle={`${(course as any).title} — ${currentModule.title}`}
                open={unlocking}
                onOpenChange={setUnlocking}
                onPurchased={() => { setUnlocking(false); refetchBalance(); unlockMut.mutate(currentModule.id) }}
              />
            </div>
          ) : (
            <>
              {embed && (
                <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-border bg-card">
                  <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              )}

              {current.content && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Lesson Notes</span>
                  </div>
                  <NoteRenderer content={current.content} />
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  {prev && (
                    <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug, lessonId: prev.id }}>
                      <Button variant="outline"><ChevronLeft className="h-4 w-4" /> Previous</Button>
                    </Link>
                  )}
                  {next && (
                    <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug, lessonId: next.id }}>
                      <Button variant="outline">Next <ChevronRight className="h-4 w-4" /></Button>
                    </Link>
                  )}
                </div>
                <Button
                  onClick={() => markDone.mutate()}
                  disabled={markDone.isPending || done.has(current.id)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {done.has(current.id) ? 'Completed' : nextInModule ? 'Mark complete & next' : 'Mark complete & take the test'}
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-3 rounded-2xl border border-border bg-card p-4 max-h-[80vh] overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 pb-1">{(course as any).title}</div>
          {(modules ?? []).map((m: any) => {
            const lessonsInModule = lessons.filter((l) => l.module_id === m.id)
            return (
              <div key={m.id} className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground">
                  {m.unlocked ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Lock className="h-3 w-3" />}
                  {m.title}
                </div>
                {lessonsInModule.map((l, i) => {
                  const isDone = done.has(l.id)
                  const active = l.id === lessonId
                  return (
                    <Link
                      key={l.id}
                      to="/learn/$courseSlug/$lessonId"
                      params={{ courseSlug, lessonId: l.id }}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-primary/15 text-primary border border-primary/30' : 'hover:bg-muted text-foreground'}`}
                    >
                      <div className={`grid h-6 w-6 place-items-center rounded text-[10px] ${isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                      </div>
                      <span className="flex-1 truncate">{l.title}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </aside>
      </div>
    </PageShell>
  )
}
