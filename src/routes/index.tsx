import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Code2, Cpu, Cloud, Palette, Zap, Users, BookOpen, FlaskConical, Play, Layout, Server, Brain } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

const iconMap: Record<string, any> = { Sparkles, Layout, Server, Brain, Cloud, Palette };

function Index() {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: featured } = useQuery({
    queryKey: ["featured-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*, categories(name, slug)").eq("published", true).order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
  });

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-glow">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-32 text-center">
          <Badge className="mb-6 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15">
            <Sparkles className="mr-1 h-3 w-3" /> Welcome to the vibe era
          </Badge>
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight">
            Learn tech by <span className="text-gradient">vibe-coding</span>
            <br /> your way in.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            VibeLearn is a modern learning platform where you build real apps with AI as your co-pilot.
            Start from zero, ship something real, and grow into a real builder.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/courses">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring h-12 px-6">
                Browse courses <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" variant="outline" className="h-12 px-6 border-border hover:bg-muted">
                Create free account
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { v: "30+", l: "Lessons" },
              { v: "6", l: "Tracks" },
              { v: "100%", l: "Hands-on" },
              { v: "0", l: "Setup fees" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold text-gradient">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Learning tracks</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2">Pick your lane.</h2>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c) => {
            const Icon = iconMap[c.icon ?? "Sparkles"] ?? Sparkles;
            return (
              <Link
                key={c.id}
                to="/courses"
                search={{ category: c.slug }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all card-glass"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURED COURSES */}
      {featured && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Hand-picked</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2 mb-10">Start with these.</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((c: any) => (
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
        </section>
      )}

      {/* VALUE PROPS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, t: "Build, don't bookmark", d: "Every lesson ends with you shipping something real — not collecting tutorials." },
            { icon: BookOpen, t: "Curated, not endless", d: "Tight playlists from idea to deploy. No 40-hour bloat." },
            { icon: Users, t: "Learn in public", d: "Share progress, ask questions, get unstuck in the community." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-7 card-glass">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary mb-4">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-10 sm:p-14 text-center glow-ring">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-5xl font-bold">Ready to start vibing?</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Create your free account and join thousands learning to build with AI.
            </p>
            <Link to="/auth" search={{ mode: "signup" }} className="inline-block mt-7">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
                Get started — it's free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
