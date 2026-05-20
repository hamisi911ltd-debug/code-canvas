import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Play, BookOpen } from "lucide-react";

const search = z.object({ category: z.string().optional() });
export const Route = createFileRoute("/courses")({
  component: CoursesPage,
  validateSearch: (s) => search.parse(s),
});

function CoursesPage() {
  const { category } = Route.useSearch();
  const [q, setQ] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", category],
    queryFn: async () => {
      let qb = supabase.from("courses").select("*, categories(name, slug)").eq("published", true).order("created_at", { ascending: false });
      if (category) {
        const cat = (await supabase.from("categories").select("id").eq("slug", category).maybeSingle()).data;
        if (cat?.id) qb = qb.eq("category_id", cat.id);
      }
      return (await qb).data ?? [];
    },
  });

  const filtered = (courses ?? []).filter((c: any) =>
    !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.description?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Course catalog</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">All courses.</h1>
          <p className="mt-3 text-muted-foreground max-w-xl">Filter by track or search by topic. New lessons drop every week.</p>
          <div className="relative mt-8 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses..." className="pl-9 h-11 bg-card border-border" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          <Link to="/courses" className={`px-3 py-1.5 rounded-full text-sm border transition ${!category ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
            All
          </Link>
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              to="/courses"
              search={{ category: c.slug }}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${category === c.slug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-72 rounded-2xl bg-muted/40 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No courses yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c: any) => (
              <Link key={c.id} to="/courses/$slug" params={{ slug: c.slug }} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition card-glass">
                <div className="aspect-video relative bg-gradient-to-br from-primary/20 via-accent/10 to-transparent overflow-hidden">
                  {c.thumbnail_url ? (
                    <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Play className="h-12 w-12 text-primary/40" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur border-border capitalize">{c.level}</Badge>
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary uppercase tracking-wider">{c.categories?.name ?? "General"}</div>
                  <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-primary transition">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
