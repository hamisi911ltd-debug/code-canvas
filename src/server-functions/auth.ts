'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  deleteSession,
  ensureAdminRole,
  type SessionUser,
} from '@/lib/auth'

const SESSION_COOKIE = 'vl_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60

export const getAuthState = createServerFn({ method: 'GET' }).handler(async (): Promise<SessionUser | null> => {
  const sid = getCookie(SESSION_COOKIE)
  return getSession(sid)
})

export const signUpFn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { email: string; password: string; displayName: string })
  .handler(async ({ data }): Promise<SessionUser> => {
    const { email, password, displayName } = data
    const db = getDB()

    const existing = await db.prepare('SELECT id FROM users WHERE email = ? COLLATE NOCASE').bind(email).first()
    if (existing) throw new Error('An account with this email already exists.')

    const id = newId()
    const passwordHash = await hashPassword(password)
    await db
      .prepare('INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)')
      .bind(id, email.toLowerCase(), passwordHash, displayName || null)
      .run()

    await ensureAdminRole(id, email)

    const sessionId = await createSession(id)
    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    })

    const isAdmin = email.toLowerCase() === 'gakwelihamisi@gmail.com'
    return { id, email: email.toLowerCase(), display_name: displayName || null, isAdmin }
  })

export const signInFn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { email: string; password: string })
  .handler(async ({ data }): Promise<SessionUser> => {
    const { email, password } = data
    const db = getDB()

    const user = await db
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .bind(email)
      .first<{ id: string; email: string; password_hash: string; display_name: string | null }>()
    if (!user) throw new Error('No account found with that email.')

    const ok = await verifyPassword(password, user.password_hash)
    if (!ok) throw new Error('Incorrect password.')

    await ensureAdminRole(user.id, user.email)

    const sessionId = await createSession(user.id)
    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    })

    const isAdmin = user.email.toLowerCase() === 'gakwelihamisi@gmail.com'
    return { id: user.id, email: user.email, display_name: user.display_name, isAdmin }
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(async (): Promise<null> => {
  const sid = getCookie(SESSION_COOKIE)
  if (sid) await deleteSession(sid)
  deleteCookie(SESSION_COOKIE, { path: '/' })
  return null
})
