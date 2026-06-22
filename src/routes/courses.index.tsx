import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getCourses } from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { BookOpen } from 'lucide-react'

// Same illustrated photos used on the landing page and course/track detail pages,
// keyed by category slug — used for any course without its own admin-set thumbnail_url.
const CATEGORY_PHOTOS: Record<string, string> = {
  vibecoding: '/photo.png',
  frontend: '/photo..png',
  'ai-ml': '/photo...png',
  backend: '/photo....png',
  devops: '/photo5.svg',
  design: '/photo6.svg',
}

export const Route = createFileRoute('/courses/')({
  component: CoursesPage,
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
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => getCourses({ data: {} }),
  })

  const filtered = courses ?? []

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
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
                <div className="aspect-video relative overflow-hidden bg-muted/20">
                  <img
                    src={c.thumbnail_url || CATEGORY_PHOTOS[c.categories?.slug] || '/photo.png'}
                    alt={c.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
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
