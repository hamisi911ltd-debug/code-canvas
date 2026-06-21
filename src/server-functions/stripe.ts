'use server'

import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getDB, newId } from '@/db/index'
import { getSession } from '@/lib/auth'
import { getStripe } from '@/lib/stripe'

const DOMAIN = 'https://vibelearn.app'

async function requireAuth() {
  const sid = getCookie('vl_session')
  const user = await getSession(sid)
  if (!user) throw new Error('Not authenticated')
  return user
}

export const createStripeCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { packageId: string })
  .handler(async ({ data }) => {
    const user = await requireAuth()
    const db = getDB()

    const pkg = await db
      .prepare('SELECT * FROM token_packages WHERE id = ? AND active = 1')
      .bind(data.packageId)
      .first<{ id: string; name: string; tokens: number; price_kes: number; description: string | null }>()
    if (!pkg) throw new Error('Package not found')

    const stripe = getStripe()

    // Get or create Stripe customer tied to this user
    const userRow = await db
      .prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
      .bind(user.id)
      .first<{ stripe_customer_id: string | null }>()

    let customerId = userRow?.stripe_customer_id ?? null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.display_name ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').bind(customerId, user.id).run()
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'kes',
            product_data: {
              name: pkg.name,
              description: pkg.description ?? `${pkg.tokens} token${pkg.tokens !== 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(pkg.price_kes * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${DOMAIN}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/checkout/cancel`,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        tokens: String(pkg.tokens),
      },
    })

    // Record the pending payment to enable idempotent webhook processing
    await db
      .prepare('INSERT OR IGNORE INTO stripe_payments (id, user_id, stripe_session_id, package_id, tokens, status) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(newId(), user.id, session.id, pkg.id, pkg.tokens, 'pending')
      .run()

    return { url: session.url! }
  })

export const createStripePortalSession = createServerFn({ method: 'POST' })
  .handler(async () => {
    const user = await requireAuth()
    const db = getDB()

    const userRow = await db
      .prepare('SELECT stripe_customer_id FROM users WHERE id = ?')
      .bind(user.id)
      .first<{ stripe_customer_id: string | null }>()

    if (!userRow?.stripe_customer_id) throw new Error('No Stripe customer found. Purchase a package first.')

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: `${DOMAIN}/dashboard`,
    })

    return { url: session.url }
  })
