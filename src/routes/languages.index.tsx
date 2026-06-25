import { createFileRoute, Link } from '@tanstack/react-router'
import { PageShell } from '@/components/PageShell'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Clock } from 'lucide-react'

export const Route = createFileRoute('/languages/')({
  component: LanguagesPage,
  head: () => ({
    meta: [
      { title: 'Pick a Language — VIBELEARN' },
      { name: 'description', content: 'Choose JavaScript or Python and start learning to build real apps with AI as your co-pilot.' },
    ],
  }),
})

function LanguagesPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 sm:pt-16 pb-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">Pick a language</h1>
          <p className="mt-3 text-muted-foreground">Choose where you want to start — courses are grouped by language.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Link
            to="/courses"
            className="group rounded-2xl border border-primary/30 bg-card p-8 text-center hover:border-primary/60 transition card-glass"
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary text-xl font-display font-bold mb-4">
              JS
            </div>
            <h2 className="font-display text-xl font-bold">JavaScript</h2>
            <p className="mt-2 text-sm text-muted-foreground">React, TypeScript, Node, AI integration, deployment, and design systems — 6 courses ready to go.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
              Browse courses <ArrowRight className="h-4 w-4" />
            </span>
          </Link>

          <div className="rounded-2xl border border-border bg-card p-8 text-center opacity-70">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground text-xl font-display font-bold mb-4">
              Py
            </div>
            <h2 className="font-display text-xl font-bold">Python</h2>
            <p className="mt-2 text-sm text-muted-foreground">Python courses are in the works.</p>
            <Badge variant="outline" className="mt-4 gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" /> Coming soon
            </Badge>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
