import { getCfEnv } from './cf-context'

const LIVE_BASE = 'https://payment.intasend.com'
const SANDBOX_BASE = 'https://sandbox.intasend.com'
const SITE_URL = 'https://vlapp.glotech.workers.dev'

export interface IntaSendConfig {
  secretKey: string
  baseUrl: string
}

export function getIntaSendConfig(): IntaSendConfig {
  const env = getCfEnv()
  const secretKey = env.INTASEND_SECRET_KEY as string
  if (!secretKey) throw new Error('INTASEND_SECRET_KEY not configured')
  const baseUrl = secretKey.includes('_live_') ? LIVE_BASE : SANDBOX_BASE
  return { secretKey, baseUrl }
}

// Accepts 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXXX or 254XXXXXXXXX and returns 254XXXXXXXXX
export function normalizeKenyanPhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`
  if (digits.length === 9 && (digits.startsWith('7') || digits.startsWith('1'))) return `254${digits}`
  throw new Error('Enter a valid Safaricom number, e.g. 0712345678')
}

export class IntaSendError extends Error {
  constructor(message: string, public httpStatus?: number, public body?: unknown) {
    super(message)
    this.name = 'IntaSendError'
  }
}

// Single point of contact with IntaSend's API. Cloudflare Workers' default fetch sends
// no real User-Agent — some payment-provider edges treat that as bot/automation traffic
// and reject it before it reaches the application layer. Setting headers that look like
// a normal API client (and retrying once on a transient network/5xx failure) is a known
// fix for that class of "fine locally, blocked from an edge runtime" issue.
async function intasendRequest(path: string, body: Record<string, unknown>): Promise<any> {
  const { secretKey, baseUrl } = getIntaSendConfig()

  const attempt = async () => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'VibeLearn/1.0 (+https://vlapp.glotech.workers.dev)',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify(body),
    })
    const text = await res.text()
    let json: any
    try {
      json = JSON.parse(text)
    } catch {
      throw new IntaSendError(`IntaSend returned a non-JSON response (HTTP ${res.status}): ${text.slice(0, 200)}`, res.status, text)
    }
    return { res, json }
  }

  let { res, json } = await attempt()

  // One retry for transient edge/server failures only — never retry a 4xx, that's not transient.
  if (res.status >= 500) {
    ;({ res, json } = await attempt())
  }

  if (!res.ok) {
    const detail = json?.detail ?? json?.message ?? (Array.isArray(json?.errors) ? json.errors.map((e: any) => e.detail).join('; ') : null)
    throw new IntaSendError(detail ?? `IntaSend request failed (HTTP ${res.status})`, res.status, json)
  }

  return json
}

export async function startMpesaStkPush(opts: {
  amount: number
  phoneNumber: string
  email: string
  firstName: string
  lastName: string
  apiRef: string
  narrative: string
}): Promise<{ invoiceId: string }> {
  const json = await intasendRequest('/api/v1/payment/mpesa-stk-push/', {
    amount: opts.amount,
    phone_number: opts.phoneNumber,
    email: opts.email,
    first_name: opts.firstName,
    last_name: opts.lastName,
    currency: 'KES',
    api_ref: opts.apiRef,
    narrative: opts.narrative,
    host: SITE_URL,
  })
  const invoiceId = json?.invoice?.invoice_id as string | undefined
  if (!invoiceId) throw new IntaSendError('IntaSend did not return an invoice id', 200, json)
  return { invoiceId }
}

export async function getMpesaPaymentState(invoiceId: string): Promise<string | undefined> {
  const json = await intasendRequest('/api/v1/payment/status/', { invoice_id: invoiceId })
  return json?.invoice?.state as string | undefined
}
