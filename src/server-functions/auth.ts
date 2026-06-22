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
  isAdminEmail,
  type SessionUser,
} from '@/lib/auth'

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID ?? 'daily-progress-ad412'
const FIREBASE_WEB_API_KEY = process.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCTZjGb-WSk5-z4w4GakZ64VRl7cx_QD9c'

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

    return { id, email: email.toLowerCase(), display_name: displayName || null, isAdmin: isAdminEmail(email) }
  })

export const signInFn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { email: string; password: string })
  .handler(async ({ data }): Promise<SessionUser> => {
    const { email, password } = data
    const db = getDB()

    const user = await db
      .prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE')
      .bind(email)
      .first<{ id: string; email: string; password_hash: string | null; display_name: string | null }>()
    if (!user) throw new Error('No account found with that email.')
    if (!user.password_hash) throw new Error('This account signs in with Google. Use "Continue with Google" instead.')

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

    return { id: user.id, email: user.email, display_name: user.display_name, isAdmin: isAdminEmail(user.email) }
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(async (): Promise<null> => {
  const sid = getCookie(SESSION_COOKIE)
  if (sid) await deleteSession(sid)
  deleteCookie(SESSION_COOKIE, { path: '/' })
  return null
})

/** Verify a Firebase ID token using Google's token info endpoint */
async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string
  email: string
  name: string | null
  picture: string | null
} | null> {
  try {
    // Decode payload for basic claim checks (no signature verification yet)
    const parts = idToken.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null
    if (payload.aud !== FIREBASE_PROJECT_ID) return null
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null
    if (!payload.sub) return null

    // Verify via Firebase Auth REST API — exchange token to confirm it's genuine
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    )
    if (!res.ok) return null
    const data = await res.json() as { users?: Array<{ localId: string; email: string; displayName?: string; photoUrl?: string }> }
    const firebaseUser = data.users?.[0]
    if (!firebaseUser?.localId) return null

    return {
      uid: firebaseUser.localId,
      email: firebaseUser.email ?? payload.email ?? '',
      name: firebaseUser.displayName ?? payload.name ?? null,
      picture: firebaseUser.photoUrl ?? payload.picture ?? null,
    }
  } catch {
    return null
  }
}

export const googleSignInFn = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { idToken: string })
  .handler(async ({ data }): Promise<SessionUser> => {
    const { idToken } = data

    const googleUser = await verifyFirebaseToken(idToken)
    if (!googleUser) throw new Error('Invalid Google token. Please try again.')

    const db = getDB()

    // Upsert user — create if new, update display_name/photo if returning
    let user = await db
      .prepare('SELECT id, email, display_name FROM users WHERE firebase_uid = ?')
      .bind(googleUser.uid)
      .first<{ id: string; email: string; display_name: string | null }>()

    if (!user) {
      // Check if there's an existing email/password account with this email
      const existing = await db
        .prepare('SELECT id, email, display_name FROM users WHERE email = ? COLLATE NOCASE')
        .bind(googleUser.email)
        .first<{ id: string; email: string; display_name: string | null }>()

      if (existing) {
        // Link the Google account to the existing user
        await db
          .prepare('UPDATE users SET firebase_uid = ? WHERE id = ?')
          .bind(googleUser.uid, existing.id)
          .run()
        user = existing
      } else {
        // Brand new user — create account. password_hash is set to '' (not NULL) for
        // Google-only accounts so this insert works whether or not the column has been
        // relaxed to nullable yet — '' is falsy, so the password-login guard above still
        // correctly rejects password sign-in for these accounts either way.
        const id = newId()
        await db
          .prepare(
            'INSERT INTO users (id, email, password_hash, display_name, firebase_uid) VALUES (?, ?, ?, ?, ?)',
          )
          .bind(id, googleUser.email.toLowerCase(), '', googleUser.name, googleUser.uid)
          .run()
        user = { id, email: googleUser.email.toLowerCase(), display_name: googleUser.name }
      }
    }

    await ensureAdminRole(user.id, user.email)

    const sessionId = await createSession(user.id)
    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
    })

    return { id: user.id, email: user.email, display_name: user.display_name, isAdmin: isAdminEmail(user.email) }
  })
