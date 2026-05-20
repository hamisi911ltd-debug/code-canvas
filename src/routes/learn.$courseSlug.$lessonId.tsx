import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, Play, Lock } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export const Route = createFileRoute("/learn/$courseSlug/$lessonId")({ component: LessonView });

function getEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
}

function LessonView() {
  const { courseSlug, lessonId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  const { data: course } = useQuery({
    queryKey: ["course-full", courseSlug],
    queryFn: async () => (await supabase.from("courses").select("*, lessons(*)").eq("slug", courseSlug).maybeSingle()).data,
  });

  const lessons = ((course?.lessons ?? []) as any[]).sort((a, b) => a.position - b.position);
  const current = lessons.find((l) => l.id === lessonId);
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const { data: progress } = useQuery({
    queryKey: ["lesson-progress", course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const ids = lessons.map((l) => l.id);
      if (!ids.length) return [];
      return (await supabase.from("lesson_progress").select("lesson_id").eq("user_id", user!.id).in("lesson_id", ids)).data ?? [];
    },
  });
  const completedIds = new Set((progress ?? []).map((p: any) => p.lesson_id));

  const markDone = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("lesson_progress").upsert(
        { user_id: user!.id, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lesson complete!");
      qc.invalidateQueries({ queryKey: ["lesson-progress"] });
      if (next) navigate({ to: "/learn/$courseSlug/$lessonId", params: { courseSlug, lessonId: next.id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!course || !current) {
    return <PageShell><div className="mx-auto max-w-5xl px-4 py-20"><div className="h-96 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>;
  }

  const embed = getEmbedUrl(current.video_url);

  return (
    <PageShell hideFooter>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <Link to="/courses/$slug" params={{ slug: courseSlug }} className="text-sm text-muted-foreground hover:text-primary">← Back to course</Link>
          <h1 className="font-display text-3xl font-bold mt-3">{current.title}</h1>
          {current.description && <p className="mt-2 text-muted-foreground">{current.description}</p>}

          {embed && (
            <div className="mt-6 aspect-video rounded-2xl overflow-hidden border border-border bg-card">
              <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}

          {current.content && (
            <div className="mt-8 prose prose-invert max-w-none">
              <div className="rounded-2xl border border-border bg-card p-6 whitespace-pre-wrap text-sm leading-relaxed">
                {current.content}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2">
              {prev && (
                <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug, lessonId: prev.id }}>
                  <Button variant="outline"><ChevronLeft className="h-4 w-4" /> Previous</Button>
                </Link>
              )}
              {next && (
                <Link to="/learn/$courseSlug/$lessonId" params={{ courseSlug, lessonId: next.id }}>
                  <Button variant="outline">Next <ChevronRight className="h-4 w-4" /></Button>
                </Link>
              )}
            </div>
            <Button
              onClick={() => markDone.mutate()}
              disabled={markDone.isPending || completedIds.has(current.id)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              {completedIds.has(current.id) ? "Completed" : "Mark complete & next"}
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start space-y-2 rounded-2xl border border-border bg-card p-4 max-h-[80vh] overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-2 pb-2">{course.title}</div>
          {lessons.map((l, i) => {
            const done = completedIds.has(l.id);
            const active = l.id === lessonId;
            return (
              <Link
                key={l.id}
                to="/learn/$courseSlug/$lessonId"
                params={{ courseSlug, lessonId: l.id }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-muted text-foreground"}`}
              >
                <div className={`grid h-6 w-6 place-items-center rounded text-[10px] ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                </div>
                <span className="flex-1 truncate">{l.title}</span>
              </Link>
            );
          })}
        </aside>
      </div>
    </PageShell>
  );
}
