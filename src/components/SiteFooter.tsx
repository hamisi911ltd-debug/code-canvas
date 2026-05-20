import { Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-bold">vibe<span className="text-primary">learn</span></span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Learn to build with AI. From your first prompt to shipping production-grade apps.
            </p>
            <div className="mt-5 flex gap-3 text-muted-foreground">
              <a href="#" className="hover:text-primary transition"><Github className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Learn</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/courses" className="hover:text-foreground">Courses</Link></li>
              <li><Link to="/research" className="hover:text-foreground">Research</Link></li>
              <li><Link to="/community" className="hover:text-foreground">Community</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 flex flex-col md:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} VibeLearn. Built for the next million builders.</p>
          <p>Powered by Lovable Cloud</p>
        </div>
      </div>
    </footer>
  );
}
