import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { signUpFn, signInFn, googleSignInFn } from '@/server-functions/auth'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Loader2, BookOpen, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — VIBELEARN" },
      { name: "description", content: "Sign in to your VIBELEARN account or create a free account to start learning to code with AI." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
})

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function PasswordInput({
  id, value, onChange, placeholder = '••••••••', required, minLength,
}: {
  id: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id} type={show ? 'text' : 'password'} placeholder={placeholder}
        value={value} onChange={(e) => onChange(e.target.value)}
        required={required} minLength={minLength} className="pr-10"
      />
      <button
        type="button" tabIndex={-1} onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <CardContent className="space-y-5 pt-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-primary">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <div>
          <CardTitle className="text-lg">Check your inbox</CardTitle>
          <CardDescription className="mt-2">
            If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
          </CardDescription>
        </div>
        <Button variant="outline" className="w-full" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
        </Button>
      </CardContent>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4 pt-6">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </button>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>Enter the email linked to your account and we will send you a reset link.</CardDescription>
        <div className="space-y-2">
          <Label htmlFor="fp-email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="fp-email" type="email" placeholder="you@example.com" className="pl-9"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </CardContent>
    </form>
  )
}

function AuthPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)

  const [signInForm, setSignInForm] = useState({ email: '', password: '' })
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', displayName: '' })

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const user = await googleSignInFn({ data: { idToken } })
      qc.setQueryData(['auth-state'], user)
      toast.success(`Welcome, ${user.display_name ?? user.email}!`)
      navigate({ to: user.isAdmin ? '/admin' : '/dashboard' })
    } catch (err: unknown) {
      // User closed the popup — don't show an error
      if ((err as { code?: string }).code === 'auth/popup-closed-by-user') return
      toast.error(err instanceof Error ? err.message : 'Google sign in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

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
    <div className="h-[100dvh] overflow-hidden bg-background flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md space-y-3 sm:space-y-4">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-1.5">
            <img src="/logo.jpeg" alt="VIBELEARN" className="h-8 w-8 sm:h-10 sm:w-10 rounded-full ring-2 ring-primary/30" />
            <span className="text-xl sm:text-2xl font-black tracking-tight text-primary">VIBELEARN</span>
          </Link>
          <p className="text-muted-foreground text-xs sm:text-sm">Your modern tech learning platform</p>
        </div>

        <Card className="border-border/60 shadow-2xl bg-card/80 backdrop-blur">
          {forgotPassword ? (
            <ForgotPasswordView onBack={() => setForgotPassword(false)} />
          ) : (
            <Tabs defaultValue="signin">
              <CardHeader className="pb-0">
                <TabsList className="w-full">
                  <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="flex-1">Create Account</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-2.5 sm:space-y-3 pt-4 pb-4">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>Sign in to continue learning</CardDescription>

                    <Button
                      type="button" variant="outline" className="w-full gap-2"
                      onClick={handleGoogleSignIn} disabled={googleLoading || loading}
                    >
                      {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="si-email">Email</Label>
                      <Input id="si-email" type="email" placeholder="you@example.com"
                        value={signInForm.email} onChange={(e) => setSignInForm((p) => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="si-password">Password</Label>
                        <button type="button" onClick={() => setForgotPassword(true)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-2">
                          Forgot password?
                        </button>
                      </div>
                      <PasswordInput id="si-password" value={signInForm.password}
                        onChange={(v) => setSignInForm((p) => ({ ...p, password: v }))} required />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading || googleLoading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Sign In
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp}>
                  <CardContent className="space-y-2.5 sm:space-y-3 pt-4 pb-4">
                    <CardTitle className="text-xl">Create your account</CardTitle>
                    <CardDescription>Start learning for free today</CardDescription>

                    <Button
                      type="button" variant="outline" className="w-full gap-2"
                      onClick={handleGoogleSignIn} disabled={googleLoading || loading}
                    >
                      {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="su-name">Display Name</Label>
                      <Input id="su-name" type="text" placeholder="Your name"
                        value={signUpForm.displayName} onChange={(e) => setSignUpForm((p) => ({ ...p, displayName: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-email">Email</Label>
                      <Input id="su-email" type="email" placeholder="you@example.com"
                        value={signUpForm.email} onChange={(e) => setSignUpForm((p) => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="su-password">Password</Label>
                      <PasswordInput id="su-password" value={signUpForm.password}
                        onChange={(v) => setSignUpForm((p) => ({ ...p, password: v }))}
                        placeholder="At least 8 characters" required minLength={8} />
                    </div>
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading || googleLoading}>
                      {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Create Account
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By signing up you agree to our terms of service
                    </p>
                  </CardContent>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>

        <div className="text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-1 transition-colors">
            <BookOpen className="h-3 w-3" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
