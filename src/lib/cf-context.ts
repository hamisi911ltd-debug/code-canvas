import { AsyncLocalStorage } from 'node:async_hooks'
import type { D1Database } from '@cloudflare/workers-types'

export type { D1Database }

export interface CfEnv {
  DB: D1Database
  INTASEND_SECRET_KEY: string
  INTASEND_PUBLISHABLE_KEY: string
  ADMIN_EMAIL: string
  [key: string]: unknown
}

const storage = new AsyncLocalStorage<CfEnv>()

export function runWithCfEnv<T>(env: CfEnv, fn: () => T): T {
  return storage.run(env, fn)
}

export function getCfEnv(): CfEnv {
  const env = storage.getStore()
  if (!env?.DB) throw new Error('Cloudflare D1 binding not available. Ensure wrangler.jsonc has a DB binding.')
  return env
}
