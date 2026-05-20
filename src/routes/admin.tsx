import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield, BookOpen, FlaskConical, FileText, Layers, UserCog, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-20"><div className="h-64 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>;
  if (!user) return null;

  if (!isAdmin) return <BecomeAdmin />;

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Admin</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Control center.</h1>
          <p className="mt-2 text-muted-foreground">Post resources, courses, lessons, and research. Manage users.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Tabs defaultValue="courses">
          <TabsList className="mb-6 bg-card border border-border">
            <TabsTrigger value="courses"><BookOpen className="h-4 w-4" /> Courses</TabsTrigger>
            <TabsTrigger value="lessons"><Layers className="h-4 w-4" /> Lessons</TabsTrigger>
            <TabsTrigger value="research"><FlaskConical className="h-4 w-4" /> Research</TabsTrigger>
            <TabsTrigger value="resources"><FileText className="h-4 w-4" /> Resources</TabsTrigger>
            <TabsTrigger value="users"><UserCog className="h-4 w-4" /> Users</TabsTrigger>
          </TabsList>
          <TabsContent value="courses"><CoursesAdmin /></TabsContent>
          <TabsContent value="lessons"><LessonsAdmin /></TabsContent>
          <TabsContent value="research"><ResearchAdmin /></TabsContent>
          <TabsContent value="resources"><ResourcesAdmin /></TabsContent>
          <TabsContent value="users"><UsersAdmin /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  );
}

function BecomeAdmin() {
  const { user, refreshRole } = useAuth();
  const qc = useQueryClient();
  const { data: anyAdmin, isLoading } = useQuery({
    queryKey: ["any-admin"],
    queryFn: async () => {
      const { count } = await supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
      return (count ?? 0) > 0;
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_roles").insert({ user_id: user!.id, role: "admin" });
      if (error) throw error;
    },
    onSuccess: async () => { toast.success("You're now an admin."); await refreshRole(); qc.invalidateQueries({ queryKey: ["any-admin"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary mb-5">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold">Admin access required</h2>
          {isLoading ? (
            <p className="mt-3 text-muted-foreground">Checking…</p>
          ) : anyAdmin ? (
            <>
              <p className="mt-3 text-muted-foreground">An admin already exists. Ask them to grant you access from the Users tab.</p>
              <Link to="/dashboard"><Button variant="outline" className="mt-6">Back to dashboard</Button></Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-muted-foreground">No admin has claimed this site yet. As the first signed-in user, you can claim ownership.</p>
              <Button onClick={() => claim.mutate()} disabled={claim.isPending} className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">
                Claim admin
              </Button>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

/* =================== COURSES =================== */
function CoursesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", level: "beginner", category_id: "", thumbnail_url: "", duration_minutes: 0, published: false });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => (await supabase.from("courses").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("name")).data ?? [],
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", level: "beginner", category_id: "", thumbnail_url: "", duration_minutes: 0, published: false }); setOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ title: c.title, description: c.description ?? "", level: c.level, category_id: c.category_id ?? "", thumbnail_url: c.thumbnail_url ?? "", duration_minutes: c.duration_minutes ?? 0, published: c.published }); setOpen(true); };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, category_id: form.category_id || null, slug: slugify(form.title) };
      if (editing) {
        const { error } = await supabase.from("courses").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("courses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-courses"] }); },
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> New course</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Level</Label>
                  <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Thumbnail URL</Label><Input value={form.thumbnail_url} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} placeholder="https://…" /></div>
              <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Published</Label>
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              </div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.title.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {(courses ?? []).map((c: any) => (
          <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{c.title}</span>
                <Badge variant="outline" className="capitalize text-xs">{c.level}</Badge>
                {c.categories && <Badge variant="outline" className="text-xs">{c.categories.name}</Badge>}
                {c.published ? <Badge className="bg-primary/15 text-primary text-xs">Live</Badge> : <Badge className="bg-muted text-xs">Draft</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{c.description}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this course?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(courses ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No courses yet.</div>}
      </div>
    </div>
  );
}

/* =================== LESSONS =================== */
function LessonsAdmin() {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", content: "", position: 1, duration_minutes: 0 });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-min"],
    queryFn: async () => (await supabase.from("courses").select("id, title").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: lessons } = useQuery({
    queryKey: ["admin-lessons", courseId],
    enabled: !!courseId,
    queryFn: async () => (await supabase.from("lessons").select("*").eq("course_id", courseId).order("position")).data ?? [],
  });

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", video_url: "", content: "", position: (lessons?.length ?? 0) + 1, duration_minutes: 0 }); setOpen(true); };
  const openEdit = (l: any) => { setEditing(l); setForm({ title: l.title, description: l.description ?? "", video_url: l.video_url ?? "", content: l.content ?? "", position: l.position, duration_minutes: l.duration_minutes ?? 0 }); setOpen(true); };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = { ...form, course_id: courseId };
      if (editing) { const { error } = await supabase.from("lessons").update(payload).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("lessons").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-lessons"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("lessons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-lessons"] }); },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="max-w-sm"><SelectValue placeholder="Pick a course…" /></SelectTrigger>
          <SelectContent>{(courses ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
        {courseId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"><Plus className="h-4 w-4" /> New lesson</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit lesson" : "New lesson"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <div className="space-y-1.5"><Label>Video URL (YouTube/Vimeo)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
                <div className="space-y-1.5"><Label>Written content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Order</Label><Input type="number" value={form.position} onChange={(e) => setForm({ ...form, position: Number(e.target.value) })} /></div>
                  <div className="space-y-1.5"><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                </div>
              </div>
              <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.title.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="space-y-2">
        {!courseId ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Pick a course to manage lessons.</div>
        ) : (lessons ?? []).length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No lessons yet.</div>
        ) : (lessons ?? []).map((l: any) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <span className="grid h-7 w-7 place-items-center rounded bg-muted text-xs">{l.position}</span>
            <div className="flex-1 min-w-0"><div className="font-medium truncate">{l.title}</div><div className="text-xs text-muted-foreground truncate">{l.description}</div></div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(l.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =================== RESEARCH =================== */
function ResearchAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", cover_image_url: "", tags: "", published: false });

  const { data: articles } = useQuery({
    queryKey: ["admin-research"],
    queryFn: async () => (await supabase.from("research_articles").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const openNew = () => { setEditing(null); setForm({ title: "", excerpt: "", content: "", cover_image_url: "", tags: "", published: false }); setOpen(true); };
  const openEdit = (a: any) => { setEditing(a); setForm({ title: a.title, excerpt: a.excerpt ?? "", content: a.content, cover_image_url: a.cover_image_url ?? "", tags: (a.tags ?? []).join(", "), published: a.published }); setOpen(true); };

  const save = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title, excerpt: form.excerpt, content: form.content,
        cover_image_url: form.cover_image_url, published: form.published,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        slug: slugify(form.title),
      };
      if (editing) { const { error } = await supabase.from("research_articles").update(payload).eq("id", editing.id); if (error) throw error; }
      else { const { error } = await supabase.from("research_articles").insert(payload); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Saved"); setOpen(false); qc.invalidateQueries({ queryKey: ["admin-research"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("research_articles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-research"] }); },
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> New article</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit article" : "New article"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Excerpt</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5"><Label>Cover image URL</Label><Input value={form.cover_image_url} onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3"><Label>Published</Label><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.title.trim() || !form.content.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {(articles ?? []).map((a: any) => (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{a.title}</span>
                {a.published ? <Badge className="bg-primary/15 text-primary text-xs">Live</Badge> : <Badge className="bg-muted text-xs">Draft</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{a.excerpt}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(a.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(articles ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No articles yet.</div>}
      </div>
    </div>
  );
}

/* =================== RESOURCES =================== */
function ResourcesAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "link", url: "" });

  const { data: items } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => (await supabase.from("resources").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("resources").insert(form); if (error) throw error; },
    onSuccess: () => { toast.success("Added"); setOpen(false); setForm({ title: "", description: "", type: "link", url: "" }); qc.invalidateQueries({ queryKey: ["admin-resources"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("resources").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-resources"] }); },
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" /> New resource</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New resource</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem><SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="cheatsheet">Cheat sheet</SelectItem><SelectItem value="code">Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.title || !form.url} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {(items ?? []).map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <Badge variant="outline" className="capitalize text-xs">{r.type}</Badge>
            <div className="flex-1 min-w-0">
              <a href={r.url} target="_blank" rel="noopener" className="font-medium hover:text-primary">{r.title}</a>
              <div className="text-xs text-muted-foreground truncate">{r.description}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(items ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No resources yet.</div>}
      </div>
    </div>
  );
}

/* =================== USERS =================== */
function UsersAdmin() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const profiles = (await supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false })).data ?? [];
      const roles = (await supabase.from("user_roles").select("user_id, role")).data ?? [];
      return profiles.map((p) => ({ ...p, roles: roles.filter((r) => r.user_id === p.id).map((r) => r.role) }));
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) { const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" }); if (error) throw error; }
      else { const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin"); if (error) throw error; }
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-2">
      {(users ?? []).map((u: any) => {
        const admin = u.roles.includes("admin");
        return (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="font-medium">{u.display_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground truncate">{u.id}</div>
            </div>
            {admin && <Badge className="bg-primary/15 text-primary">Admin</Badge>}
            <Button size="sm" variant={admin ? "outline" : "default"} className={admin ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"} onClick={() => toggleAdmin.mutate({ userId: u.id, makeAdmin: !admin })}>
              {admin ? "Revoke admin" : "Make admin"}
            </Button>
          </div>
        );
      })}
      {(users ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No users yet.</div>}
    </div>
  );
}
