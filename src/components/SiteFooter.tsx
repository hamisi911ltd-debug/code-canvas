import { Link } from "@tanstack/react-router";
import { Github, Twitter, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background mt-8 sm:mt-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group w-fit">
            <img src="/logo.jpeg" alt="VIBELEARN" className="h-7 w-7 rounded-full object-contain p-0.5 bg-card ring-2 ring-primary/30" />
            <span className="font-display text-sm font-bold tracking-widest uppercase">
              VIBE<span className="text-primary">LEARN</span>
            </span>
          </Link>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <Link to="/courses" className="hover:text-foreground transition">Courses</Link>
            <Link to="/research" className="hover:text-foreground transition">Research</Link>
            <Link to="/community" className="hover:text-foreground transition">Community</Link>
            <Link to="/auth" className="hover:text-foreground transition">Sign in</Link>
          </div>

          <div className="flex gap-3 text-muted-foreground">
            <a href="#" className="hover:text-primary transition"><Github className="h-4 w-4" /></a>
            <a href="#" className="hover:text-primary transition"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-primary transition"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/60 text-xs text-muted-foreground">
          © {new Date().getFullYear()} VIBELEARN. Built for the next million builders.
        </div>
      </div>
    </footer>
  );
}
