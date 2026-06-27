'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getSession, type SessionUser } from '@/lib/auth'
import { getCfEnv } from '@/lib/cf-context'

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

export const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM categories ORDER BY name').all()
  return (results ?? []) as Array<{ id: string; name: string; slug: string; description: string | null; icon: string | null }>
})

// ── COURSES ─────────────────────────────────────────────────────────────────

export const getCourses = createServerFn({ method: 'GET' })
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

export const getCourse = createServerFn({ method: 'GET' })
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

// Resources, final exam, and certification for a course's module (category) — shown
// alongside the course's own lessons now that this content no longer lives in a separate Library.
export const getCourseExtras = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { courseId: string; categoryId: string | null })
  .handler(async ({ data }) => {
    const db = getDB()
    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)

    const [resourcesRes, quizResultsRes] = await Promise.all([
      db.prepare('SELECT * FROM resources WHERE course_id = ? ORDER BY created_at DESC').bind(data.courseId).all<Record<string, unknown>>(),
      sessionUser
        ? db
            .prepare(
              `SELECT qr.lesson_id, qr.score, qr.passed FROM quiz_results qr
               JOIN lessons l ON qr.lesson_id = l.id
               WHERE qr.user_id = ? AND l.course_id = ?`,
            )
            .bind(sessionUser.id, data.courseId)
            .all<{ lesson_id: string; score: number; passed: number }>()
        : Promise.resolve({ results: [] as { lesson_id: string; score: number; passed: number }[] }),
    ])
    const quizResults = Object.fromEntries(
      (quizResultsRes.results ?? []).map((r) => [r.lesson_id, { score: r.score, passed: !!r.passed }]),
    )

    if (!data.categoryId) {
      return { resources: resourcesRes.results ?? [], exam: null, certification: null, quizResults }
    }

    const [exam, certification] = await Promise.all([
      db.prepare('SELECT * FROM module_exams WHERE category_id = ?').bind(data.categoryId).first<Record<string, unknown>>(),
      sessionUser
        ? db.prepare('SELECT * FROM certifications WHERE user_id = ? AND category_id = ?').bind(sessionUser.id, data.categoryId).first<Record<string, unknown>>()
        : Promise.resolve(null),
    ])

    return {
      resources: resourcesRes.results ?? [],
      exam: exam ? { ...exam, questions: parseJSON(exam.questions as string, []) } : null,
      certification: certification ?? null,
      quizResults,
    }
  })

export const getAllCoursesAdmin = createServerFn({ method: 'GET' }).handler(async () => {
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

export const getLessons = createServerFn({ method: 'GET' })
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
        module_id?: string | null
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
        .prepare(`UPDATE lessons SET title=?,description=?,video_url=?,content=?,position=?,duration_minutes=?,module_id=? WHERE id=?`)
        .bind(data.title, data.description || null, data.video_url || null, data.content || null, data.position, data.duration_minutes, data.module_id || null, data.id)
        .run()
    } else {
      const id = newId()
      await db
        .prepare(`INSERT INTO lessons (id,course_id,module_id,title,description,video_url,content,position,duration_minutes) VALUES (?,?,?,?,?,?,?,?,?)`)
        .bind(id, data.course_id, data.module_id || null, data.title, data.description || null, data.video_url || null, data.content || null, data.position, data.duration_minutes)
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

// Generates a small illustrative cover image for a lesson via Cloudflare Workers AI
// (text-to-image) and caches it as a data URL on the lesson row. Requires the `AI`
// binding (see wrangler.jsonc) — only available once deployed/run against a real
// Cloudflare account, since there's no local emulation for Workers AI.
export const generateLessonImage = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { lessonId: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const env = getCfEnv()
    if (!env.AI) throw new Error('Workers AI binding not configured for this environment.')

    const lesson = await db
      .prepare('SELECT title, description FROM lessons WHERE id = ?')
      .bind(data.lessonId)
      .first<{ title: string; description: string | null }>()
    if (!lesson) throw new Error('Lesson not found')

    const topic = [lesson.title, lesson.description].filter(Boolean).join(' — ')
    const prompt = `Flat vector illustration for an online coding course lesson about "${topic}". Clean modern tech style, teal (#2dd4a8) and dark navy color palette, simple geometric shapes, no text, no words, no letters, no UI mockups.`

    const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', { prompt, steps: 6 } as never)
    const base64 = (result as unknown as { image: string }).image
    const dataUrl = `data:image/jpeg;base64,${base64}`

    await db.prepare('UPDATE lessons SET ai_image_url = ? WHERE id = ?').bind(dataUrl, data.lessonId).run()
    return { ai_image_url: dataUrl }
  })

// ── ENROLLMENTS ─────────────────────────────────────────────────────────────

export const getEnrollment = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    return db.prepare('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, data.courseId).first()
  })

// Enrolling is free — the paywall lives at the module level now (see unlockModule).
export const enroll = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db.prepare('INSERT OR IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)').bind(newId(), user.id, data.courseId).run()
  })

// ── MODULES ──────────────────────────────────────────────────────────────────

export const getModules = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { courseId: string })
  .handler(async ({ data }) => {
    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)
    const db = getDB()
    const { results } = await db
      .prepare(
        `SELECT m.*,
           (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) as lesson_count,
           EXISTS(SELECT 1 FROM module_unlocks u WHERE u.module_id = m.id AND u.user_id = ?) as unlocked
         FROM modules m WHERE m.course_id = ? ORDER BY m.position`,
      )
      .bind(sessionUser?.id ?? '', data.courseId)
      .all<Record<string, unknown>>()
    return (results ?? []).map((m) => ({ ...m, unlocked: !!m.unlocked }))
  })

export const upsertModule = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) =>
      d as { id?: string; course_id: string; title: string; description: string; position: number; token_cost: number },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    if (data.id) {
      await db
        .prepare('UPDATE modules SET title=?,description=?,position=?,token_cost=? WHERE id=?')
        .bind(data.title, data.description || null, data.position, data.token_cost, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO modules (id,course_id,title,description,position,token_cost) VALUES (?,?,?,?,?,?)')
        .bind(newId(), data.course_id, data.title, data.description || null, data.position, data.token_cost)
        .run()
    }
  })

export const deleteModule = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { id: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    await db.prepare('DELETE FROM modules WHERE id = ?').bind(data.id).run()
  })

// Learners can only unlock one new module per hour (across the whole platform) —
// already-unlocked modules stay freely accessible. Keeps pacing deliberate instead
// of letting someone token-dump through every module in one sitting.
const MODULE_UNLOCK_COOLDOWN_MS = 60 * 60 * 1000

export const getModuleUnlockCooldown = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireAuth()
  const db = getDB()
  const last = await db
    .prepare('SELECT unlocked_at FROM module_unlocks WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT 1')
    .bind(user.id)
    .first<{ unlocked_at: string }>()
  if (!last) return { remainingMs: 0 }
  const elapsed = Date.now() - new Date(last.unlocked_at.replace(' ', 'T') + 'Z').getTime()
  return { remainingMs: Math.max(0, MODULE_UNLOCK_COOLDOWN_MS - elapsed) }
})

export const unlockModule = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { moduleId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()

    const existing = await db.prepare('SELECT 1 FROM module_unlocks WHERE user_id = ? AND module_id = ?').bind(user.id, data.moduleId).first()
    if (existing) return

    const last = await db
      .prepare('SELECT unlocked_at FROM module_unlocks WHERE user_id = ? ORDER BY unlocked_at DESC LIMIT 1')
      .bind(user.id)
      .first<{ unlocked_at: string }>()
    if (last) {
      const elapsed = Date.now() - new Date(last.unlocked_at.replace(' ', 'T') + 'Z').getTime()
      if (elapsed < MODULE_UNLOCK_COOLDOWN_MS) {
        const minutesLeft = Math.ceil((MODULE_UNLOCK_COOLDOWN_MS - elapsed) / 60000)
        throw new Error(`You can only unlock one module per hour — try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`)
      }
    }

    const module_ = await db.prepare('SELECT token_cost FROM modules WHERE id = ?').bind(data.moduleId).first<{ token_cost: number }>()
    if (!module_) throw new Error('Module not found')

    const cost = module_.token_cost ?? 0
    if (cost > 0) {
      const row = await db.prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM token_transactions WHERE user_id = ?').bind(user.id).first<{ balance: number }>()
      const balance = row?.balance ?? 0
      if (balance < cost) throw new Error(`This module costs ${cost} token${cost === 1 ? '' : 's'} — you have ${balance}. Top up to unlock.`)
      await db
        .prepare('INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
        .bind(newId(), user.id, -cost, 'usage', `Unlocked module ${data.moduleId}`)
        .run()
    }

    await db.prepare('INSERT OR IGNORE INTO module_unlocks (user_id, module_id) VALUES (?, ?)').bind(user.id, data.moduleId).run()
  })

export const getModuleTest = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { moduleId: string })
  .handler(async ({ data }) => {
    const db = getDB()
    const test = await db.prepare('SELECT * FROM module_tests WHERE module_id = ?').bind(data.moduleId).first<Record<string, unknown>>()
    if (!test) return null
    return { ...test, questions: parseJSON(test.questions as string, []) }
  })

export const getAdminModuleTest = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { moduleId: string })
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const test = await db.prepare('SELECT * FROM module_tests WHERE module_id = ?').bind(data.moduleId).first<Record<string, unknown>>()
    return test ? { ...test, questions: parseJSON(test.questions as string, []) } : null
  })

export const upsertModuleTest = createServerFn({ method: 'POST' })
  .inputValidator(
    (d: unknown) => d as { id?: string; moduleId: string; title: string; questions: unknown[]; passScore: number },
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const db = getDB()
    const questionsJson = JSON.stringify(data.questions)
    if (data.id) {
      await db
        .prepare('UPDATE module_tests SET title=?,questions=?,pass_score=? WHERE id=?')
        .bind(data.title, questionsJson, data.passScore, data.id)
        .run()
    } else {
      await db
        .prepare('INSERT INTO module_tests (id,module_id,title,questions,pass_score) VALUES (?,?,?,?,?)')
        .bind(newId(), data.moduleId, data.title, questionsJson, data.passScore)
        .run()
    }
  })

export const submitModuleTest = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { moduleId: string; score: number; passed: boolean })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    await db
      .prepare('INSERT OR REPLACE INTO module_test_results (id, user_id, module_id, score, passed) VALUES (?, ?, ?, ?, ?)')
      .bind(newId(), user.id, data.moduleId, data.score, data.passed ? 1 : 0)
      .run()
  })

export const getModuleTestResult = createServerFn({ method: 'GET' })
  .inputValidator((d: unknown) => d as { moduleId: string })
  .handler(async ({ data }) => {
    const sid = getCookie('vl_session')
    const sessionUser = await getSession(sid)
    if (!sessionUser) return null
    const db = getDB()
    const row = await db
      .prepare('SELECT score, passed FROM module_test_results WHERE user_id = ? AND module_id = ?')
      .bind(sessionUser.id, data.moduleId)
      .first<{ score: number; passed: number }>()
    return row ? { score: row.score, passed: !!row.passed } : null
  })

// ── LESSON PROGRESS ─────────────────────────────────────────────────────────

export const getLessonProgress = createServerFn({ method: 'GET' })
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

export const getDashboard = createServerFn({ method: 'GET' }).handler(async () => {
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

  // Platform-wide graduation certificate — awarded once, the first time a
  // learner has fully completed 6 distinct courses (matches the platform's
  // current 6-course curriculum). Checked on every dashboard load so it's
  // issued automatically the moment the 6th course is finished.
  const COURSES_FOR_PLATFORM_CERT = 6
  const completedCourseCount = courses.filter((c) => c.pct === 100).length
  let platformCertificate = await db
    .prepare('SELECT * FROM platform_certificates WHERE user_id = ?')
    .bind(user.id)
    .first<Record<string, unknown>>()
  if (!platformCertificate && completedCourseCount >= COURSES_FOR_PLATFORM_CERT) {
    await db
      .prepare('INSERT OR IGNORE INTO platform_certificates (id, user_id, courses_completed) VALUES (?, ?, ?)')
      .bind(newId(), user.id, completedCourseCount)
      .run()
    platformCertificate = await db
      .prepare('SELECT * FROM platform_certificates WHERE user_id = ?')
      .bind(user.id)
      .first<Record<string, unknown>>()
  }

  return {
    courses,
    tokenBalance: tokenRow?.balance ?? 0,
    certificates: certRow?.count ?? 0,
    completedCourseCount,
    coursesForPlatformCert: COURSES_FOR_PLATFORM_CERT,
    platformCertificate,
  }
})

// ── TOKENS ───────────────────────────────────────────────────────────────────

export const getTokenBalance = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await requireAuth()
  const db = getDB()
  const row = await db
    .prepare('SELECT COALESCE(SUM(amount), 0) as balance FROM token_transactions WHERE user_id = ?')
    .bind(user.id)
    .first<{ balance: number }>()
  return row?.balance ?? 0
})


export const getTokenPackages = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDB()
  const { results } = await db.prepare('SELECT * FROM token_packages WHERE active = 1 ORDER BY price_kes').all<Record<string, unknown>>()
  return (results ?? []).map((p) => ({ ...p, active: !!p.active }))
})

// ── ADMIN ────────────────────────────────────────────────────────────────────

export const getAdminStats = createServerFn({ method: 'GET' }).handler(async () => {
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

export const getRecentEnrollments = createServerFn({ method: 'GET' }).handler(async () => {
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

export const getAdminStudents = createServerFn({ method: 'GET' }).handler(async () => {
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

export const getAdminTransactions = createServerFn({ method: 'GET' })
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

export const getAdminExam = createServerFn({ method: 'GET' })
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

export const getAdminResources = createServerFn({ method: 'GET' }).handler(async () => {
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

export const getStudentDetail = createServerFn({ method: 'GET' })
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

export const getQuizResult = createServerFn({ method: 'GET' })
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
