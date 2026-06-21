'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getSession } from '@/lib/auth'
import { getIntaSendConfig, normalizeKenyanPhone } from '@/lib/intasend'

const MODULE_PRICE_KES = 50

async function requireAuth() {
  const sid = getCookie('vl_session')
  const user = await getSession(sid)
  if (!user) throw new Error('Not authenticated')
  return user
}

export const initiateMpesaPayment = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { phoneNumber: string; categoryId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()
    const { secretKey, baseUrl } = getIntaSendConfig()
    const phone = normalizeKenyanPhone(data.phoneNumber)

    const res = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        amount: MODULE_PRICE_KES,
        phone_number: phone,
        currency: 'KES',
        api_ref: `module-${data.categoryId}`,
      }),
    })

    const json = (await res.json()) as any
    const invoiceId = json?.invoice?.invoice_id as string | undefined
    if (!res.ok || !invoiceId) {
      throw new Error(json?.detail ?? json?.message ?? 'Failed to start M-Pesa payment')
    }

    await db
      .prepare(
        'INSERT INTO mpesa_payments (id, user_id, invoice_id, category_id, phone_number, amount_kes, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(newId(), user.id, invoiceId, data.categoryId, phone, MODULE_PRICE_KES, 'pending')
      .run()

    return { invoiceId }
  })

export const checkMpesaPaymentStatus = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { invoiceId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()

    const payment = await db
      .prepare('SELECT status FROM mpesa_payments WHERE invoice_id = ? AND user_id = ?')
      .bind(data.invoiceId, user.id)
      .first<{ status: 'pending' | 'complete' | 'failed' }>()
    if (!payment) throw new Error('Payment not found')
    if (payment.status !== 'pending') return { status: payment.status }

    const { secretKey, baseUrl } = getIntaSendConfig()
    const res = await fetch(`${baseUrl}/api/v1/payment/status/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ invoice_id: data.invoiceId }),
    })
    const json = (await res.json()) as any
    const state = json?.invoice?.state as string | undefined

    if (state === 'COMPLETE') {
      // UNIQUE on invoice_id + status guard prevents double-credit if polled concurrently
      const updated = await db
        .prepare("UPDATE mpesa_payments SET status = 'complete' WHERE invoice_id = ? AND status = 'pending'")
        .bind(data.invoiceId)
        .run()
      if (updated.meta.changes > 0) {
        await db
          .prepare('INSERT INTO token_transactions (id, user_id, amount, type, description) VALUES (?, ?, ?, ?, ?)')
          .bind(newId(), user.id, 1, 'purchase', `IntaSend M-Pesa · ${data.invoiceId}`)
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
