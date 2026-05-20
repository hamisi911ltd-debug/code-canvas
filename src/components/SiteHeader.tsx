import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Menu, LogOut, LayoutDashboard, Shield, BookOpen, FlaskConical, Users } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/community", label: "Community", icon: Users },
];

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const initials = (user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground glow-ring transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            vibe<span className="text-primary">learn</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
              activeProps={{ className: "text-foreground bg-muted/50" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-border bg-card px-1 py-1 pr-3 hover:border-primary/50 transition">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs text-muted-foreground max-w-[120px] truncate">{user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Signed in</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
                    <Shield className="h-4 w-4" /> Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring">Get started</Button>
              </Link>
            </>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border">
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-muted">
                    <l.icon className="h-4 w-4 text-primary" /> {l.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
