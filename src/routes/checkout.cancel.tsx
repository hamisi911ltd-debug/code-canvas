import { createFileRoute, Link } from '@tanstack/react-router'
import { XCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/PageShell'

export const Route = createFileRoute('/checkout/cancel')({ component: CheckoutCancel })

function CheckoutCancel() {
  return (
    <PageShell>
      <section className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/30">
              <XCircle className="h-10 w-10 text-destructive" />
            </span>
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold">Payment cancelled</h1>
            <p className="mt-2 text-muted-foreground">
              No worries — you haven't been charged. Browse our token packages whenever you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/library">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
