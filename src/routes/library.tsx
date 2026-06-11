import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getLibraryModules } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Play, FileText, Link2, ArrowRight, Sparkles, Layout, Server, Brain, Cloud, Palette, Library } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/library')({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Tech Course Library | Web Dev, AI & Coding Modules — VIBELEARN" },
      { name: "description", content: "Explore VIBELEARN's full course library. Modules covering React, TypeScript, AI coding, backend development, DevOps and design. Videos, notes, quizzes and a final exam per module." },
      { property: "og:title", content: "Tech Course Library | VIBELEARN" },
      { property: "og:description", content: "Explore our full library of tech modules — React, AI coding, DevOps, design and more. Each module includes videos, notes, tests and a certificate exam." },
    ],
  }),
})

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Layout, Server, Brain, Cloud, Palette,
}

function LibraryPage() {
  const [q, setQ] = useState('')

  const { data: modules, isLoading } = useQuery({
    queryKey: ['library-modules'],
    queryFn: () => getLibraryModules(),
  })

  const filtered = (modules ?? []).filter(
    (m: any) =>
      !q.trim() ||
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      (m.description ?? '').toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Study library</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Modules & study material.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">
            Pick a learning track. Each module has video lessons, written notes, and curated external tutorials.
          </p>
          <div className="relative mt-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search modules..." className="pl-9 h-11 bg-card border-border" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Library className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No modules found.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((mod: any) => {
              const Icon = iconMap[mod.icon ?? 'Sparkles'] ?? Sparkles
              const total = (mod.videoCount ?? 0) + (mod.notesCount ?? 0) + (mod.resourceCount ?? 0)
              return (
                <Link
                  key={mod.id}
                  to="/library/$moduleSlug"
                  params={{ moduleSlug: mod.slug }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all card-glass flex flex-col"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition">
                      <Icon className="h-5 w-5" />
                    </div>
                    {total > 0 && <Badge variant="secondary" className="text-xs">{total} items</Badge>}
                  </div>
                  <h3 className="font-display text-xl font-bold group-hover:text-primary transition">{mod.name}</h3>
                  {mod.description && <p className="mt-2 text-sm text-muted-foreground flex-1">{mod.description}</p>}
                  <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {mod.videoCount > 0 && (
                      <span className="flex items-center gap-1.5"><Play className="h-3.5 w-3.5 text-primary" /> {mod.videoCount} video{mod.videoCount !== 1 ? 's' : ''}</span>
                    )}
                    {mod.notesCount > 0 && (
                      <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" /> {mod.notesCount} note{mod.notesCount !== 1 ? 's' : ''}</span>
                    )}
                    {mod.resourceCount > 0 && (
                      <span className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5 text-primary" /> {mod.resourceCount} tutorial{mod.resourceCount !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
                    Open module <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </PageShell>
  )
}
