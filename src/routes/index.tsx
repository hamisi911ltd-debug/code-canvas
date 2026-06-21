import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, Search, Zap, Brain, Rocket, Code2,
  CheckCircle2, Sparkles, Terminal, Globe, Users, Award,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

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
  "Master backend APIs — fast.",
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

const STATIC_COURSES = [
  { id: "1", title: "Vibecoding 101: Build Your First AI App", level: "beginner", category: "Vibecoding", photo: "/photo.png" },
  { id: "2", title: "React & TypeScript Mastery", level: "intermediate", category: "Frontend Dev", photo: "/photo..png" },
  { id: "3", title: "Integrating AI into Real Products", level: "advanced", category: "AI & Machine Learning", photo: "/photo...png" },
  { id: "4", title: "Backend APIs with Node & D1", level: "intermediate", category: "Backend & APIs", photo: "/photo....png" },
  { id: "5", title: "Deploy & Scale on Cloudflare", level: "intermediate", category: "DevOps & Cloud", photo: "/photo5.svg" },
  { id: "6", title: "UI Design Systems in Figma", level: "beginner", category: "UI Design", photo: "/photo6.svg" },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI-First Learning",
    desc: "Every lesson pairs you with AI tools — Claude, Cursor, Copilot — so you learn the way professionals actually ship in 2026.",
    color: "from-violet-500/20 to-purple-500/5",
    iconColor: "text-violet-400",
  },
  {
    icon: Terminal,
    title: "Real Projects, Real Code",
    desc: "No toy examples. You build deployable apps — React frontends, Cloudflare Workers APIs, D1 databases — from lesson one.",
    color: "from-emerald-500/20 to-teal-500/5",
    iconColor: "text-emerald-400",
  },
  {
    icon: Rocket,
    title: "Ship Fast, Learn Deep",
    desc: "Structured tracks take you from zero to deployed in days, not months. Each module has a project, quiz, and certificate.",
    color: "from-blue-500/20 to-cyan-500/5",
    iconColor: "text-blue-400",
  },
  {
    icon: Globe,
    title: "Deploy to the Edge",
    desc: "Learn to push code to Cloudflare's global edge network — the same infrastructure that powers millions of apps worldwide.",
    color: "from-orange-500/20 to-amber-500/5",
    iconColor: "text-orange-400",
  },
];

const STATS = [
  { value: "2,400+", label: "Students enrolled", icon: Users },
  { value: "50+", label: "Hands-on lessons", icon: Code2 },
  { value: "6", label: "Learning tracks", icon: Sparkles },
  { value: "100%", label: "Project-based", icon: Award },
];

const WHAT_IS = [
  { icon: "⚡", text: "Vibecoding is using AI assistants to write, debug, and ship code at 10x speed" },
  { icon: "🤖", text: "Describe what you want → Claude writes it → you understand why it works" },
  { icon: "🚀", text: "From blank file to deployed app in a single session — that's the vibe" },
  { icon: "🎯", text: "Still learn real skills: TypeScript, React, APIs, databases — just with AI support" },
];

function Index() {
  const [q, setQ] = useState("");
  const typed = useTypewriter(PHRASES);
  const heroRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const filtered = STATIC_COURSES.filter(
    (c) => !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.category.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageShell>

      {/* ──────────────────────────────────────────
          HERO: SPLIT LAYOUT — TEXT LEFT, ILLUSTRATION RIGHT
      ────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[480px] flex items-center">
        <div className="absolute inset-0 bg-glow grid-pattern opacity-25 pointer-events-none" />
        {/* Glow orbs */}
        <div className="absolute top-10 left-[10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[15%] w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl w-full px-5 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* LEFT — headline + typewriter + search */}
            <div
              ref={heroRef}
              className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs text-primary font-semibold mb-4 backdrop-blur-sm">
                <Zap className="h-3 w-3" />
                The #1 Vibecoding Platform
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Learn tech by{" "}
                <span className="text-gradient">vibe-coding</span>
                <br className="hidden sm:block" /> your way in.
              </h1>

              {/* Typewriter line */}
              <div className="mt-4 h-8 flex items-center">
                <span className="text-lg sm:text-xl font-mono text-primary/80 font-medium">
                  {typed}
                  <span className="inline-block w-[2px] h-5 bg-primary ml-0.5 animate-pulse align-middle" />
                </span>
              </div>

              <p className="mt-4 text-muted-foreground text-sm sm:text-base max-w-lg leading-relaxed">
                Vibecoding is how the best developers build in 2026 — AI-assisted, fast, and laser-focused on shipping real things.
                We teach you every skill <em>and</em> every shortcut.
              </p>

              {/* Search bar */}
              <div className="relative mt-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search courses, topics, tracks…"
                  className="pl-10 h-11 bg-card/80 border-border backdrop-blur-sm text-sm"
                />
              </div>

              {/* CTA buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/auth" search={{ mode: "signup" }}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-7 glow-ring">
                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline" className="h-11 px-7">
                    Browse courses
                  </Button>
                </Link>
              </div>

              {/* Trust pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {["Free to start", "No credit card", "Certificates included"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {t}
                  </span>
                ))}
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
          STATS BAR
      ────────────────────────────────────────── */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-display text-lg sm:text-xl font-bold leading-none">{value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          WHAT IS VIBECODING?
      ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-14 items-center">

          {/* Left — explanation */}
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">What is Vibecoding?</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug">
              The fastest way to go from idea{" "}
              <span className="text-gradient">to shipped app.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Vibecoding means building with AI as your co-pilot. You describe what you want, the AI writes
              the boilerplate, and you focus on the logic that matters. It's not a shortcut — it's a superpower.
            </p>

            <div className="mt-6 space-y-3">
              {WHAT_IS.map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5 shrink-0">{icon}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <Link to="/tracks">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Explore learning tracks <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — feature cards 2×2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }) => (
              <div
                key={title}
                className={`relative overflow-hidden rounded-xl border border-border p-4 sm:p-5 bg-gradient-to-br ${color} card-glass hover:border-primary/40 transition-colors`}
              >
                <div className={`grid h-9 w-9 place-items-center rounded-lg bg-background/60 mb-3`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">{desc}</p>
              </div>
            ))}
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

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No courses match "{q}"</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to="/courses"
                className="group rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-all card-glass"
              >
                <div className="aspect-[16/9] relative overflow-hidden bg-muted/20">
                  <img
                    src={c.photo}
                    alt={c.title}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <Badge className="absolute top-2 left-2 bg-background/80 backdrop-blur border-border capitalize text-[10px] sm:text-xs px-1.5 py-0.5">
                    {c.level}
                  </Badge>
                </div>
                <div className="p-2.5 sm:p-4">
                  <div className="text-[10px] sm:text-xs text-primary uppercase tracking-wider font-medium">{c.category}</div>
                  <h3 className="mt-0.5 font-display text-xs sm:text-base font-semibold group-hover:text-primary transition leading-snug line-clamp-2">
                    {c.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────
          VIBECODING PROMISE STRIP
      ────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 sm:px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/8 via-card to-blue-500/8 p-6 sm:p-10">
          <div className="absolute inset-0 grid-pattern opacity-15 pointer-events-none" />
          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Terminal className="h-7 w-7 text-primary" />
              <h3 className="font-semibold text-sm sm:text-base">Write real code from day 1</h3>
              <p className="text-xs text-muted-foreground">No drag-and-drop. No sandbox toys. Real editors, real repos, real deployments.</p>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Brain className="h-7 w-7 text-violet-400" />
              <h3 className="font-semibold text-sm sm:text-base">AI as your coding partner</h3>
              <p className="text-xs text-muted-foreground">Claude, Cursor, and GitHub Copilot are built into every lesson flow — use them, don't fight them.</p>
            </div>
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Award className="h-7 w-7 text-amber-400" />
              <h3 className="font-semibold text-sm sm:text-base">Earn verifiable certificates</h3>
              <p className="text-xs text-muted-foreground">Pass the exam at the end of each track and earn a shareable certificate with your name on it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────
          CTA
      ────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-7 sm:p-12 text-center glow-ring">
          <div className="absolute inset-0 grid-pattern opacity-20" />
          <div className="relative">
            <span className="inline-block rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary mb-4">
              🎉 Free to join — always
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold">Ready to start vibing?</h2>
            <p className="mt-2 text-muted-foreground text-sm max-w-md mx-auto">
              Join 2,400+ developers learning to build with AI. Free to start, no credit card needed.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                  Get started — it's free <ArrowRight className="ml-2 h-4 w-4" />
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
