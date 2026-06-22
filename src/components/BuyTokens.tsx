import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Coins, Smartphone, ShieldCheck, XCircle } from 'lucide-react'
import { initiateMpesaPayment, checkMpesaPaymentStatus } from '@/server-functions/intasend'

const KES_PER_TOKEN = 50

export function BuyTokens({ tokens, onPurchased }: { tokens: number; onPurchased: () => void }) {
  const [step, setStep] = useState<'pay' | 'waiting' | 'failed'>('pay')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [invoiceId, setInvoiceId] = useState<string | null>(null)

  const initiate = useMutation({
    mutationFn: () => initiateMpesaPayment({ data: { phoneNumber, tokens } }),
    onSuccess: (res) => {
      setInvoiceId(res.invoiceId)
      setStep('waiting')
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to start M-Pesa payment'),
  })

  const { data: statusData } = useQuery({
    queryKey: ['mpesa-status', invoiceId],
    queryFn: () => checkMpesaPaymentStatus({ data: { invoiceId: invoiceId! } }),
    enabled: !!invoiceId && step === 'waiting',
    refetchInterval: (q) => (q.state.data?.status === 'pending' || !q.state.data ? 3000 : false),
  })

  useEffect(() => {
    if (statusData?.status === 'complete') {
      toast.success(`${tokens} token${tokens === 1 ? '' : 's'} added!`)
      onPurchased()
    } else if (statusData?.status === 'failed') {
      setStep('failed')
    }
    // onPurchased intentionally omitted — only re-run when the payment status itself changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusData?.status])

  const amount = tokens * KES_PER_TOKEN

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-6 text-center card-glass">
      {step === 'pay' && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Coins className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-bold">
            Buy {tokens} token{tokens === 1 ? '' : 's'} — KES {amount}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">Enter your Safaricom number — we'll send a payment prompt straight to your phone.</p>
          <div className="mt-4 flex items-center gap-2 justify-center">
            <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 0712345678"
              inputMode="tel"
              className="w-full max-w-xs rounded-xl border border-border bg-background px-4 py-2.5 text-center font-mono text-base outline-none focus:border-primary transition"
            />
          </div>
          <Button
            onClick={() => initiate.mutate()}
            disabled={initiate.isPending || phoneNumber.trim().length < 9}
            className="mt-4 w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {initiate.isPending ? 'Sending…' : 'Send payment prompt'}
          </Button>
        </>
      )}

      {step === 'waiting' && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4 animate-pulse">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-bold">Check your phone</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your M-Pesa PIN on the prompt sent to <span className="font-mono">{phoneNumber}</span> to complete the KES {amount} payment.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Waiting for confirmation… this updates automatically.</p>
          <Button variant="outline" onClick={() => setStep('pay')} className="mt-4 w-full max-w-xs">Use a different number</Button>
        </>
      )}

      {step === 'failed' && (
        <>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive mb-4">
            <XCircle className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-bold">Payment didn't go through</h3>
          <p className="mt-2 text-sm text-muted-foreground">The M-Pesa prompt was cancelled or timed out. You haven't been charged.</p>
          <Button onClick={() => setStep('pay')} className="mt-4 w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90">Try again</Button>
        </>
      )}
    </div>
  )
}
