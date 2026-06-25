import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Coins, ShieldCheck, Loader2 } from 'lucide-react'
import { getMpesaPaymentStatus } from '@/server-functions/intasend'
import { useAuth } from '@/hooks/useAuth'
import type IntaSend from 'intasend-inlinejs-sdk'

const KES_PER_TOKEN = 50
const CHECKOUT_CONTAINER_ID = 'intasend-checkout-container'

// IntaSend's own Cloudflare zone blocks server-initiated requests from our Worker
// (Cloudflare error 1106), so checkout is triggered from the browser via their inline
// SDK (publishable key) instead of a server-side STK push call. We run the SDK in
// `mode: 'inline'`, which makes it append its checkout iframe into our own container
// div instead of spawning a separate floating popup — so the order summary and the
// payment form (M-Pesa, card, Apple/Google Pay, etc. — whatever's enabled on the
// IntaSend account) live in one themed dialog instead of two stacked, mismatched ones.
// IntaSend's webhook (src/server.ts) confirms payment and credits tokens — this
// component just polls our own DB for that result.

export function BuyTokens({
  tokens,
  courseTitle,
  open,
  onOpenChange,
  onPurchased,
}: {
  tokens: number
  courseTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchased: () => void
}) {
  const { user } = useAuth()
  const [step, setStep] = useState<'summary' | 'checkout'>('summary')
  const [checkoutLoaded, setCheckoutLoaded] = useState(false)
  const [apiRef, setApiRef] = useState<string | null>(null)
  const intaSendRef = useRef<IntaSend | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // The SDK appends its iframe into the container via document.getElementById,
  // outside React's render cycle — observe for that child showing up so we can
  // swap our loading spinner out for it instead of stacking them.
  useEffect(() => {
    if (step !== 'checkout') {
      setCheckoutLoaded(false)
      return
    }
    const el = containerRef.current
    if (!el) return
    if (el.childElementCount > 0) {
      setCheckoutLoaded(true)
      return
    }
    const observer = new MutationObserver(() => {
      if (el.childElementCount > 0) {
        setCheckoutLoaded(true)
        observer.disconnect()
      }
    })
    observer.observe(el, { childList: true })
    return () => observer.disconnect()
  }, [step])

  useEffect(() => {
    let cancelled = false
    import('intasend-inlinejs-sdk').then(({ default: IntaSend }) => {
      if (cancelled) return
      const publicAPIKey = import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY as string | undefined
      intaSendRef.current = new IntaSend({
        publicAPIKey,
        live: publicAPIKey?.includes('_live_') ?? false,
        mode: 'inline',
        inlineContainer: CHECKOUT_CONTAINER_ID,
        // The SDK's own `styles` constructor option is a documented no-op for this
        // account — IntaSend's server returns a fixed style payload with the checkout
        // session regardless of what's passed here (confirmed by inspecting the
        // checkout iframe's URL payload). The card's own colors are only themeable
        // from the IntaSend dashboard (Sales → Manage → checkout layout/presets).
      }).on('FAILED', () => {
        setStep('summary')
        toast.error("Payment didn't go through. You haven't been charged.")
      })
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const amount = tokens * KES_PER_TOKEN

  const handlePayNow = () => {
    if (!user || !intaSendRef.current) return
    setStep('checkout')

    const ref = `tokens-${tokens}-${user.id}-${Date.now().toString(36)}`
    setApiRef(ref)

    const [firstName, ...lastNameParts] = (user.display_name ?? 'VibeLearn Student').trim().split(/\s+/)
    intaSendRef.current.run({
      amount,
      currency: 'KES',
      email: user.email,
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      api_ref: ref,
    })
  }

  const { data: statusData } = useQuery({
    queryKey: ['mpesa-status', apiRef],
    queryFn: () => getMpesaPaymentStatus({ data: { apiRef: apiRef! } }),
    enabled: !!apiRef,
    refetchInterval: (q) => (q.state.data?.status === 'pending' || !q.state.data ? 3000 : false),
  })

  useEffect(() => {
    if (statusData?.status === 'complete') {
      toast.success(`${tokens} token${tokens === 1 ? '' : 's'} added!`)
      onPurchased()
    } else if (statusData?.status === 'failed') {
      setStep('summary')
      toast.error("Payment didn't go through. You haven't been charged.")
    }
    // onPurchased intentionally omitted — only re-run when the payment status itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusData?.status])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Coins className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl">Unlock "{courseTitle}"</DialogTitle>
          <DialogDescription className="text-center">
            You need {tokens} token{tokens === 1 ? '' : 's'} to enroll — top up to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {tokens} token{tokens === 1 ? '' : 's'} × KES {KES_PER_TOKEN}
            </span>
            <span className="font-mono">KES {amount}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between font-semibold">
            <span>Total due</span>
            <span className="font-mono text-primary">KES {amount}</span>
          </div>
        </div>

        {step === 'summary' ? (
          <Button onClick={handlePayNow} size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Pay KES {amount}
          </Button>
        ) : (
          <div
            id={CHECKOUT_CONTAINER_ID}
            ref={containerRef}
            className="relative min-h-[420px] rounded-xl overflow-hidden bg-[#0d1b2a]"
          >
            {!checkoutLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading secure checkout…
              </div>
            )}
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Secure checkout by IntaSend — M-Pesa, card, Apple Pay, Google Pay & more
        </p>
      </DialogContent>
    </Dialog>
  )
}
