import { getCfEnv } from './cf-context'

// IntaSend's Cloudflare zone blocks server-to-server requests that originate from
// Cloudflare's own network (Cloudflare error 1106 — "a Cloudflare customer blocked
// traffic from your client"), which is exactly what every Workers fetch() looks like
// to them. So payments are triggered from the browser (intasend-inlinejs-sdk, see
// BuyTokens.tsx) and confirmed here via their webhook instead of an outbound API call.

export function verifyIntaSendWebhook(payload: { challenge?: unknown }): boolean {
  const env = getCfEnv()
  return typeof payload.challenge === 'string' && payload.challenge === env.INTASEND_WEBHOOK_CHALLENGE
}

// api_ref is generated client-side as `tokens-${tokens}-${userId}-${nonce}`
export function parseApiRef(apiRef: string): { tokens: number; userId: string } | undefined {
  const match = /^tokens-(\d+)-([0-9a-f]+)-/i.exec(apiRef)
  if (!match) return undefined
  return { tokens: parseInt(match[1], 10), userId: match[2] }
}
