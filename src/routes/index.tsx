import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Sparkles, Zap, Users, BookOpen, Play,
  Layout, Server, Brain, Cloud, Palette, Code2,
  CheckCircle2, Star,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "VIBELEARN — Learn Coding with AI | Build Real Apps with React & TypeScript" },
      { name: "description", content: "Start learning to code with AI today. VIBELEARN offers hands-on courses in React, TypeScript, AI-assisted coding (vibecoding), full-stack development, DevOps, and UI design. Free to start. Earn certificates." },
      { property: "og:title", content: "VIBELEARN — Learn Coding with AI | Build Real Apps" },
      { property: "og:description", content: "Hands-on coding courses for the vibe era. Build real apps with AI, learn React, TypeScript, and full-stack development. Free to start." },
      { property: "og:url", content: "https://vibelearn.app/" },
    ],
  }),
});

const iconMap: Record<string, any> = { Sparkles, Layout, Server, Brain, Cloud, Palette, Code2 };


/* Static fallback data shown when Supabase is unreachable */
const STATIC_CATEGORIES = [
  { id: "1", slug: "vibecoding", name: "Vibecoding", icon: "Sparkles", description: "Build real apps with AI as your co-pilot — the modern way to code." },
  { id: "2", slug: "frontend", name: "Frontend Dev", icon: "Layout", description: "React, TypeScript, Tailwind — build UIs that feel alive." },
  { id: "3", slug: "backend", name: "Backend & APIs", icon: "Server", description: "Node.js, databases, auth — power the apps you build." },
  { id: "4", slug: "ai-ml", name: "AI & Machine Learning", icon: "Brain", description: "From prompting to fine-tuning — learn to wield AI properly." },
  { id: "5", slug: "devops", name: "DevOps & Cloud", icon: "Cloud", description: "Deploy, scale, and ship with Cloudflare, Docker and CI/CD." },
  { id: "6", slug: "design", name: "UI Design", icon: "Palette", description: "Design systems, Figma, motion — make it beautiful AND fast." },
];

const STATIC_COURSES = [
  { id: "1", slug: "vibecoding-101", title: "Vibecoding 101: Build Your First AI App", level: "beginner", description: "Start from zero and ship a working app in your first week using modern AI tools.", categories: { name: "Vibecoding" }, thumbnail: "/photo.png" },
  { id: "2", slug: "react-mastery", title: "React & TypeScript Mastery", level: "intermediate", description: "Build production-grade UIs with React, TypeScript, and the modern component ecosystem.", categories: { name: "Frontend Dev" }, thumbnail: "/photo..png" },
  { id: "3", slug: "ai-integration", title: "Integrating AI into Real Products", level: "advanced", description: "Learn to wire LLMs, embeddings, and vector search into real-world SaaS products.", categories: { name: "AI & Machine Learning" }, thumbnail: "/photo...png" },
];

/* Platform preview screenshots */
const SCREENSHOTS = [
  { src: "/photo.png", label: "Interactive Lessons", desc: "Video + notes + quizzes in one flow" },
  { src: "/photo..png", label: "Module Library", desc: "Organised by track and skill level" },
  { src: "/photo...png", label: "Progress Tracking", desc: "Certificates when you complete a module" },
  { src: "/photo....png", label: "Learn Anywhere", desc: "Fully responsive on every screen" },
];

function Index() {
  // Landing page uses static data only — no network requests.
  // Live data loads once the user navigates to /courses or /library.
  const displayCategories = STATIC_CATEGORIES;
  const displayCourses = STATIC_COURSES;

  return (
    <PageShell>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-glow min-h-[85vh] sm:min-h-0 flex flex-col justify-center">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-[0.13] pointer-events-none"
          style={{ backgroundImage: "url('/favicon.svg')" }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-32 text-center">
          <Badge className="mb-5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 text-xs sm:text-sm">
            <Sparkles className="mr-1 h-3 w-3" /> Welcome to the vibe era
          </Badge>

          <h1 className="font-display text-[2.4rem] leading-[1.15] sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Learn tech by{" "}
            <span className="text-gradient">vibe-coding</span>
            <br className="hidden sm:block" />{" "}
            your way in.
          </h1>

          <p className="mx-auto mt-5 sm:mt-6 max-w-xl sm:max-w-2xl text-base sm:text-lg text-muted-foreground px-2">
            VIBELEARN is a modern learning platform where you build real apps with AI as your co-pilot.
            Start from zero, ship something real, and grow into a real builder.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/courses" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 glow-ring h-12 px-6 text-base">
                Browse courses <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup" }} className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 border-border hover:bg-muted text-base">
                Create free account
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xs sm:max-w-3xl mx-auto">
            {[
              { v: "30+", l: "Lessons" },
              { v: "6", l: "Tracks" },
              { v: "100%", l: "Hands-on" },
              { v: "Free", l: "To start" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center">
                <div className="font-display text-2xl sm:text-3xl font-bold text-gradient">{s.v}</div>
                <div className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM SCREENSHOTS ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Inside the platform</p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mt-2">See what you're getting into.</h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            A learning experience built for people who actually ship — not just watch tutorials.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {SCREENSHOTS.map((s, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card card-glass hover:border-primary/50 transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/10 via-card to-accent/5">
                <img
                  src={s.src}
                  alt={s.label}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-display font-semibold text-sm sm:text-base">{s.label}</span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LEARNING TRACKS ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-10 sm:py-16">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Learning tracks</p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mt-1.5">Pick your lane.</h2>
          </div>
          <Link to="/courses" className="shrink-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCategories.map((c: any) => {
            const Icon = iconMap[c.icon ?? "Sparkles"] ?? Sparkles;
            return (
              <Link
                key={c.id}
                to="/courses"
                search={{ category: c.slug }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 hover:border-primary/50 transition-all card-glass"
              >
                <div className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-xl bg-primary/10 text-primary mb-3 sm:mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base sm:text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                <div className="mt-3 sm:mt-4 flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
                  Explore track <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── FEATURED COURSES ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-10 sm:py-14">
        <div className="flex items-end justify-between mb-8 sm:mb-10">
          <div>
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Hand-picked</p>
            <h2 className="font-display text-2xl sm:text-4xl font-bold mt-1.5">Start with these.</h2>
          </div>
          <Link to="/library" className="shrink-0 flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
            All courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayCourses.map((c: any) => {
            const thumb = c.thumbnail_url ?? c.thumbnail;
            return (
              <Link
                key={c.id}
                to={c.slug?.startsWith("vibe") || c.id === "1" || c.id === "2" || c.id === "3" ? "/courses" : "/courses/$slug"}
                params={c.slug ? { slug: c.slug } : undefined}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all card-glass"
              >
                <div className="aspect-[16/9] relative bg-gradient-to-br from-primary/20 via-accent/10 to-transparent overflow-hidden">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={c.title}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                          '<div class="absolute inset-0 grid place-items-center"><svg xmlns=\'http://www.w3.org/2000/svg\' class=\'h-12 w-12 opacity-20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\'><polygon points=\'5 3 19 12 5 21 5 3\'/></svg></div>';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center">
                      <Play className="h-12 w-12 text-primary/30" />
                    </div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur border-border capitalize text-xs">
                    {c.level}
                  </Badge>
                </div>
                <div className="p-4 sm:p-5">
                  <div className="text-xs text-primary uppercase tracking-wider font-medium">
                    {c.categories?.name ?? "General"}
                  </div>
                  <h3 className="mt-1 font-display text-base sm:text-lg font-semibold group-hover:text-primary transition leading-snug">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{c.description}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition">
                    View course <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── WHY VIBELEARN ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Why choose us</p>
          <h2 className="font-display text-2xl sm:text-4xl font-bold mt-1.5">Built different.</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: Zap, t: "Build, don't bookmark", d: "Every lesson ends with you shipping something real — not collecting tutorials you never finish." },
            { icon: BookOpen, t: "Curated, not endless", d: "Tight playlists from idea to deploy. No 40-hour filler. Just what you need to ship." },
            { icon: Users, t: "Learn in public", d: "Share progress, ask questions, get unstuck together. Learning is faster with a community." },
          ].map((v) => (
            <div key={v.t} className="rounded-2xl border border-border bg-card p-6 sm:p-7 card-glass">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary mb-4">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold">{v.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL STRIP ── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { q: "I shipped my first SaaS in 3 weeks using the Vibecoding track. Insane.", name: "Amara K.", role: "Student" },
            { q: "Finally a platform that respects my time. Every lesson is dense with real stuff.", name: "Brian O.", role: "Fullstack Dev" },
            { q: "The module exams + certificates gave me something to show employers. Game changer.", name: "Leilani M.", role: "Career Switcher" },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-5 sm:p-6 card-glass">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.q}"</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-6 py-12 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 sm:p-14 text-center glow-ring">
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-5xl font-bold">Ready to start vibing?</h2>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
              Create your free account and join thousands of builders learning to ship with AI.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base">
                  Get started — it's free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/library" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                  Browse library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
