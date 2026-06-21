import Stripe from 'stripe'
import { getCfEnv } from './cf-context'

export function getStripe(): Stripe {
  const env = getCfEnv()
  const key = env.STRIPE_SECRET_KEY as string
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
  return new Stripe(key, { apiVersion: '2025-05-28.basil' })
}

export function getStripeWebhookSecret(): string {
  const env = getCfEnv()
  const secret = env.STRIPE_WEBHOOK_SECRET as string
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured')
  return secret
}
