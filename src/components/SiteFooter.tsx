import { Link } from "@tanstack/react-router";
import { Github, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background mt-16 sm:mt-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div className="sm:col-span-2">
            <Link to="/" className="flex items-center gap-2 group w-fit">
              <img src="/logo.jpeg" alt="VIBELEARN" className="h-8 w-8 object-contain" />
              <span className="font-display text-base font-bold tracking-widest uppercase">
                VIBE<span className="text-primary">LEARN</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground leading-relaxed">
              Learn to build with AI. From your first prompt to shipping production-grade apps that people actually use.
            </p>
            <div className="mt-5 flex gap-3 text-muted-foreground">
              <a href="#" className="hover:text-primary transition"><Github className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="hover:text-primary transition"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/courses" className="hover:text-foreground transition">Courses</Link></li>
              <li><Link to="/library" className="hover:text-foreground transition">Library</Link></li>
              <li><Link to="/research" className="hover:text-foreground transition">Research</Link></li>
              <li><Link to="/community" className="hover:text-foreground transition">Community</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground transition">Sign in</Link></li>
              <li><Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground transition">Get started</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 pt-6 border-t border-border/60 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} VIBELEARN. Built for the next million builders.</p>
          <p>Made with passion for learning.</p>
        </div>
      </div>
    </footer>
  );
}
