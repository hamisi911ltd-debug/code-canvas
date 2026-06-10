import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getResearchArticle } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export const Route = createFileRoute('/research/$slug')({ component: Article })

function Article() {
  const { slug } = Route.useParams()
  const { data: a, isLoading } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => getResearchArticle({ data: { slug } }),
  })

  if (isLoading) return <PageShell><div className="mx-auto max-w-3xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>
  if (!a) return <PageShell><div className="mx-auto max-w-3xl px-4 py-20 text-center"><p className="text-muted-foreground">Article not found.</p></div></PageShell>

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <Link to="/research" className="text-sm text-muted-foreground hover:text-primary">← All research</Link>
        <div className="mt-4 flex flex-wrap gap-1">
          {((a as any).tags ?? []).map((t: string) => (
            <Badge key={t} variant="outline" className="border-primary/30 text-primary">{t}</Badge>
          ))}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4 tracking-tight">{(a as any).title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{format(new Date((a as any).created_at), 'MMM d, yyyy')}</p>
        {(a as any).cover_image_url && (
          <img src={(a as any).cover_image_url} alt={(a as any).title} className="mt-8 rounded-2xl border border-border w-full" />
        )}
        {(a as any).excerpt && <p className="mt-8 text-xl text-muted-foreground leading-relaxed">{(a as any).excerpt}</p>}
        <div className="mt-8 whitespace-pre-wrap leading-relaxed text-foreground/90">{(a as any).content}</div>
      </article>
    </PageShell>
  )
}
