import { createAPIFileRoute } from '@tanstack/react-start/api'
import Stripe from 'stripe'
import { getCfEnv } from '@/lib/cf-context'
import { getDB, newId } from '@/db/index'

export const APIRoute = createAPIFileRoute('/api/stripe-webhook')({
  POST: async ({ request }) => {
    const env = getCfEnv()
    const stripeKey = env.STRIPE_SECRET_KEY
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET

    if (!stripeKey || !webhookSecret) {
      console.error('Stripe env vars not configured')
      return new Response('Server misconfigured', { status: 500 })
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-05-28.basil' })
    const body = await request.text()
    const sig = request.headers.get('stripe-signature') ?? ''

    let event: Stripe.Event
    try {
      // Use SubtleCryptoProvider for Cloudflare Workers (Web Crypto API)
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        webhookSecret,
        undefined,
        stripe.createSubtleCryptoProvider(),
      )
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err)
      return new Response('Webhook signature invalid', { status: 400 })
    }

    const db = getDB()

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status !== 'paid') {
        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const { userId, packageId, tokens } = session.metadata ?? {}

      if (userId && packageId && tokens) {
        // Mark payment as paid (UNIQUE on stripe_session_id prevents double-credit)
        const updated = await db
          .prepare("UPDATE stripe_payments SET status = 'paid' WHERE stripe_session_id = ? AND status = 'pending'")
          .bind(session.id)
          .run()

        if (updated.meta.changes > 0) {
          await db
            .prepare(
              'INSERT INTO token_transactions (id, user_id, amount, type, description, package_id) VALUES (?, ?, ?, ?, ?, ?)',
            )
            .bind(
              newId(),
              userId,
              Number(tokens),
              'purchase',
              `Stripe · ${session.id}`,
              packageId,
            )
            .run()
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      await db
        .prepare("UPDATE stripe_payments SET status = 'expired' WHERE stripe_session_id = ?")
        .bind(session.id)
        .run()
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
})
