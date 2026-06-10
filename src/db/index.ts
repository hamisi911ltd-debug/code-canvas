import { getCfEnv } from '@/lib/cf-context'
import type { D1Database } from '@cloudflare/workers-types'

export type { D1Database }

export function getDB(): D1Database {
  return getCfEnv().DB
}

export function newId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
