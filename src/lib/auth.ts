import { getDB, newId } from '@/db/index'
import { getCfEnv } from './cf-context'

const DEFAULT_ADMIN_EMAIL = 'gakwelihamisi@gmail.com'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export function isAdminEmail(email: string): boolean {
  const adminEmail = getCfEnv().ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL
  return email.toLowerCase() === adminEmail.toLowerCase()
}

export interface SessionUser {
  id: string
  email: string
  display_name: string | null
  isAdmin: boolean
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
    key,
    256,
  )
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const hashHex = Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [saltHex, hashHex] = stored.split(':')
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
      key,
      256,
    )
    const newHash = Array.from(new Uint8Array(bits))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    return newHash === hashHex
  } catch {
    return false
  }
}

export async function createSession(userId: string): Promise<string> {
  const db = getDB()
  const sessionId = newId() + newId()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  await db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, userId, expiresAt).run()
  return sessionId
}

export async function getSession(sessionId: string | null | undefined): Promise<SessionUser | null> {
  if (!sessionId) return null
  const db = getDB()
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.display_name,
        EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role = 'admin') AS is_admin
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > datetime('now')`,
    )
    .bind(sessionId)
    .first<{ id: string; email: string; display_name: string | null; is_admin: number }>()
  if (!row) return null
  return { id: row.id, email: row.email, display_name: row.display_name, isAdmin: !!row.is_admin }
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB()
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
}


export async function ensureAdminRole(userId: string, email: string): Promise<void> {
  if (!isAdminEmail(email)) return
  const db = getDB()
  await db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, ?)').bind(userId, 'admin').run()
}
