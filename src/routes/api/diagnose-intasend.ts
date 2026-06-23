import { createAPIFileRoute } from '@tanstack/react-start/api'
import { getCookie } from '@tanstack/react-start/server'
import { getSession } from '@/lib/auth'
import { getIntaSendConfig } from '@/lib/intasend'

// TEMPORARY diagnostic route (admin-only) — sends a deliberately invalid (amount=0)
// request so IntaSend rejects it with a validation error before any charge/SMS could
// trigger. Lets us see exactly what IntaSend's edge returns to THIS Worker's outbound IP.
// Delete this file once the 403/1106 issue is resolved.
export const APIRoute = createAPIFileRoute('/api/diagnose-intasend')({
  GET: async () => {
    const user = await getSession(getCookie('vl_session'))
    if (!user?.isAdmin) return new Response('Not found', { status: 404 })

    const { secretKey, baseUrl } = getIntaSendConfig()
    const res = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'VibeLearn/1.0 (+https://vlapp.glotech.workers.dev)',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({ amount: 0, phone_number: 'invalid', currency: 'KES', api_ref: 'diagnostic-test' }),
    })
    const text = await res.text()
    return new Response(
      JSON.stringify({ status: res.status, headers: Object.fromEntries(res.headers.entries()), body: text }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  },
})
