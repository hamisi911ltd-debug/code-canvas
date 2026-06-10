import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signUpFn, signInFn } from '@/server-functions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, BookOpen } from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [signInForm, setSignInForm] = useState({ email: '', password: '' })
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', displayName: '' })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await signInFn({ data: signInForm })
      qc.setQueryData(['auth-state'], user)
      toast.success('Welcome back!')
      navigate({ to: user.isAdmin ? '/admin' : '/dashboard' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signUpForm.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const user = await signUpFn({ data: signUpForm })
      qc.setQueryData(['auth-state'], user)
      toast.success('Account created! Welcome to VibeLearn.')
      navigate({ to: '/dashboard' })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo.jpeg" alt="VibeLearn" className="h-10 w-10 rounded-xl object-contain" />
            <span className="text-2xl font-black tracking-tight text-primary">VIBELEARN</span>
          </Link>
          <p className="text-muted-foreground text-sm">Your modern learning platform</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <Tabs defaultValue="signin">
            <CardHeader className="pb-0">
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardContent className="space-y-4 pt-6">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>Sign in to continue learning</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input
                      id="si-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-password">Password</Label>
                    <Input
                      id="si-password"
                      type="password"
                      placeholder="••••••••"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm((p) => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </CardContent>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardContent className="space-y-4 pt-6">
                  <CardTitle className="text-xl">Create your account</CardTitle>
                  <CardDescription>Start learning for free today</CardDescription>
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Display Name</Label>
                    <Input
                      id="su-name"
                      type="text"
                      placeholder="Your name"
                      value={signUpForm.displayName}
                      onChange={(e) => setSignUpForm((p) => ({ ...p, displayName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-password">Password</Label>
                    <Input
                      id="su-password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm((p) => ({ ...p, password: e.target.value }))}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By signing up you agree to our terms of service
                  </p>
                </CardContent>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
            <BookOpen className="h-3 w-3" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
