'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getCfEnv } from '@/lib/cf-context'
import { getSession } from '@/lib/auth'

async function requireAuth() {
  const sid = getCookie('vl_session')
  const user = await getSession(sid)
  if (!user) throw new Error('Not authenticated')
  return user
}

// Payment is triggered client-side (intasend-inlinejs-sdk, see BuyTokens.tsx) and
// confirmed via IntaSend's webhook (src/server.ts) — this just reads the result.
export const getMpesaPaymentStatus = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { apiRef: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()

    const payment = await db
      .prepare('SELECT status FROM mpesa_payments WHERE api_ref = ? AND user_id = ?')
      .bind(data.apiRef, user.id)
      .first<{ status: 'pending' | 'complete' | 'failed' }>()

    return { status: payment?.status ?? ('pending' as const) }
  })

export const getIntaSendPublishableKey = createServerFn({ method: 'GET', strict: false }).handler(async () => {
  const env = getCfEnv()
  return {
    key: String(env.VITE_INTASEND_PUBLISHABLE_KEY ?? env.INTASEND_PUBLISHABLE_KEY ?? ''),
  }
})

export const devGrantTokens = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { tokens: number })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    const amount = Math.max(0, data.tokens)
    if (!amount) throw new Error('Token amount must be greater than 0')

    await db
      .prepare('INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
      .bind(newId(), user.id, amount, 'grant', `Local dev grant of ${amount} tokens`) 
      .run()

    return { status: 'complete' as const }
  })
