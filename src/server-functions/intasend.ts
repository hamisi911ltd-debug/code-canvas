'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getSession } from '@/lib/auth'
import { normalizeKenyanPhone, startMpesaStkPush, getMpesaPaymentState, IntaSendError } from '@/lib/intasend'

const KES_PER_TOKEN = 50

async function requireAuth() {
  const sid = getCookie('vl_session')
  const user = await getSession(sid)
  if (!user) throw new Error('Not authenticated')
  return user
}

export const initiateMpesaPayment = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { phoneNumber: string; tokens: number })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    const phone = normalizeKenyanPhone(data.phoneNumber)
    const tokens = Math.max(1, Math.round(data.tokens))
    const amount = tokens * KES_PER_TOKEN

    const [firstName, ...lastNameParts] = (user.display_name ?? 'VibeLearn Student').trim().split(/\s+/)

    let invoiceId: string
    try {
      const result = await startMpesaStkPush({
        amount,
        phoneNumber: phone,
        email: user.email,
        firstName,
        lastName: lastNameParts.join(' ') || firstName,
        apiRef: `tokens-${tokens}-${user.id}`,
        narrative: `${tokens} VibeLearn token${tokens === 1 ? '' : 's'}`,
      })
      invoiceId = result.invoiceId
    } catch (e) {
      if (e instanceof IntaSendError) throw new Error(e.message)
      throw e
    }

    await db
      .prepare(
        'INSERT INTO mpesa_payments (id, user_id, invoice_id, phone_number, tokens, amount_kes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(newId(), user.id, invoiceId, phone, tokens, amount, 'pending')
      .run()

    return { invoiceId }
  })

export const checkMpesaPaymentStatus = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { invoiceId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()

    const payment = await db
      .prepare('SELECT status, tokens FROM mpesa_payments WHERE invoice_id = ? AND user_id = ?')
      .bind(data.invoiceId, user.id)
      .first<{ status: 'pending' | 'complete' | 'failed'; tokens: number }>()
    if (!payment) throw new Error('Payment not found')
    if (payment.status !== 'pending') return { status: payment.status }

    let state: string | undefined
    try {
      state = await getMpesaPaymentState(data.invoiceId)
    } catch (e) {
      if (e instanceof IntaSendError) throw new Error(e.message)
      throw e
    }

    if (state === 'COMPLETE') {
      // UNIQUE on invoice_id + status guard prevents double-credit if polled concurrently
      const updated = await db
        .prepare("UPDATE mpesa_payments SET status = 'complete' WHERE invoice_id = ? AND status = 'pending'")
        .bind(data.invoiceId)
        .run()
      if (updated.meta.changes > 0) {
        await db
          .prepare('INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
          .bind(newId(), user.id, payment.tokens, 'purchase', `IntaSend M-Pesa · ${data.invoiceId}`)
          .run()
      }
      return { status: 'complete' as const }
    }

    if (state === 'FAILED' || state === 'CANCELLED') {
      await db
        .prepare("UPDATE mpesa_payments SET status = 'failed' WHERE invoice_id = ? AND status = 'pending'")
        .bind(data.invoiceId)
        .run()
      return { status: 'failed' as const }
    }

    return { status: 'pending' as const }
  })
