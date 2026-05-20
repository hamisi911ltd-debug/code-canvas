import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/research")({ component: ResearchList });

function ResearchList() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["research"],
    queryFn: async () => (await supabase.from("research_articles").select("*").eq("published", true).order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Research</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Deep dives & essays.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Long-form research from the VibeLearn team — exploring how the tech landscape is changing.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-64 bg-muted/40 rounded-2xl animate-pulse" />)}</div>
        ) : (articles ?? []).length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No articles yet. The research lab is brewing.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(articles ?? []).map((a) => (
              <Link key={a.id} to="/research/$slug" params={{ slug: a.slug }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition card-glass">
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/10 to-transparent">
                  {a.cover_image_url && <img src={a.cover_image_url} alt={a.title} className="w-full h-full object-cover" />}
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(a.tags ?? []).slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary">{t}</Badge>
                    ))}
                  </div>
                  <h3 className="font-display text-lg font-semibold group-hover:text-primary transition line-clamp-2">{a.title}</h3>
                  {a.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>}
                  <div className="mt-3 inline-flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                    Read article <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
