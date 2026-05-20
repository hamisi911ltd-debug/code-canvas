import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({ component: Community });

function Community() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: posts } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await supabase.from("community_posts").select("*, profiles(display_name)").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("login");
      if (title.trim().length < 3 || content.trim().length < 5) throw new Error("Add a longer title and content");
      const { error } = await supabase.from("community_posts").insert({ user_id: user.id, title: title.trim(), content: content.trim() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Posted!"); setOpen(false); setTitle(""); setContent(""); qc.invalidateQueries({ queryKey: ["posts"] }); },
    onError: (e: any) => { if (e.message === "login") navigate({ to: "/auth" }); else toast.error(e.message); },
  });

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-16 pb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Community</p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Build with friends.</h1>
            <p className="mt-3 text-muted-foreground">Ship updates, share wins, get unstuck.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { if (!user) navigate({ to: "/auth" }); }} className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                <Plus className="h-4 w-4" /> New post
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Share something</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} rows={6} /></div>
                <Button onClick={() => create.mutate()} disabled={create.isPending} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Post</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        {(posts ?? []).length === 0 ? (
          <div className="text-center py-20">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">Be the first to post.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(posts ?? []).map((p: any) => {
              const name = p.profiles?.display_name ?? "Anonymous";
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-5 card-glass">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                    <div className="text-sm">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</div>
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-foreground/90 whitespace-pre-wrap">{p.content}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" /> Discuss
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PageShell>
  );
}
