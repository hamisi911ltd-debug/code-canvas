import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (s) => searchSchema.parse(s),
});

const authSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
  display_name: z.string().trim().min(2).max(60).optional(),
});

function AuthPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsed = authSchema.safeParse({ email, password, display_name: mode === "signup" ? displayName : undefined });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        toast.success("Welcome to VibeLearn! You're in.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error(String(result.error)); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-glow relative px-4 py-12">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground glow-ring">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-bold">vibe<span className="text-primary">learn</span></span>
        </Link>

        <Card className="card-glass border-border">
          <CardHeader>
            <CardTitle className="font-display text-2xl">
              {mode === "signup" ? "Start vibing" : "Welcome back"}
            </CardTitle>
            <CardDescription>
              {mode === "signup" ? "Create your free account in seconds." : "Sign in to continue learning."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" onClick={handleGoogle} disabled={loading} variant="outline" className="w-full h-11 border-border hover:bg-muted">
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </Button>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="dn">Display name</Label>
                  <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signup" ? "Create account" : "Sign in"}
              </Button>
            </form>
            <p className="text-sm text-center text-muted-foreground">
              {mode === "signup" ? "Already have an account? " : "New here? "}
              <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary hover:underline">
                {mode === "signup" ? "Sign in" : "Create one"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
