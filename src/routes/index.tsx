import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCourses } from "@/server-functions/data";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Same illustrated photos used across courses/tracks, keyed by category slug — used when
// a course has no admin-set thumbnail_url.
const CATEGORY_PHOTOS: Record<string, string> = {
  vibecoding: "/photo.png",
  frontend: "/photo..png",
  "ai-ml": "/photo...png",
  backend: "/photo....png",
  devops: "/photo5.svg",
  design: "/photo6.svg",
};

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "VIBELEARN — Learn Coding with AI | Build Real Apps with React & TypeScript" },
      { name: "description", content: "Start learning to code with AI today. VIBELEARN offers hands-on courses in React, TypeScript, AI-assisted coding, full-stack development, DevOps, and UI design. Free to start." },
      { property: "og:title", content: "VIBELEARN — Learn Coding with AI" },
      { property: "og:description", content: "Hands-on coding courses for the vibe era. Build real apps with AI." },
      { property: "og:url", content: "https://vibelearn.app/" },
    ],
  }),
});

const PHRASES = [
  "Build an AI app in 30 minutes.",
  "Ship React + TypeScript projects.",
  "Deploy to the edge with Cloudflare.",
  "Master backend APIs, fast.",
  "Design stunning UIs in Figma.",
  "Code smarter with AI assistance.",
  "Go from idea to production today.",
];

function useTypewriter(words: string[], typingDelay = 70, pause = 1800) {
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIndex < current.length) {
      timeout = setTimeout(() => {
        setText(current.slice(0, charIndex + 1));
        setCharIndex((c) => c + 1);
      }, typingDelay);
    } else if (!deleting && charIndex === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIndex > 0) {
      timeout = setTimeout(() => {
        setText(current.slice(0, charIndex - 1));
        setCharIndex((c) => c - 1);
      }, typingDelay / 2);
    } else if (deleting && charIndex === 0) {
      setDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, deleting, wordIndex, words, typingDelay, pause]);

  return text;
}

function Index() {
  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => getCourses({ data: {} }),
  });
  const typed = useTypewriter(PHRASES);
  const heroRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <PageShell>

      {/* ──────────────────────────────────────────
          HERO: SPLIT LAYOUT — TEXT LEFT, ILLUSTRATION RIGHT
      ────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-glow grid-pattern opacity-25 pointer-events-none" />
        {/* Glow orbs */}
        <div className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[15%] w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl w-full px-5 sm:px-6 py-5 sm:py-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT — headline + typewriter + search */}
            <div
              ref={heroRef}
              className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Learn to code, the{" "}
                <span className="text-gradient">vibe-coding</span> way.
              </h1>

              {/* Typewriter line */}
              <div className="mt-4 h-8 flex items-center overflow-hidden">
                <span className="text-base sm:text-xl font-mono text-primary/80 font-medium whitespace-nowrap">
                  {typed}
                  <span className="inline-block w-[2px] h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                </span>
              </div>

              <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed">
                This is how the best developers build today: fast, AI-assisted, and focused on shipping real things.
                We'll teach you the skills <em>and</em> the shortcuts.
              </p>

              {/* CTA buttons */}
              <div className="mt-6 flex items-center gap-2 sm:gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-4 sm:px-7 glow-ring">
                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline" className="h-11 px-4 sm:px-7">
                    Browse courses
                  </Button>
                </Link>
              </div>

              {/* Trust pill */}
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  Certificates included
                </span>
              </div>
            </div>

            {/* RIGHT — hero illustration */}
            <div
              className={`hidden lg:block transition-all duration-700 delay-200 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}
            >
              <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-2xl">
                <img
                  src="/vibe-hero.svg"
                  alt="Vibecoding — AI-assisted coding environment"
                  className="w-full h-auto"
                  loading="eager"
                />
                {/* Overlay glow at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          HANDPICKED COURSES
      ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hand-picked</p>
            <h2 className="font-display text-xl sm:text-2xl font-bold mt-0.5">Popular courses</h2>
          </div>
          <Link to="/courses" className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
            All courses <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {(courses ?? []).slice(0, 6).map((c: any) => (
              <Link
                key={c.id}
                to="/courses/$slug"
                params={{ slug: c.slug }}
                className="group rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all card-glass"
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-muted/20">
                  <img
                    src={c.thumbnail_url || CATEGORY_PHOTOS[c.categories?.slug] || "/photo.png"}
                    alt={c.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-2.5 sm:p-4">
                  <div className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-medium">{c.categories?.name ?? "General"}</div>
                  <h3 className="mt-0.5 font-display text-xs sm:text-base font-semibold group-hover:text-primary transition leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* ──────────────────────────────────────────
          CTA
      ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-7 sm:p-12 text-center glow-ring">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <h2 className="font-display text-2xl sm:text-4xl font-bold">Ready to start vibing?</h2>
            <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
              Create an account and grab tokens to unlock courses and start building with AI.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/courses" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-8">Browse all courses</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
