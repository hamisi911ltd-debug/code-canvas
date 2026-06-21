import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { getCategories, getCourses } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Search, Play, BookOpen } from 'lucide-react'

const search = z.object({ category: z.string().optional(), q: z.string().optional() })
export const Route = createFileRoute('/courses/')({
  component: CoursesPage,
  validateSearch: (s) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Online Coding Courses | React, TypeScript, AI Development — VIBELEARN" },
      { name: "description", content: "Browse all VIBELEARN coding courses. Learn React, TypeScript, full-stack web development, AI-assisted coding, DevOps, and UI design. Beginner to advanced. Earn certificates on completion." },
      { property: "og:title", content: "Online Coding Courses | VIBELEARN" },
      { property: "og:description", content: "Browse hands-on courses in React, TypeScript, AI/ML, DevOps, and more. Learn by building real apps." },
    ],
  }),
})

function CoursesPage() {
  const { category, q: initialQ } = Route.useSearch()
  const [q, setQ] = useState(initialQ ?? '')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  })

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', category],
    queryFn: () => getCourses({ data: { categorySlug: category } }),
  })

  const filtered = (courses ?? []).filter(
    (c: any) =>
      !q ||
      c.title.toLowerCase().includes(q.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-5 sm:pt-8 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses…" className="pl-10 h-11 bg-card border-border" />
          </div>
          <h1 className="font-display text-lg sm:text-2xl font-bold shrink-0">All courses</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            to="/courses"
            className={`px-3 py-1.5 rounded-full text-sm border transition ${!category ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
          >
            All
          </Link>
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/courses"
              search={{ category: c.slug }}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${category === c.slug ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 sm:h-72 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No courses yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
            {filtered.map((c: any) => (
              <Link
                key={c.id}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="group rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition card-glass"
              >
                <div className="aspect-video relative bg-gradient-to-br from-primary/20 via-accent/10 to-transparent overflow-hidden">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Play className="h-7 w-7 sm:h-12 sm:w-12 text-primary/40" />
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur border-border capitalize text-[10px] sm:text-xs px-1.5 py-0.5">{c.level}</Badge>
                </div>
                <div className="p-2.5 sm:p-5">
                  <div className="text-[10px] sm:text-xs text-primary uppercase tracking-wider">{c.categories?.name ?? 'General'}</div>
                  <h3 className="mt-0.5 font-display text-xs sm:text-lg font-semibold group-hover:text-primary transition line-clamp-2">{c.title}</h3>
                  <p className="mt-1 text-[11px] sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
