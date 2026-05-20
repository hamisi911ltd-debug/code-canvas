import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Play, Clock, BookOpen, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/courses/$slug")({ component: CourseDetail });

function CourseDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", slug],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*, categories(name, slug), lessons(*)").eq("slug", slug).eq("published", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => (await supabase.from("enrollments").select("*").eq("course_id", course!.id).eq("user_id", user!.id).maybeSingle()).data,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const lessonIds = (course?.lessons ?? []).map((l: any) => l.id);
      if (lessonIds.length === 0) return [];
      return (await supabase.from("lesson_progress").select("lesson_id").eq("user_id", user!.id).in("lesson_id", lessonIds)).data ?? [];
    },
  });

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login");
      const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: course!.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Enrolled! Let's go."); qc.invalidateQueries({ queryKey: ["enrollment"] }); },
    onError: (e: any) => { if (e.message === "login") navigate({ to: "/auth" }); else toast.error(e.message); },
  });

  if (isLoading) return <PageShell><div className="mx-auto max-w-5xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>;
  if (!course) return null;

  const lessons = (course.lessons ?? []).sort((a: any, b: any) => a.position - b.position);
  const completedIds = new Set((progress ?? []).map((p: any) => p.lesson_id));
  const pct = lessons.length ? Math.round((completedIds.size / lessons.length) * 100) : 0;

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-12">
          <Link to="/courses" className="text-sm text-muted-foreground hover:text-primary">← All courses</Link>
          <div className="mt-4 flex items-center gap-2">
            {course.categories && <Badge variant="outline" className="border-primary/50 text-primary">{course.categories.name}</Badge>}
            <Badge className="bg-muted text-foreground capitalize">{course.level}</Badge>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-4">{course.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl">{course.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-primary" /> {lessons.length} lessons</span>
            {course.duration_minutes ? <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-primary" /> {course.duration_minutes} min</span> : null}
          </div>
          {user && enrollment && (
            <div className="mt-6 max-w-md">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Your progress</span><span>{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
          <div className="mt-7">
            {!user ? (
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">Sign up to enroll</Button>
              </Link>
            ) : enrollment ? (
              lessons[0] && (
                <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug: course.slug, lessonId: lessons[0].id }}>
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                    {completedIds.size > 0 ? "Continue learning" : "Start course"} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )
            ) : (
              <Button size="lg" onClick={() => enroll.mutate()} disabled={enroll.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                Enroll for free
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h2 className="font-display text-2xl font-bold mb-6">Lessons</h2>
        {lessons.length === 0 ? (
          <p className="text-muted-foreground">Lessons coming soon.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((l: any, i: number) => {
              const done = completedIds.has(l.id);
              const accessible = !!enrollment;
              const Inner = (
                <div className={`group flex items-center gap-4 rounded-xl border bg-card p-4 transition ${accessible ? "hover:border-primary/50 cursor-pointer" : "opacity-60"} border-border`}>
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {done ? <CheckCircle2 className="h-5 w-5" /> : accessible ? <Play className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">Lesson {i + 1}</div>
                    <div className="font-medium truncate">{l.title}</div>
                  </div>
                  {l.duration_minutes ? <span className="text-xs text-muted-foreground">{l.duration_minutes} min</span> : null}
                </div>
              );
              return accessible ? (
                <Link key={l.id} to="/learn/$courseSlug/$lessonId" params={{ courseSlug: course.slug, lessonId: l.id }}>{Inner}</Link>
              ) : (
                <div key={l.id}>{Inner}</div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
