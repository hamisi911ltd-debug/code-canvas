import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/PageShell'
import { createStripePortalSession } from '@/server-functions/stripe'
import { toast } from 'sonner'

export const Route = createFileRoute('/checkout/success')({
  validateSearch: (s: Record<string, unknown>) => ({ session_id: (s.session_id as string) ?? '' }),
  component: CheckoutSuccess,
})

function CheckoutSuccess() {
  const { session_id } = Route.useSearch()
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Invalidate token balance so the dashboard reflects the new tokens
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['token-balance'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }, [qc])

  async function openPortal() {
    try {
      const { url } = await createStripePortalSession()
      window.location.href = url
    } catch (e: any) {
      toast.error(e.message ?? 'Could not open billing portal')
    }
  }

  return (
    <PageShell>
      <section className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/30">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-gradient">Payment successful!</h1>
            <p className="mt-2 text-muted-foreground">
              Your tokens have been added to your account. Start unlocking modules now.
            </p>
          </div>

          {session_id && (
            <p className="text-xs text-muted-foreground/60 font-mono break-all">
              Reference: {session_id}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/library">
                Browse Library <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>

          <button
            onClick={openPortal}
            className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Manage billing &amp; receipts
          </button>
        </div>
      </section>
    </PageShell>
  )
}
