'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getSession, type SessionUser } from '@/lib/auth'

function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback
  } catch {
    return fallback
  }
}

async function requireAuth(): Promise<SessionUser> {
  const sid = getCookie('vl_session')
  const user = await getSession(sid)
  if (!user) throw new Error('Not authenticated')
  return user
}

async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()
  if (!user.isAdmin) throw new Error('Admin access required')
  return user
}

// ── CATEGORIES ──────────────────────────────────────────────────────────────

export const getCategories = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM categories ORDER BY name').all()
  return (results ?? []) as Array<{ id: string; name: string; slug: string; description: string | null; icon: string | null }>
})

// ── COURSES ─────────────────────────────────────────────────────────────────

export const getCourses = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { categorySlug?: string })
  .handler(async ({ data }) => {
    const db = getDB()
    let q = `SELECT c.*, cat.name as category_name, cat.slug as category_slug
             FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
             WHERE c.published = 1`
    const params: unknown[] = []
    if (data.categorySlug) {
      q += ' AND cat.slug = ?'
      params.push(data.categorySlug)
    }
    q += ' ORDER BY c.created_at DESC'
    const { results } = await db.prepare(q).bind(...params).all<Record<string, unknown>>()
    return (results ?? []).map((r) => ({
      ...r,
      published: !!r.published,
      categories: r.category_name ? { name: r.category_name, slug: r.category_slug } : null,
    }))
  })

export const getCourse = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { slug: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const course = await db
      .prepare(
        `SELECT c.*, cat.name as category_name, cat.slug as category_slug
         FROM courses c LEFT JOIN categories cat ON c.category_id = cat.id
         WHERE c.slug = ? AND c.published = 1`,
      )
      .bind(data.slug)
      .first<Record<string, unknown>>()
    if (!course) return null
    const { results: lessons } = await db
      .prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY position')
      .bind(course.id)
      .all()
    return {
      ...course,
      id: String(course.id),
      published: !!course.published,
      categories: course.category_name ? { name: course.category_name, slug: course.category_slug } : null,
      lessons: (lessons ?? []).map((l: any) => ({ ...l, id: String(l.id) })),
    }
  })

export const getAllCoursesAdmin = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT c.*, cat.name as category_name FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id ORDER BY c.created_at DESC`,
    )
    .all<Record<string, unknown>>()
  return (results ?? []).map((r) => ({
    ...r,
    published: !!r.published,
    categories: r.category_name ? { name: r.category_name } : null,
  }))
})

export const upsertCourse = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as {
        id?: string
        title: string
        description: string
        level: string
        category_id: string
        thumbnail_url: string
        duration_minutes: number
        token_cost: number
        published: boolean
      },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (data.id) {
      await db
        .prepare(
          `UPDATE courses SET title=?,description=?,level=?,category_id=?,thumbnail_url=?,duration_minutes=?,token_cost=?,published=? WHERE id=?`,
        )
        .bind(data.title, data.description, data.level, data.category_id || null, data.thumbnail_url || null, data.duration_minutes, data.token_cost, data.published ? 1 : 0, data.id)
        .run()
    } else {
      const id = newId()
      await db
        .prepare(
          `INSERT INTO courses (id,title,slug,description,level,category_id,thumbnail_url,duration_minutes,token_cost,published) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        )
        .bind(id, data.title, slug, data.description, data.level, data.category_id || null, data.thumbnail_url || null, data.duration_minutes, data.token_cost, data.published ? 1 : 0)
        .run()
    }
  })

export const deleteCourse = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM courses WHERE id = ?').bind(data.id).run()
  })

// ── LESSONS ─────────────────────────────────────────────────────────────────

export const getLessons = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const { results } = await db
      .prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY position')
      .bind(data.courseId)
      .all()
    return results ?? []
  })

export const upsertLesson = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as {
        id?: string
        course_id: string
        title: string
        description: string
        video_url: string
        content: string
        position: number
        duration_minutes: number
      },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.id) {
      await db
        .prepare(`UPDATE lessons SET title=?,description=?,video_url=?,content=?,position=?,duration_minutes=? WHERE id=?`)
        .bind(data.title, data.description || null, data.video_url || null, data.content || null, data.position, data.duration_minutes, data.id)
        .run()
    } else {
      const id = newId()
      await db
        .prepare(`INSERT INTO lessons (id,course_id,title,description,video_url,content,position,duration_minutes) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(id, data.course_id, data.title, data.description || null, data.video_url || null, data.content || null, data.position, data.duration_minutes)
        .run()
    }
  })

export const deleteLesson = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM lessons WHERE id = ?').bind(data.id).run()
  })

// ── ENROLLMENTS ─────────────────────────────────────────────────────────────

export const getEnrollment = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    return db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, data.courseId).first()
  })

export const enroll = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db.prepare('INSERT OR IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)').bind(newId(), user.id, data.courseId).run()
  })

// ── LESSON PROGRESS ─────────────────────────────────────────────────────────

export const getLessonProgress = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { lessonIds: string[] })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    if (!data.lessonIds.length) return [] as string[]
    const ph = data.lessonIds.map(() => '?').join(',')
    const { results } = await db
      .prepare(`SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND lesson_id IN (${ph})`)
      .bind(user.id, ...data.lessonIds)
      .all<{ lesson_id: string }>()
    return (results ?? []).map((r) => r.lesson_id)
  })

export const markLessonComplete = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { lessonId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db.prepare('INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)').bind(user.id, data.lessonId).run()
  })

// ── DASHBOARD ────────────────────────────────────────────────────────────────

export const getDashboard = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const user = await requireAuth()
  const db = getDB()
  const [enrollRes, tokenRow, certRow] = await Promise.all([
    db
      .prepare(
        `SELECT e.course_id, e.enrolled_at, c.title, c.slug, c.level,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
          (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id WHERE lp.user_id = ? AND l.course_id = c.id) as completed_lessons
         FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`,
      )
      .bind(user.id, user.id)
      .all<Record<string, unknown>>(),
    db.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM token_transactions WHERE user_id = ?').bind(user.id).first<{ balance: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM certifications WHERE user_id = ?').bind(user.id).first<{ count: number }>(),
  ])

  const courses = (enrollRes.results ?? []).map((e) => ({
    course_id: e.course_id,
    enrolled_at: e.enrolled_at,
    courses: { title: e.title, slug: e.slug, level: e.level },
    total: Number(e.total_lessons),
    completed: Number(e.completed_lessons),
    pct: e.total_lessons ? Math.round((Number(e.completed_lessons) / Number(e.total_lessons)) * 100) : 0,
  }))

  return {
    courses,
    tokenBalance: tokenRow?.balance ?? 0,
    certificates: certRow?.count ?? 0,
  }
})

// ── LIBRARY ──────────────────────────────────────────────────────────────────

export const getLibraryModules = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const db = getDB()
  const { results: categories } = await db.prepare('SELECT * FROM categories ORDER BY name').all<Record<string, unknown>>()
  const modules = await Promise.all(
    (categories ?? []).map(async (cat) => {
      const [videos, notes, resources] = await Promise.all([
        db
          .prepare(
            `SELECT COUNT(*) as count FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.category_id = ? AND l.video_url IS NOT NULL`,
          )
          .bind(cat.id)
          .first<{ count: number }>(),
        db
          .prepare(
            `SELECT COUNT(*) as count FROM lessons l JOIN courses c ON l.course_id = c.id WHERE c.category_id = ? AND l.content IS NOT NULL`,
          )
          .bind(cat.id)
          .first<{ count: number }>(),
        db
          .prepare(`SELECT COUNT(*) as count FROM resources r JOIN courses c ON r.course_id = c.id WHERE c.category_id = ?`)
          .bind(cat.id)
          .first<{ count: number }>(),
      ])
      return { ...cat, videoCount: videos?.count ?? 0, notesCount: notes?.count ?? 0, resourceCount: resources?.count ?? 0 }
    }),
  )
  return modules
})

export const getModuleDetail = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { slug: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const category = await db.prepare('SELECT * FROM categories WHERE slug = ?').bind(data.slug).first<Record<string, unknown>>()
    if (!category) return null

    const { results: courses } = await db
      .prepare('SELECT id FROM courses WHERE category_id = ? AND published = 1')
      .bind(category.id)
      .all<{ id: string }>()
    const courseIds = (courses ?? []).map((c) => c.id)

    if (!courseIds.length) {
      return { category, videoLessons: [], noteLessons: [], resources: [], quizLessons: [], exam: null }
    }

    const ph = courseIds.map(() => '?').join(',')
    const [vRes, nRes, rRes, qRes, exam] = await Promise.all([
      db
        .prepare(`SELECT l.*, c.title as course_title, c.slug as course_slug FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.course_id IN (${ph}) AND l.video_url IS NOT NULL ORDER BY l.position`)
        .bind(...courseIds)
        .all<Record<string, unknown>>(),
      db
        .prepare(`SELECT l.*, c.title as course_title, c.slug as course_slug FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.course_id IN (${ph}) AND l.content IS NOT NULL ORDER BY l.position`)
        .bind(...courseIds)
        .all<Record<string, unknown>>(),
      db
        .prepare(`SELECT r.*, c.title as course_title, c.slug as course_slug FROM resources r JOIN courses c ON r.course_id = c.id WHERE r.course_id IN (${ph}) ORDER BY r.created_at DESC`)
        .bind(...courseIds)
        .all<Record<string, unknown>>(),
      db
        .prepare(`SELECT l.*, c.title as course_title, c.slug as course_slug FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.course_id IN (${ph}) AND l.quiz IS NOT NULL ORDER BY l.position`)
        .bind(...courseIds)
        .all<Record<string, unknown>>(),
      db.prepare('SELECT * FROM module_exams WHERE category_id = ?').bind(category.id).first<Record<string, unknown>>(),
    ])

    const mapLesson = (l: Record<string, unknown>) => ({
      ...l,
      courses: { title: l.course_title, slug: l.course_slug },
      quiz: parseJSON(l.quiz as string, null),
    })

    const quizLessons = (qRes.results ?? []).map(mapLesson)

    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)
    let quizResults: Record<string, { score: number; passed: boolean }> = {}
    let certification: Record<string, unknown> | null = null

    if (sessionUser && quizLessons.length) {
      const lessonIds = quizLessons.map((l) => l.id as string)
      const phq = lessonIds.map(() => '?').join(',')
      const [qrRes, certRes] = await Promise.all([
        db
          .prepare(`SELECT lesson_id, score, passed FROM quiz_results WHERE user_id = ? AND lesson_id IN (${phq})`)
          .bind(sessionUser.id, ...lessonIds)
          .all<{ lesson_id: string; score: number; passed: number }>(),
        db
          .prepare('SELECT * FROM certifications WHERE user_id = ? AND category_id = ?')
          .bind(sessionUser.id, category.id)
          .first<Record<string, unknown>>(),
      ])
      quizResults = Object.fromEntries(
        (qrRes.results ?? []).map((r) => [r.lesson_id, { score: r.score, passed: !!r.passed }]),
      )
      certification = certRes ?? null
    } else if (sessionUser) {
      certification =
        (await db
          .prepare('SELECT * FROM certifications WHERE user_id = ? AND category_id = ?')
          .bind(sessionUser.id, category.id)
          .first<Record<string, unknown>>()) ?? null
    }

    return {
      category,
      videoLessons: (vRes.results ?? []).map(mapLesson),
      noteLessons: (nRes.results ?? []).map(mapLesson),
      resources: (rRes.results ?? []).map((r) => ({ ...r, courses: { title: r.course_title, slug: r.course_slug } })),
      quizLessons,
      exam: exam ? { ...exam, questions: parseJSON(exam.questions as string, []) } : null,
      quizResults,
      certification: certification ?? null,
    }
  })

// ── TOKENS ───────────────────────────────────────────────────────────────────

export const getTokenBalance = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const user = await requireAuth()
  const db = getDB()
  const row = await db
    .prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM token_transactions WHERE user_id = ?')
    .bind(user.id)
    .first<{ balance: number }>()
  return row?.balance ?? 0
})


export const getTokenPackages = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM token_packages WHERE active = 1 ORDER BY price_kes').all<Record<string, unknown>>()
  return (results ?? []).map((p) => ({ ...p, active: !!p.active }))
})

// ── RESEARCH ─────────────────────────────────────────────────────────────────

export const getResearchArticles = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const db = getDB()
  const { results } = await db
    .prepare('SELECT * FROM research_articles WHERE published = 1 ORDER BY created_at DESC')
    .all<Record<string, unknown>>()
  return (results ?? []).map((a) => ({ ...a, published: !!a.published, tags: parseJSON(a.tags as string, []) }))
})

export const getResearchArticle = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { slug: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const a = await db
      .prepare('SELECT * FROM research_articles WHERE slug = ? AND published = 1')
      .bind(data.slug)
      .first<Record<string, unknown>>()
    return a ? { ...a, published: !!a.published, tags: parseJSON(a.tags as string, []) } : null
  })

// ── COMMUNITY ────────────────────────────────────────────────────────────────

export const getCommunityPosts = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT p.*, u.display_name FROM community_posts p
       JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 50`,
    )
    .all<Record<string, unknown>>()
  return (results ?? []).map((p) => ({ ...p, profiles: { display_name: p.display_name } }))
})

export const createPost = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { title: string; content: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    if ((data.title?.trim()?.length ?? 0) < 3) throw new Error('Title must be at least 3 characters.')
    if ((data.content?.trim()?.length ?? 0) < 5) throw new Error('Content must be at least 5 characters.')
    const db = getDB()
    await db
      .prepare('INSERT INTO community_posts (id, user_id, title, content) VALUES (?, ?, ?, ?)')
      .bind(newId(), user.id, data.title.trim(), data.content.trim())
      .run()
  })

// ── ADMIN ────────────────────────────────────────────────────────────────────

export const getAdminStats = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const [students, courses, enrollments, completions] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM courses WHERE published = 1').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM enrollments').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM lesson_progress').first<{ count: number }>(),
  ])
  return {
    students: students?.count ?? 0,
    courses: courses?.count ?? 0,
    enrollments: enrollments?.count ?? 0,
    completions: completions?.count ?? 0,
  }
})

export const getRecentEnrollments = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT e.*, c.title as course_title, u.display_name FROM enrollments e
       JOIN courses c ON e.course_id = c.id JOIN users u ON e.user_id = u.id
       ORDER BY e.enrolled_at DESC LIMIT 8`,
    )
    .all<Record<string, unknown>>()
  return (results ?? []).map((e) => ({
    ...e,
    courses: { title: e.course_title },
    profiles: { display_name: e.display_name },
  }))
})

export const getAdminStudents = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT u.id, u.email, u.display_name, u.created_at,
        (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) as enroll_count,
        COALESCE((SELECT SUM(amount) FROM token_transactions t WHERE t.user_id = u.id), 0) as token_balance,
        EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = 'admin') as is_admin
       FROM users u ORDER BY u.created_at DESC`,
    )
    .all<Record<string, unknown>>()
  return (results ?? []).map((u) => ({
    ...u,
    isAdmin: !!u.is_admin,
    tokenBalance: Number(u.token_balance),
    enrollCount: Number(u.enroll_count),
  }))
})

export const toggleAdmin = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { userId: string; makeAdmin: boolean })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.makeAdmin) {
      await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').bind(data.userId, 'admin').run()
    } else {
      await db.prepare('DELETE FROM user_roles WHERE user_id = ? AND role = ?').bind(data.userId, 'admin').run()
    }
  })

export const grantTokens = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { userId: string; amount: number; note: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db
      .prepare('INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
      .bind(newId(), data.userId, data.amount, 'grant', data.note || `Admin grant of ${data.amount} tokens`)
      .run()
  })

export const getAdminTransactions = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { type?: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    let q = `SELECT t.*, u.display_name FROM token_transactions t JOIN users u ON t.user_id = u.id`
    const params: unknown[] = []
    if (data.type && data.type !== 'all') {
      q += ' WHERE t.type = ?'
      params.push(data.type)
    }
    q += ' ORDER BY t.created_at DESC LIMIT 100'
    const { results } = await db.prepare(q).bind(...params).all<Record<string, unknown>>()
    return (results ?? []).map((t) => ({ ...t, profiles: { display_name: t.display_name } }))
  })

export const upsertTokenPackage = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as { id?: string; name: string; tokens: number; price_kes: number; description: string; badge: string; active: boolean },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.id) {
      await db
        .prepare('UPDATE token_packages SET name=?,tokens=?,price_kes=?,description=?,badge=?,active=? WHERE id=?')
        .bind(data.name, data.tokens, data.price_kes, data.description || null, data.badge || null, data.active ? 1 : 0, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO token_packages (id,name,tokens,price_kes,description,badge,active) VALUES (?,?,?,?,?,?,?)')
        .bind(newId(), data.name, data.tokens, data.price_kes, data.description || null, data.badge || null, data.active ? 1 : 0)
        .run()
    }
  })

export const deleteTokenPackage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM token_packages WHERE id = ?').bind(data.id).run()
  })

export const getAdminExam = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { categoryId: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const exam = await db.prepare('SELECT * FROM module_exams WHERE category_id = ?').bind(data.categoryId).first<Record<string, unknown>>()
    return exam ? { ...exam, questions: parseJSON(exam.questions as string, []) } : null
  })

export const upsertExam = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as { id?: string; categoryId: string; title: string; questions: unknown[]; passScore: number },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const questionsJson = JSON.stringify(data.questions)
    if (data.id) {
      await db
        .prepare('UPDATE module_exams SET title=?,questions=?,pass_score=? WHERE id=?')
        .bind(data.title, questionsJson, data.passScore, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO module_exams (id,category_id,title,questions,pass_score) VALUES (?,?,?,?,?)')
        .bind(newId(), data.categoryId, data.title, questionsJson, data.passScore)
        .run()
    }
  })

export const getAdminResearch = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM research_articles ORDER BY created_at DESC').all<Record<string, unknown>>()
  return (results ?? []).map((a) => ({ ...a, published: !!a.published, tags: parseJSON(a.tags as string, []) }))
})

export const upsertResearchArticle = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as { id?: string; title: string; excerpt: string; content: string; cover_image_url: string; tags: string; published: boolean },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const tagsJson = JSON.stringify(
      data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    )
    if (data.id) {
      await db
        .prepare(
          `UPDATE research_articles SET title=?,excerpt=?,content=?,cover_image_url=?,tags=?,published=?,updated_at=datetime('now') WHERE id=?`,
        )
        .bind(data.title, data.excerpt || null, data.content, data.cover_image_url || null, tagsJson, data.published ? 1 : 0, data.id)
        .run()
    } else {
      await db
        .prepare(
          `INSERT INTO research_articles (id,title,slug,excerpt,content,cover_image_url,tags,published) VALUES (?,?,?,?,?,?,?,?)`,
        )
        .bind(newId(), data.title, slug, data.excerpt || null, data.content, data.cover_image_url || null, tagsJson, data.published ? 1 : 0)
        .run()
    }
  })

export const deleteResearchArticle = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM research_articles WHERE id = ?').bind(data.id).run()
  })

export const getAdminResources = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM resources ORDER BY created_at DESC').all()
  return results ?? []
})

export const upsertResource = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id?: string; title: string; description: string; type: string; url: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.id) {
      await db
        .prepare('UPDATE resources SET title=?,description=?,type=?,url=? WHERE id=?')
        .bind(data.title, data.description || null, data.type, data.url, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO resources (id,title,description,type,url) VALUES (?,?,?,?,?)')
        .bind(newId(), data.title, data.description || null, data.type, data.url)
        .run()
    }
  })

export const deleteResource = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM resources WHERE id = ?').bind(data.id).run()
  })

export const getStudentDetail = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { userId: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const [enrollRes, txRes] = await Promise.all([
      db.prepare(`
        SELECT e.course_id, e.enrolled_at, c.title, c.slug,
          (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as total_lessons,
          (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON lp.lesson_id = l.id WHERE lp.user_id = ? AND l.course_id = c.id) as completed_lessons
        FROM enrollments e JOIN courses c ON e.course_id = c.id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC
      `).bind(data.userId, data.userId).all<Record<string, unknown>>(),
      db.prepare('SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').bind(data.userId).all<Record<string, unknown>>(),
    ])
    const courses = (enrollRes.results ?? []).map((e) => ({
      course_id: e.course_id,
      courses: { title: e.title, slug: e.slug },
      total: Number(e.total_lessons),
      completed: Number(e.completed_lessons),
      pct: e.total_lessons ? Math.round((Number(e.completed_lessons) / Number(e.total_lessons)) * 100) : 0,
    }))
    return { courses, txs: txRes.results ?? [] }
  })

// ── CATEGORIES (admin) ───────────────────────────────────────────────────────

export const upsertCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id?: string; name: string; slug: string; description: string; icon: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.id) {
      await db
        .prepare('UPDATE categories SET name=?,slug=?,description=?,icon=? WHERE id=?')
        .bind(data.name, data.slug, data.description || null, data.icon || null, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO categories (id,name,slug,description,icon) VALUES (?,?,?,?,?)')
        .bind(newId(), data.name, data.slug, data.description || null, data.icon || null)
        .run()
    }
  })

export const deleteCategory = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM categories WHERE id=?').bind(data.id).run()
  })

// ── COMMUNITY (admin) ────────────────────────────────────────────────────────

export const getCommunityPostsAdmin = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  await requireAdmin()
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT p.*, u.display_name, u.email FROM community_posts p
       JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`,
    )
    .all<Record<string, unknown>>()
  return (results ?? []).map((p) => ({ ...p, author_name: p.display_name, author_email: p.email }))
})

export const deletePost = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM community_posts WHERE id=?').bind(data.id).run()
  })

// ── TRACKS / QUIZ / EXAM ──────────────────────────────────────────────────────

export const submitQuiz = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { lessonId: string; score: number; passed: boolean })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db
      .prepare('INSERT OR REPLACE INTO quiz_results (id, user_id, lesson_id, score, passed) VALUES (?, ?, ?, ?, ?)')
      .bind(newId(), user.id, data.lessonId, data.score, data.passed ? 1 : 0)
      .run()
  })

export const getQuizResult = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { lessonId: string })
  .handler(async ({ data }) => {
    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)
    if (!sessionUser) return null
    const db = getDB()
    const row = await db
      .prepare('SELECT score, passed FROM quiz_results WHERE user_id = ? AND lesson_id = ?')
      .bind(sessionUser.id, data.lessonId)
      .first<{ score: number; passed: number }>()
    return row ? { score: row.score, passed: !!row.passed } : null
  })

export const submitExam = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { categoryId: string; score: number })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db
      .prepare('INSERT OR REPLACE INTO certifications (id, user_id, category_id, score) VALUES (?, ?, ?, ?)')
      .bind(newId(), user.id, data.categoryId, data.score)
      .run()
  })

export const getCertifications = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const sid = getCookie('vl_session')
  const sessionUser = await getSession(sid)
  if (!sessionUser) return [] as Array<{ id: string; category_id: string; score: number; issued_at: string; categories: { name: string; slug: string; icon: string | null } }>
  const db = getDB()
  const { results } = await db
    .prepare(
      `SELECT cert.*, cat.name as category_name, cat.slug as category_slug, cat.icon as category_icon
       FROM certifications cert JOIN categories cat ON cert.category_id = cat.id
       WHERE cert.user_id = ? ORDER BY cert.issued_at DESC`,
    )
    .bind(sessionUser.id)
    .all<Record<string, unknown>>()
  return (results ?? []).map((c) => ({
    ...c,
    categories: { name: c.category_name as string, slug: c.category_slug as string, icon: c.category_icon as string | null },
  }))
})

export const getTrackData = createServerFn({ method: 'GET', strict: false })
  .inputValidator((d: unknown) => d as { trackSlug: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const category = await db.prepare('SELECT * FROM categories WHERE slug = ?').bind(data.trackSlug).first<Record<string, unknown>>()
    if (!category) return null

    const { results: coursesRaw } = await db
      .prepare('SELECT * FROM courses WHERE category_id = ? AND published = 1 ORDER BY created_at')
      .bind(category.id)
      .all<Record<string, unknown>>()

    const courseIds = (coursesRaw ?? []).map((c) => c.id as string)
    const lessonsByCourse: Record<string, Record<string, unknown>[]> = {}
    let allLessonIds: string[] = []

    if (courseIds.length) {
      const ph = courseIds.map(() => '?').join(',')
      const { results: lessonsRaw } = await db
        .prepare(`SELECT * FROM lessons WHERE course_id IN (${ph}) ORDER BY course_id, position`)
        .bind(...courseIds)
        .all<Record<string, unknown>>()
      for (const l of lessonsRaw ?? []) {
        const cid = l.course_id as string
        if (!lessonsByCourse[cid]) lessonsByCourse[cid] = []
        lessonsByCourse[cid].push({ ...l, quiz: parseJSON(l.quiz as string, null) })
        allLessonIds.push(l.id as string)
      }
    }

    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)
    let completedSet = new Set<string>()
    let certification: Record<string, unknown> | null = null
    let quizResultMap: Record<string, { score: number; passed: boolean }> = {}

    if (sessionUser && allLessonIds.length) {
      const ph2 = allLessonIds.map(() => '?').join(',')
      const [progRes, qrRes] = await Promise.all([
        db.prepare(`SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND lesson_id IN (${ph2})`).bind(sessionUser.id, ...allLessonIds).all<{ lesson_id: string }>(),
        db.prepare(`SELECT lesson_id, score, passed FROM quiz_results WHERE user_id = ? AND lesson_id IN (${ph2})`).bind(sessionUser.id, ...allLessonIds).all<{ lesson_id: string; score: number; passed: number }>(),
      ])
      completedSet = new Set((progRes.results ?? []).map((r) => r.lesson_id))
      quizResultMap = Object.fromEntries(
        (qrRes.results ?? []).map((r) => [r.lesson_id, { score: r.score, passed: !!r.passed }]),
      )
      certification = (await db.prepare('SELECT * FROM certifications WHERE user_id = ? AND category_id = ?').bind(sessionUser.id, category.id).first<Record<string, unknown>>()) ?? null
    }

    const exam = await db.prepare('SELECT * FROM module_exams WHERE category_id = ?').bind(category.id).first<Record<string, unknown>>()

    const courses = (coursesRaw ?? []).map((c) => {
      const lessons = lessonsByCourse[c.id as string] ?? []
      const completed = lessons.filter((l) => completedSet.has(l.id as string)).length
      return {
        ...c,
        published: !!(c.published),
        lessons,
        totalLessons: lessons.length,
        completedLessons: completed,
        pct: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
      }
    })

    const totalCompleted = allLessonIds.filter((id) => completedSet.has(id)).length
    return {
      category,
      courses,
      exam: exam ? { ...exam, questions: parseJSON(exam.questions as string, []) } : null,
      certification: certification ?? null,
      completedIds: Array.from(completedSet),
      quizResults: quizResultMap,
      totalLessons: allLessonIds.length,
      totalCompleted,
      overallPct: allLessonIds.length ? Math.round((totalCompleted / allLessonIds.length) * 100) : 0,
    }
  })
