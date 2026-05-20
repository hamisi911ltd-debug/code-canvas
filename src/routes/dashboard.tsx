import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Clock, ArrowRight, Flame } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: rows } = useQuery({
    queryKey: ["my-courses", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const enrolls = (await supabase.from("enrollments").select("course_id, enrolled_at, courses(*, lessons(id))").eq("user_id", user!.id)).data ?? [];
      const lessonIds = enrolls.flatMap((e: any) => (e.courses?.lessons ?? []).map((l: any) => l.id));
      const prog = lessonIds.length
        ? ((await supabase.from("lesson_progress").select("lesson_id").eq("user_id", user!.id).in("lesson_id", lessonIds)).data ?? [])
        : [];
      const done = new Set(prog.map((p: any) => p.lesson_id));
      return enrolls.map((e: any) => {
        const total = (e.courses?.lessons ?? []).length;
        const completed = (e.courses?.lessons ?? []).filter((l: any) => done.has(l.id)).length;
        return { ...e, total, completed, pct: total ? Math.round((completed / total) * 100) : 0 };
      });
    },
  });

  const totals = (rows ?? []).reduce((acc, r) => ({
    enrolled: acc.enrolled + 1,
    completed: acc.completed + r.completed,
    finished: acc.finished + (r.pct === 100 ? 1 : 0),
  }), { enrolled: 0, completed: 0, finished: 0 });

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <p className="text-sm text-primary uppercase tracking-wider font-medium">Dashboard</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">
            Welcome back, <span className="text-gradient">{profile?.display_name ?? "builder"}</span>.
          </h1>
          <p className="mt-3 text-muted-foreground">Pick up where you left off, or start a new track.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {[
            { icon: BookOpen, label: "Enrolled", value: totals.enrolled },
            { icon: CheckCircle2, label: "Lessons done", value: totals.completed },
            { icon: Flame, label: "Courses finished", value: totals.finished },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 card-glass">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between mb-6">
          <h2 className="font-display text-2xl font-bold">My courses</h2>
          <Link to="/courses" className="text-sm text-primary hover:underline">Browse all</Link>
        </div>

        {(rows ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">You haven't enrolled in anything yet.</p>
            <Link to="/courses" className="inline-flex items-center gap-1 mt-4 text-primary hover:underline text-sm">
              Browse courses <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(rows ?? []).map((r) => (
              <Link key={r.course_id} to="/courses/$slug" params={{ slug: r.courses.slug }} className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition card-glass">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-primary uppercase tracking-wider capitalize">{r.courses.level}</div>
                    <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-primary">{r.courses.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.completed}/{r.total}</span>
                </div>
                <div className="mt-4">
                  <Progress value={r.pct} className="h-2" />
                  <div className="mt-2 text-xs text-muted-foreground">{r.pct}% complete</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
