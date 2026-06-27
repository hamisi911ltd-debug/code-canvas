import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Coins, ShieldCheck, Loader2 } from 'lucide-react'
import { getIntaSendPublishableKey, getMpesaPaymentStatus, devGrantTokens } from '@/server-functions/intasend'
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
  const [sdkReady, setSdkReady] = useState(false)
  const [apiRef, setApiRef] = useState<string | null>(null)
  const [pendingPayment, setPendingPayment] = useState<Record<string, unknown> | null>(null)
  const intaSendRef = useRef<IntaSend | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const buildPubKey = import.meta.env.VITE_INTASEND_PUBLISHABLE_KEY as string | undefined
  const isDevMode = import.meta.env.DEV
  const runtimeKeyQuery = useQuery({
    queryKey: ['intasend-publishable-key'],
    queryFn: () => getIntaSendPublishableKey(),
    enabled: !buildPubKey,
    staleTime: Infinity,
    cacheTime: Infinity,
  })
  const runtimePubKey = buildPubKey ?? runtimeKeyQuery.data?.key
  const publicAPIKey = runtimePubKey?.trim() || undefined
  const keyLoading = !buildPubKey && runtimeKeyQuery.isLoading
  const devFallbackEnabled = isDevMode && !publicAPIKey && !keyLoading

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
    if (!pendingPayment || step !== 'checkout' || !intaSendRef.current) return
    intaSendRef.current.run(pendingPayment)
    setPendingPayment(null)
  }, [pendingPayment, step])

  useEffect(() => {
    if (keyLoading) return
    let cancelled = false
    if (!publicAPIKey) {
      if (devFallbackEnabled) {
        toast.warning('Missing IntaSend publishable key. Using local dev token grant fallback.')
        setSdkReady(true)
      } else {
        toast.error('Missing IntaSend publishable key. Check your env configuration.')
      }
      return
    }

    import('intasend-inlinejs-sdk')
      .then(({ default: IntaSend }) => {
        if (cancelled) return
        intaSendRef.current = new IntaSend({
          publicAPIKey,
          live: publicAPIKey.includes('_live_'),
          mode: 'inline',
          inlineContainer: CHECKOUT_CONTAINER_ID,
          // The SDK's own `styles` constructor option is a documented no-op for this
          // account — IntaSend's server returns a fixed style payload with the checkout
          // session regardless of what's passed here (confirmed by inspecting the
          // checkout iframe's URL payload). The card's own colors are only themeable
          // from the IntaSend dashboard (Sales → Manage → checkout layout/presets).
        })
          .on('FAILED', () => {
            setStep('summary')
            toast.error("Payment didn't go through. You haven't been charged.")
          })
          .on('COMPLETE', () => {
            setCheckoutLoaded(true)
          })
          .on('IN-PROGRESS', () => {
            setCheckoutLoaded(false)
          })
        setSdkReady(true)
      })
      .catch((error) => {
        console.error('Failed to load IntaSend SDK', error)
        toast.error('Unable to load payment checkout. Please refresh and try again.')
      })
    return () => {
      cancelled = true
    }
  }, [publicAPIKey, keyLoading, devFallbackEnabled])

  useEffect(() => {
    if (!open) {
      setStep('summary')
      setCheckoutLoaded(false)
      setApiRef(null)
      intaSendRef.current = null
    }
  }, [open])

  const amount = tokens * KES_PER_TOKEN

  const devGrantMutation = useMutation({
    mutationFn: ({ tokens }: { tokens: number }) => devGrantTokens({ data: { tokens } }),
    onSuccess: () => {
      toast.success(`${tokens} token${tokens === 1 ? '' : 's'} added!`)
      onPurchased()
    },
    onError: (error) => {
      console.error('Dev token grant failed', error)
      toast.error('Unable to grant tokens locally. Check your network connection.')
    },
  })

  const handlePayNow = () => {
    if (!user) {
      toast.error('You must be signed in to purchase tokens.')
      return
    }

    if (devFallbackEnabled) {
      devGrantMutation.mutate({ tokens })
      return
    }

    if (!sdkReady || !intaSendRef.current) {
      toast.error('Payment checkout is not ready. Please try again in a moment.')
      return
    }

    const ref = `tokens-${tokens}-${user.id}-${Date.now().toString(36)}`
    setApiRef(ref)

    const [firstName, ...lastNameParts] = (user.display_name ?? 'VibeLearn Student').trim().split(/\s+/)
    setPendingPayment({
      amount,
      currency: 'KES',
      email: user.email,
      first_name: firstName,
      last_name: lastNameParts.join(' ') || firstName,
      api_ref: ref,
    })
    setStep('checkout')
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
      <DialogContent className="w-[calc(100%-1.5rem)] sm:max-w-md max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 gap-3 sm:gap-4">
        <DialogHeader>
          <div className="mx-auto grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-1.5 sm:mb-2">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <DialogTitle className="text-center text-lg sm:text-xl break-words">Unlock "{courseTitle}"</DialogTitle>
          <DialogDescription className="text-center text-xs sm:text-sm">
            You need {tokens} token{tokens === 1 ? '' : 's'} to enroll — top up to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4 space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {tokens} token{tokens === 1 ? '' : 's'} × KES {KES_PER_TOKEN}
            </span>
            <span className="font-mono">KES {amount}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-center justify-between font-semibold text-sm sm:text-base">
            <span>Total due</span>
            <span className="font-mono text-primary">KES {amount}</span>
          </div>
        </div>

        {devFallbackEnabled ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 sm:p-4 text-xs sm:text-sm text-amber-900">
            <p className="font-semibold">Developer fallback active</p>
            <p className="mt-1">
              `VITE_INTASEND_PUBLISHABLE_KEY` is not configured, so purchases will be granted locally for testing only.
            </p>
          </div>
        ) : null}

        {step === 'summary' ? (
          <Button
            onClick={handlePayNow}
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!sdkReady || devGrantMutation.isLoading}
          >
            {devFallbackEnabled
              ? `Grant ${tokens} token${tokens === 1 ? '' : 's'} locally`
              : sdkReady
              ? `Pay KES ${amount}`
              : 'Loading payment checkout…'}
          </Button>
        ) : (
          <div
            id={CHECKOUT_CONTAINER_ID}
            ref={containerRef}
            className="relative min-h-[300px] sm:min-h-[420px] max-h-[60vh] sm:max-h-none rounded-xl overflow-hidden bg-[#0d1b2a] [&_iframe]:!w-full [&_iframe]:!max-w-full"
          >
            {!checkoutLoaded && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" /> Loading secure checkout…
              </div>
            )}
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground text-center">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Secure checkout by IntaSend — M-Pesa, card, Apple Pay, Google Pay & more
        </p>
      </DialogContent>
    </Dialog>
  )
}
