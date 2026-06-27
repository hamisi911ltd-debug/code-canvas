import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getCourse, getLessonProgress, markLessonComplete, getModules, getTokenBalance, unlockModule, getModuleUnlockCooldown } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { BuyTokens } from '@/components/BuyTokens'
import { CelebrationOverlay } from '@/components/Celebration'
import { LessonIllustration } from '@/components/illustrations/LessonIllustrations'
import { CheckCircle2, ChevronLeft, ChevronRight, FileText, Check, Lock, Coins, PartyPopper } from 'lucide-react'
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
  let olBuffer: { n: number; t: string }[] = []
  let olStart = 1
  let quoteBuffer: string[] = []
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
        <ol key={`ol-${key++}`} start={olStart} className="list-decimal list-inside space-y-1 my-2 text-sm text-foreground/90">
          {items.map((item, i) => <li key={i}>{inlineFormat(item.t)}</li>)}
        </ol>,
      )
      olBuffer = []
      olStart = 1
    }
  }
  const flushQuote = () => {
    if (quoteBuffer.length) {
      const text = quoteBuffer.join('\n').trim()
      rendered.push(
        <blockquote key={`bq-${key++}`} className="border-l-4 border-primary/50 bg-primary/[0.04] rounded-r-lg pl-4 pr-3 py-2 my-3 text-sm text-muted-foreground italic">
          {text.split('\n').filter(Boolean).map((t, i) => <p key={i} className={i > 0 ? 'mt-1.5' : ''}>{inlineFormat(t)}</p>)}
        </blockquote>,
      )
      quoteBuffer = []
    }
  }
  const flushLists = () => { flushUl(); flushOl() }
  const flushAll = () => { flushLists(); flushQuote() }

  const parseTableRow = (line: string) =>
    line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'))
  const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().startsWith('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      flushAll()
      const header = parseTableRow(line)
      i += 2
      const bodyRows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { bodyRows.push(parseTableRow(lines[i])); i++ }
      rendered.push(
        <div key={`table-${key++}`} className="my-4 overflow-x-auto rounded-xl border border-border animate-in fade-in-0 duration-500">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/50">{header.map((h, hi) => <th key={hi} className="text-left font-semibold px-3 py-2 border-b border-border whitespace-nowrap">{inlineFormat(h)}</th>)}</tr></thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-0 even:bg-muted/20">
                  {row.map((cell, ci) => <td key={ci} className="px-3 py-2 align-top">{inlineFormat(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    const image = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (image) {
      flushAll()
      rendered.push(
        <figure key={`img-${key++}`} className="my-4 animate-in fade-in-0 zoom-in-95 duration-500">
          <img src={image[2]} alt={image[1] || ''} loading="lazy" className="w-full rounded-xl border border-border object-cover" />
          {image[1] && <figcaption className="mt-1.5 text-center text-xs text-muted-foreground">{image[1]}</figcaption>}
        </figure>,
      )
      i++
      continue
    }

    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      flushAll()
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

    if (line.startsWith('### ')) { flushAll(); rendered.push(<h3 key={i} className="text-base font-bold mt-5 mb-1.5 text-foreground animate-in fade-in-0 slide-in-from-left-1 duration-300">{inlineFormat(line.slice(4))}</h3>) }
    else if (line.startsWith('## ')) { flushAll(); rendered.push(<h2 key={i} className="text-lg font-bold mt-6 mb-2 text-foreground border-b border-border pb-1 animate-in fade-in-0 slide-in-from-left-1 duration-300">{inlineFormat(line.slice(3))}</h2>) }
    else if (line.startsWith('# ')) { flushAll(); rendered.push(<h1 key={i} className="text-xl font-bold mt-6 mb-2 text-foreground animate-in fade-in-0 slide-in-from-left-1 duration-300">{inlineFormat(line.slice(2))}</h1>) }
    else if (line.startsWith('- ') || line.startsWith('* ')) { flushOl(); flushQuote(); ulBuffer.push(line.slice(2)) }
    else if (/^(\d+)\.\s/.test(line)) { flushUl(); flushQuote(); const m = line.match(/^(\d+)\.\s+(.*)$/)!; const n = Number(m[1]); const txt = m[2]; if (!olBuffer.length) olStart = n; olBuffer.push({ n, t: txt }) }
    else if (line.startsWith('> ')) { flushLists(); quoteBuffer.push(line.slice(2)) }
    else if (line.trim() === '') { if (quoteBuffer.length) quoteBuffer.push(''); else { flushAll(); rendered.push(<div key={i} className="h-2" />) } }
    else { flushAll(); rendered.push(<p key={i} className="text-sm leading-relaxed text-foreground/90 my-1">{inlineFormat(line)}</p>) }
    i++
  }
  flushAll()

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
  const [celebrating, setCelebrating] = useState(false)

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

  const { data: cooldown, refetch: refetchCooldown } = useQuery({
    queryKey: ['module-unlock-cooldown', user?.id],
    enabled: !!user,
    queryFn: () => getModuleUnlockCooldown(),
    refetchInterval: (q) => (q.state.data?.remainingMs ? 30_000 : false),
  })
  const cooldownMinutes = cooldown?.remainingMs ? Math.ceil(cooldown.remainingMs / 60000) : 0

  const unlockMut = useMutation({
    mutationFn: (moduleId: string) => unlockModule({ data: { moduleId } }),
    onSuccess: () => {
      toast.success('Module unlocked!')
      qc.invalidateQueries({ queryKey: ['modules'] })
      refetchBalance()
      refetchCooldown()
    },
    onError: (e: unknown) => { toast.error(e instanceof Error ? e.message : 'Failed to unlock module'); refetchCooldown() },
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
      qc.invalidateQueries({ queryKey: ['lesson-progress'] })
      setCelebrating(true)
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const proceedAfterCelebration = () => {
    setCelebrating(false)
    if (nextInModule) {
      navigate({ to: '/learn/$courseSlug/$lessonId', params: { courseSlug, lessonId: nextInModule.id } })
    } else if (current?.module_id) {
      navigate({ to: '/learn/$courseSlug/module/$moduleId/test', params: { courseSlug, moduleId: current.module_id } })
    }
  }

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
              {cooldownMinutes > 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  Only one new module per hour — you can unlock the next one in <span className="text-primary font-semibold">{cooldownMinutes} minute{cooldownMinutes === 1 ? '' : 's'}</span>.
                </p>
              ) : (
                <Button
                  className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={unlockMut.isPending}
                  onClick={() => (tokensNeeded > 0 ? setUnlocking(true) : unlockMut.mutate(currentModule.id))}
                >
                  <Coins className="h-4 w-4 mr-1.5" />
                  {tokensNeeded > 0 ? `Buy ${tokensNeeded} token${tokensNeeded === 1 ? '' : 's'} & unlock` : `Unlock for ${currentModule.token_cost} token${currentModule.token_cost === 1 ? '' : 's'}`}
                </Button>
              )}
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

              {!embed && (
                <div className="mt-6 animate-in fade-in-0 zoom-in-95 duration-500">
                  {current.ai_image_url ? (
                    <div className="rounded-2xl overflow-hidden border border-border">
                      <img src={current.ai_image_url} alt="" className="w-full max-h-72 object-cover" />
                    </div>
                  ) : (
                    <LessonIllustration categorySlug={(course as any).categories?.slug} seed={idx} />
                  )}
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

      {celebrating && (
        <CelebrationOverlay
          icon={PartyPopper}
          title="Lesson complete! 🎉"
          subtitle={nextInModule ? `Nice work — next up: "${nextInModule.title}"` : "You've finished this module's lessons — time for the test."}
          ctaLabel={nextInModule ? 'Next lesson' : 'Take the test'}
          onDone={proceedAfterCelebration}
        />
      )}
    </PageShell>
  )
}
