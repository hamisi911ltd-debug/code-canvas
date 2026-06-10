import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  getAdminStats, getRecentEnrollments, getAdminStudents,
  toggleAdmin, grantTokens, getAllCoursesAdmin, getCategories,
  upsertCourse, deleteCourse, getLessons, upsertLesson, deleteLesson,
  getAdminExam, upsertExam, getTokenPackages, upsertTokenPackage,
  deleteTokenPackage, getAdminTransactions, getAdminResearch,
  upsertResearchArticle, deleteResearchArticle, getAdminResources,
  upsertResource, deleteResource, getStudentDetail,
  upsertCategory, deleteCategory, getCommunityPostsAdmin, deletePost,
} from '@/server-functions/data'
import { PageShell } from '@/components/PageShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Shield, BookOpen, FlaskConical, FileText, Layers,
  ShieldCheck, Coins, BarChart3, Users, Award, TrendingUp,
  CheckCircle2, XCircle, GiftIcon, Package, DollarSign, ChevronDown, ChevronUp,
  Tag, MessageSquare, Globe,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export const Route = createFileRoute('/admin')({ component: AdminPage })

function AdminPage() {
  const { user, isAdmin, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (!isLoading && !user) navigate({ to: '/auth' }) }, [isLoading, user, navigate])

  if (isLoading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-20"><div className="h-64 bg-muted/40 animate-pulse rounded-2xl" /></div></PageShell>
  if (!user) return null
  if (!isAdmin) return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-primary/10 text-primary mb-5">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold">Admin access required</h2>
          <p className="mt-3 text-muted-foreground">Contact <span className="text-primary font-semibold">hamisi.911.ltd@gmail.com</span> to request admin access.</p>
          <Link to="/dashboard"><Button variant="outline" className="mt-6">Back to dashboard</Button></Link>
        </div>
      </div>
    </PageShell>
  )

  return (
    <PageShell>
      <section className="bg-glow relative">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <p className="text-sm text-primary uppercase tracking-wider font-medium">Admin Control Center</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold mt-2">Command everything.</h1>
          <p className="mt-2 text-muted-foreground">Students · Curriculum · Categories · Exams · Payments · Research · Resources · Community</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 bg-card border border-border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview"><BarChart3 className="h-4 w-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="students"><Users className="h-4 w-4 mr-1" />Students</TabsTrigger>
            <TabsTrigger value="curriculum"><BookOpen className="h-4 w-4 mr-1" />Curriculum</TabsTrigger>
            <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-1" />Categories</TabsTrigger>
            <TabsTrigger value="exams"><Award className="h-4 w-4 mr-1" />Exams</TabsTrigger>
            <TabsTrigger value="payments"><Coins className="h-4 w-4 mr-1" />Payments</TabsTrigger>
            <TabsTrigger value="research"><FlaskConical className="h-4 w-4 mr-1" />Research</TabsTrigger>
            <TabsTrigger value="resources"><FileText className="h-4 w-4 mr-1" />Resources</TabsTrigger>
            <TabsTrigger value="community"><MessageSquare className="h-4 w-4 mr-1" />Community</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="students"><StudentsTab /></TabsContent>
          <TabsContent value="curriculum"><CurriculumTab /></TabsContent>
          <TabsContent value="categories"><CategoriesAdmin /></TabsContent>
          <TabsContent value="exams"><ExamsTab /></TabsContent>
          <TabsContent value="payments"><PaymentsTab /></TabsContent>
          <TabsContent value="research"><ResearchAdmin /></TabsContent>
          <TabsContent value="resources"><ResourcesAdmin /></TabsContent>
          <TabsContent value="community"><CommunityAdmin /></TabsContent>
        </Tabs>
      </section>
    </PageShell>
  )
}

/* ── OVERVIEW ──────────────────────────────────────────────────────────────── */
function OverviewTab() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => getAdminStats() })
  const { data: recentEnrollments } = useQuery({ queryKey: ['admin-recent-enrollments'], queryFn: () => getRecentEnrollments() })

  const cards = [
    { icon: Users, label: 'Total Students', value: stats?.students ?? 0, color: 'text-blue-400' },
    { icon: BookOpen, label: 'Live Courses', value: stats?.courses ?? 0, color: 'text-primary' },
    { icon: TrendingUp, label: 'Enrollments', value: stats?.enrollments ?? 0, color: 'text-purple-400' },
    { icon: CheckCircle2, label: 'Lessons Completed', value: stats?.completions ?? 0, color: 'text-green-400' },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="card-glass border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="mt-2 font-display text-3xl font-bold">{(c.value as number).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h3 className="font-display text-lg font-bold mb-4">Recent Enrollments</h3>
        <div className="space-y-2">
          {(recentEnrollments ?? []).map((e: any) => (
            <div key={e.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{e.courses?.title ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{e.profiles?.display_name ?? 'Unknown student'}</div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(e.enrolled_at as string), { addSuffix: true })}
              </div>
            </div>
          ))}
          {(recentEnrollments ?? []).length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No enrollments yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── STUDENTS ──────────────────────────────────────────────────────────────── */
function StudentsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [grantOpen, setGrantOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [grantAmount, setGrantAmount] = useState('50')
  const [grantNote, setGrantNote] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: users } = useQuery({ queryKey: ['admin-students'], queryFn: () => getAdminStudents() })

  const toggleAdminMut = useMutation({
    mutationFn: ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => toggleAdmin({ data: { userId, makeAdmin } }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['admin-students'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const grantMut = useMutation({
    mutationFn: () => grantTokens({ data: { userId: selectedUser.id, amount: Number(grantAmount), note: grantNote } }),
    onSuccess: () => {
      toast.success(`${grantAmount} tokens granted`)
      setGrantOpen(false); setGrantAmount('50'); setGrantNote('')
      qc.invalidateQueries({ queryKey: ['admin-students'] })
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const filtered = (users ?? []).filter((u: any) =>
    !search || (u.display_name ?? '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" className="max-w-sm" />
        <Badge variant="secondary" className="self-center">{filtered.length} students</Badge>
      </div>
      <div className="space-y-2">
        {filtered.map((u: any) => {
          const expanded = expandedId === u.id
          return (
            <div key={u.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary font-bold text-sm">
                  {(u.display_name ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{u.display_name ?? 'Unnamed'}</span>
                    {u.isAdmin && <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">Admin</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {u.email} · {u.enrollCount} course{u.enrollCount !== 1 ? 's' : ''} · {u.tokenBalance} tokens · Joined {formatDistanceToNow(new Date(u.created_at as string), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setGrantOpen(true) }} className="hidden sm:flex gap-1">
                    <Coins className="h-3.5 w-3.5" /> Grant tokens
                  </Button>
                  <Button size="sm" variant={u.isAdmin ? 'outline' : 'default'}
                    className={u.isAdmin ? '' : 'bg-primary text-primary-foreground hover:bg-primary/90'}
                    onClick={() => toggleAdminMut.mutate({ userId: u.id, makeAdmin: !u.isAdmin })}>
                    {u.isAdmin ? 'Revoke admin' : 'Make admin'}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setExpandedId(expanded ? null : u.id)}>
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              {expanded && <StudentDetail userId={u.id} />}
            </div>
          )
        })}
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No students yet.</div>}
      </div>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Grant tokens to {selectedUser?.display_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              Current balance: <span className="font-semibold text-primary">{selectedUser?.tokenBalance ?? 0} tokens</span>
            </div>
            <div className="space-y-1.5"><Label>Tokens to grant</Label><Input type="number" min={1} value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Note (optional)</Label><Input value={grantNote} onChange={(e) => setGrantNote(e.target.value)} placeholder="Reason for grant…" /></div>
          </div>
          <DialogFooter>
            <Button onClick={() => grantMut.mutate()} disabled={grantMut.isPending || !grantAmount || Number(grantAmount) < 1} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <GiftIcon className="h-4 w-4 mr-1" /> Grant tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StudentDetail({ userId }: { userId: string }) {
  const { data } = useQuery({ queryKey: ['admin-student-detail', userId], queryFn: () => getStudentDetail({ data: { userId } }) })
  return (
    <div className="border-t border-border px-4 pb-4 pt-3 grid md:grid-cols-2 gap-4 bg-muted/20">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Course Progress</p>
        {(data?.courses ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Not enrolled in any courses.</p> : (
          <div className="space-y-2">
            {(data?.courses ?? []).map((c: any) => (
              <div key={c.course_id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="truncate pr-2">{c.courses?.title}</span>
                  <span className="text-muted-foreground shrink-0">{c.completed}/{c.total}</span>
                </div>
                <Progress value={c.pct} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Token History</p>
        {(data?.txs ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No transactions.</p> : (
          <div className="space-y-1">
            {(data?.txs ?? []).map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 text-xs">
                <span className={`font-mono font-bold ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</span>
                <Badge variant="outline" className="text-[10px] capitalize">{t.type}</Badge>
                <span className="text-muted-foreground truncate flex-1">{t.description ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── CURRICULUM ────────────────────────────────────────────────────────────── */
function CurriculumTab() {
  return (
    <Tabs defaultValue="courses">
      <TabsList className="mb-4 bg-muted/40 border border-border">
        <TabsTrigger value="courses"><BookOpen className="h-4 w-4 mr-1" />Courses</TabsTrigger>
        <TabsTrigger value="lessons"><Layers className="h-4 w-4 mr-1" />Lessons</TabsTrigger>
      </TabsList>
      <TabsContent value="courses"><CoursesAdmin /></TabsContent>
      <TabsContent value="lessons"><LessonsAdmin /></TabsContent>
    </Tabs>
  )
}

function CoursesAdmin() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', level: 'beginner', category_id: '', thumbnail_url: '', duration_minutes: 0, token_cost: 0, published: false })

  const { data: courses } = useQuery({ queryKey: ['admin-courses'], queryFn: () => getAllCoursesAdmin() })
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() })

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', level: 'beginner', category_id: '', thumbnail_url: '', duration_minutes: 0, token_cost: 0, published: false }); setOpen(true) }
  const openEdit = (c: any) => { setEditing(c); setForm({ title: c.title, description: c.description ?? '', level: c.level, category_id: c.category_id ?? '', thumbnail_url: c.thumbnail_url ?? '', duration_minutes: c.duration_minutes ?? 0, token_cost: c.token_cost ?? 0, published: !!c.published }); setOpen(true) }

  const save = useMutation({
    mutationFn: () => upsertCourse({ data: { ...form, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['admin-courses'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteCourse({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-courses'] }) },
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New course</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit course' : 'New course'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category_id || 'none'} onValueChange={(v) => setForm({ ...form, category_id: v === 'none' ? '' : v })}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label>Token cost <span className="text-muted-foreground">(0 = free)</span></Label><Input type="number" min={0} value={form.token_cost} onChange={(e) => setForm({ ...form, token_cost: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3"><Label>Published</Label><Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} /></div>
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
                {c.token_cost > 0 && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs"><Coins className="h-3 w-3 mr-1" />{c.token_cost}</Badge>}
                {c.published ? <Badge className="bg-primary/15 text-primary text-xs">Live</Badge> : <Badge className="bg-muted text-xs">Draft</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{c.description}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this course and all its lessons?')) del.mutate(c.id) }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(courses ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No courses yet.</div>}
      </div>
    </div>
  )
}

function LessonsAdmin() {
  const qc = useQueryClient()
  const [courseId, setCourseId] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', video_url: '', content: '', position: 1, duration_minutes: 0 })

  const { data: courses } = useQuery({ queryKey: ['admin-courses-min'], queryFn: () => getAllCoursesAdmin() })
  const { data: lessons } = useQuery({ queryKey: ['admin-lessons', courseId], enabled: !!courseId, queryFn: () => getLessons({ data: { courseId } }) })

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', video_url: '', content: '', position: (lessons?.length ?? 0) + 1, duration_minutes: 0 }); setOpen(true) }
  const openEdit = (l: any) => { setEditing(l); setForm({ title: l.title, description: l.description ?? '', video_url: l.video_url ?? '', content: l.content ?? '', position: l.position, duration_minutes: l.duration_minutes ?? 0 }); setOpen(true) }

  const save = useMutation({
    mutationFn: () => upsertLesson({ data: { ...form, course_id: courseId, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['admin-lessons'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteLesson({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-lessons'] }) },
  })

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="max-w-sm"><SelectValue placeholder="Pick a course…" /></SelectTrigger>
          <SelectContent>{(courses ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
        {courseId && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto"><Plus className="h-4 w-4 mr-1" />New lesson</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Edit lesson' : 'New lesson'}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                <div className="space-y-1.5"><Label>Video URL (YouTube / Vimeo)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=…" /></div>
                <div className="space-y-1.5"><Label>Written content / notes</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} /></div>
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
            <span className="grid h-7 w-7 place-items-center rounded bg-muted text-xs shrink-0">{l.position}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{l.title}</div>
              <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                {l.video_url && <span className="text-primary">Video</span>}
                {l.content && <span className="text-primary">Notes</span>}
                {l.quiz && <span className="text-primary">Quiz</span>}
                {l.duration_minutes ? <span>{l.duration_minutes} min</span> : null}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) del.mutate(l.id) }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── CATEGORIES ────────────────────────────────────────────────────────────── */
function CategoriesAdmin() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', icon: '' })

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() })

  const openNew = () => { setEditing(null); setForm({ name: '', slug: '', description: '', icon: '' }); setOpen(true) }
  const openEdit = (c: any) => {
    setEditing(c)
    setForm({ name: c.name, slug: c.slug, description: c.description ?? '', icon: c.icon ?? '' })
    setOpen(true)
  }

  const save = useMutation({
    mutationFn: () => upsertCategory({ data: { ...form, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['categories'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['categories'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Cannot delete — courses exist in this category'),
  })

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Categories organise the curriculum into modules. Deleting a category with courses is blocked.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => {
                  const name = e.target.value
                  setForm((f) => ({ ...f, name, slug: editing ? f.slug : autoSlug(name) }))
                }} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug <span className="text-muted-foreground text-xs">(URL identifier)</span></Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. frontend-dev" />
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="space-y-1.5">
                <Label>Icon name <span className="text-muted-foreground text-xs">(lucide icon e.g. Sparkles, Layout, Brain)</span></Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Sparkles" />
              </div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim() || !form.slug.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(categories ?? []).map((c: any) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display font-bold">{c.name}</div>
                <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{c.slug}</code>
              </div>
              {c.icon && <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
            </div>
            <p className="text-xs text-muted-foreground flex-1">{c.description ?? '—'}</p>
            <div className="flex gap-2 mt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete category? This fails if courses exist in it.')) del.mutate(c.id) }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {(categories ?? []).length === 0 && <div className="col-span-3 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No categories yet.</div>}
      </div>
    </div>
  )
}

/* ── EXAMS ─────────────────────────────────────────────────────────────────── */
function ExamsTab() {
  const qc = useQueryClient()
  const [selectedCat, setSelectedCat] = useState('')
  const [questions, setQuestions] = useState<{ q: string; options: string[]; answer: number }[]>([])
  const [passScore, setPassScore] = useState(70)
  const [examTitle, setExamTitle] = useState('Final Exam')

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories() })
  const { data: exam } = useQuery({ queryKey: ['admin-exam', selectedCat], enabled: !!selectedCat, queryFn: () => getAdminExam({ data: { categoryId: selectedCat } }) })

  useEffect(() => {
    if (exam) { setQuestions((exam as any).questions ?? []); setPassScore((exam as any).pass_score); setExamTitle((exam as any).title) }
    else { setQuestions([]); setPassScore(70); setExamTitle('Final Exam') }
  }, [exam])

  const save = useMutation({
    mutationFn: () => upsertExam({ data: { id: (exam as any)?.id, categoryId: selectedCat, title: examTitle, questions, passScore } }),
    onSuccess: () => { toast.success('Exam saved'); qc.invalidateQueries({ queryKey: ['admin-exam'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  return (
    <div className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <Label>Module</Label>
        <Select value={selectedCat} onValueChange={setSelectedCat}>
          <SelectTrigger><SelectValue placeholder="Select a module…" /></SelectTrigger>
          <SelectContent>{(categories ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {selectedCat && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Exam title</Label><Input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Pass score (%)</Label><Input type="number" min={1} max={100} value={passScore} onChange={(e) => setPassScore(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-4">
            {questions.map((q, qi) => (
              <div key={qi} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">Q{qi + 1}</span>
                  <Input value={q.q} onChange={(e) => setQuestions((p) => p.map((x, i) => i === qi ? { ...x, q: e.target.value } : x))} placeholder="Question text…" className="flex-1" />
                  <Button size="icon" variant="ghost" onClick={() => setQuestions((p) => p.filter((_, i) => i !== qi))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${qi}`} checked={q.answer === oi} onChange={() => setQuestions((p) => p.map((x, i) => i === qi ? { ...x, answer: oi } : x))} className="accent-primary shrink-0" />
                      <Input value={opt} onChange={(e) => setQuestions((p) => p.map((x, i) => i === qi ? { ...x, options: x.options.map((o, j) => j === oi ? e.target.value : o) } : x))} placeholder={`Option ${String.fromCharCode(65 + oi)}…`} />
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">Select the radio next to the correct answer.</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setQuestions((p) => [...p, { q: '', options: ['', '', '', ''], answer: 0 }])}><Plus className="h-4 w-4 mr-1" />Add question</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || questions.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90">Save exam</Button>
          </div>
        </>
      )}
    </div>
  )
}

/* ── PAYMENTS ──────────────────────────────────────────────────────────────── */
function PaymentsTab() {
  return (
    <Tabs defaultValue="packages">
      <TabsList className="mb-4 bg-muted/40 border border-border">
        <TabsTrigger value="packages"><Package className="h-4 w-4 mr-1" />Token Packages</TabsTrigger>
        <TabsTrigger value="transactions"><DollarSign className="h-4 w-4 mr-1" />Transactions</TabsTrigger>
      </TabsList>
      <TabsContent value="packages"><PackagesAdmin /></TabsContent>
      <TabsContent value="transactions"><TransactionsAdmin /></TabsContent>
    </Tabs>
  )
}

function PackagesAdmin() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', tokens: 1, price_kes: 50, description: '', badge: '', active: true })

  const { data: packages } = useQuery({ queryKey: ['admin-packages'], queryFn: () => getTokenPackages() })

  const openNew = () => { setEditing(null); setForm({ name: '', tokens: 1, price_kes: 50, description: '', badge: '', active: true }); setOpen(true) }
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, tokens: p.tokens, price_kes: p.price_kes, description: p.description ?? '', badge: p.badge ?? '', active: !!p.active }); setOpen(true) }

  const save = useMutation({
    mutationFn: () => upsertTokenPackage({ data: { ...form, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['admin-packages'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteTokenPackage({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-packages'] }) },
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New package</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit package' : 'New token package'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Badge label</Label><Input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. Best Value" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Tokens</Label><Input type="number" min={1} value={form.tokens} onChange={(e) => setForm({ ...form, tokens: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label>Price (KES)</Label><Input type="number" min={0} value={form.price_kes} onChange={(e) => setForm({ ...form, price_kes: Number(e.target.value) })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Active (visible to students)</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
            </div>
            <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending || !form.name.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(packages ?? []).map((p: any) => (
          <div key={p.id} className={`relative rounded-2xl border bg-card p-5 flex flex-col gap-3 ${p.active ? 'border-border' : 'border-dashed border-border opacity-60'}`}>
            {p.badge && <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-xs">{p.badge}</Badge>}
            <div><div className="font-display text-lg font-bold">{p.name}</div><div className="text-muted-foreground text-sm">{p.description}</div></div>
            <div className="flex items-end gap-1"><span className="font-display text-3xl font-bold">KES {p.price_kes}</span></div>
            <div className="flex items-center gap-1 text-sm text-primary font-medium"><Coins className="h-4 w-4" /> {p.tokens} token{p.tokens !== 1 ? 's' : ''}</div>
            <div className="flex gap-2 mt-auto">
              <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1"><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete?')) del.mutate(p.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
      {(packages ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No token packages yet.</div>}
    </div>
  )
}

function TransactionsAdmin() {
  const [typeFilter, setTypeFilter] = useState('all')
  const { data: txs } = useQuery({
    queryKey: ['admin-transactions', typeFilter],
    queryFn: () => getAdminTransactions({ data: { type: typeFilter } }),
  })

  const totalRevenue = (txs ?? []).filter((t: any) => t.type === 'purchase' && t.amount > 0).length
  const totalGranted = (txs ?? []).filter((t: any) => t.type === 'grant').reduce((s: number, t: any) => s + t.amount, 0)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Purchase Events', value: totalRevenue },
          { label: 'Tokens Granted', value: totalGranted.toLocaleString() },
          { label: 'Total Transactions', value: (txs ?? []).length },
        ].map((c) => (
          <Card key={c.label} className="card-glass border-border">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</div>
              <div className="mt-1 font-display text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        {['all', 'purchase', 'grant', 'usage', 'refund', 'admin_adjust'].map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 rounded-full text-sm border transition capitalize ${typeFilter === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-2">
        {(txs ?? []).map((t: any) => (
          <div key={t.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.amount > 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              {t.amount > 0 ? <TrendingUp className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{t.profiles?.display_name ?? 'Unknown'}</span>
                <Badge variant="outline" className="capitalize text-xs">{t.type}</Badge>
              </div>
              <div className="text-xs text-muted-foreground truncate">{t.description ?? '—'}</div>
            </div>
            <div className={`text-sm font-mono font-bold shrink-0 ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>{t.amount > 0 ? '+' : ''}{t.amount}</div>
            <div className="text-xs text-muted-foreground shrink-0">{format(new Date(t.created_at as string), 'MMM d, HH:mm')}</div>
          </div>
        ))}
        {(txs ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No transactions yet.</div>}
      </div>
    </div>
  )
}

/* ── RESEARCH ──────────────────────────────────────────────────────────────── */
function ResearchAdmin() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', cover_image_url: '', tags: '', published: false })

  const { data: articles } = useQuery({ queryKey: ['admin-research'], queryFn: () => getAdminResearch() })

  const openNew = () => { setEditing(null); setForm({ title: '', excerpt: '', content: '', cover_image_url: '', tags: '', published: false }); setOpen(true) }
  const openEdit = (a: any) => { setEditing(a); setForm({ title: a.title, excerpt: a.excerpt ?? '', content: a.content, cover_image_url: a.cover_image_url ?? '', tags: (a.tags ?? []).join(', '), published: !!a.published }); setOpen(true) }

  const save = useMutation({
    mutationFn: () => upsertResearchArticle({ data: { ...form, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['admin-research'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteResearchArticle({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-research'] }) },
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New article</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit article' : 'New article'}</DialogTitle></DialogHeader>
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
              <div className="flex items-center gap-2"><span className="font-medium">{a.title}</span>{a.published ? <Badge className="bg-primary/15 text-primary text-xs">Live</Badge> : <Badge className="bg-muted text-xs">Draft</Badge>}</div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{a.excerpt}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) del.mutate(a.id) }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(articles ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No articles yet.</div>}
      </div>
    </div>
  )
}

/* ── RESOURCES ─────────────────────────────────────────────────────────────── */
function ResourcesAdmin() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ title: '', description: '', type: 'link', url: '' })

  const { data: items } = useQuery({ queryKey: ['admin-resources'], queryFn: () => getAdminResources() })

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', type: 'link', url: '' }); setOpen(true) }
  const openEdit = (r: any) => { setEditing(r); setForm({ title: r.title, description: r.description ?? '', type: r.type, url: r.url ?? '' }); setOpen(true) }

  const save = useMutation({
    mutationFn: () => upsertResource({ data: { ...form, id: editing?.id } }),
    onSuccess: () => { toast.success('Saved'); setOpen(false); qc.invalidateQueries({ queryKey: ['admin-resources'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const del = useMutation({
    mutationFn: (id: string) => deleteResource({ data: { id } }),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-resources'] }) },
  })

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4 mr-1" />New resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit resource' : 'New resource'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="cheatsheet">Cheat sheet</SelectItem>
                    <SelectItem value="article">Article</SelectItem>
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
            <Badge variant="outline" className="capitalize text-xs shrink-0">{r.type}</Badge>
            <div className="flex-1 min-w-0">
              <a href={r.url} target="_blank" rel="noopener" className="font-medium hover:text-primary">{r.title}</a>
              <div className="text-xs text-muted-foreground truncate">{r.description}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) del.mutate(r.id) }}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {(items ?? []).length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No resources yet.</div>}
      </div>
    </div>
  )
}

/* ── COMMUNITY ─────────────────────────────────────────────────────────────── */
function CommunityAdmin() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: posts } = useQuery({ queryKey: ['admin-community-posts'], queryFn: () => getCommunityPostsAdmin() })

  const del = useMutation({
    mutationFn: (id: string) => deletePost({ data: { id } }),
    onSuccess: () => { toast.success('Post deleted'); qc.invalidateQueries({ queryKey: ['admin-community-posts'] }) },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed'),
  })

  const filtered = (posts ?? []).filter((p: any) =>
    !search ||
    (p.title as string).toLowerCase().includes(search.toLowerCase()) ||
    (p.author_name as string ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.author_email as string ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts or authors…" className="max-w-sm" />
        <Badge variant="secondary" className="self-center">{filtered.length} posts</Badge>
      </div>
      <div className="space-y-2">
        {filtered.map((p: any) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {(p.author_name ?? '?').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-muted-foreground">by {p.author_name ?? 'Unknown'} ({p.author_email})</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {formatDistanceToNow(new Date(p.created_at as string), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.content}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => { if (confirm('Delete this post?')) del.mutate(p.id as string) }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No community posts yet.</div>}
      </div>
    </div>
  )
}
