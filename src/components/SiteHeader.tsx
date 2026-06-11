import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, LayoutDashboard, Shield, BookOpen, FlaskConical, Users, Library } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/courses", label: "Courses", icon: BookOpen },
  { to: "/library", label: "Library", icon: Library },
  { to: "/research", label: "Research", icon: FlaskConical },
  { to: "/community", label: "Community", icon: Users },
];

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const initials = (user?.email || "U").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img
            src="/favicon.svg"
            alt="VIBELEARN"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover transition-transform group-hover:scale-105 ring-2 ring-primary/30 drop-shadow-[0_0_8px_rgba(45,212,168,0.5)]"
          />
          <span className="font-display text-base sm:text-lg font-bold tracking-widest uppercase">
            VIBE<span className="text-primary">LEARN</span>
          </span>
        </Link>

        {/* Desktop nav */}
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

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-border bg-card px-1 py-1 sm:pr-3 hover:border-primary/50 transition">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs text-muted-foreground max-w-[100px] truncate">{user.email}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground truncate px-2 py-1.5">{user.email}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.navigate({ to: "/dashboard" })}>
                  <LayoutDashboard className="h-4 w-4" /> My Dashboard
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.navigate({ to: "/admin" })}>
                    <Shield className="h-4 w-4" /> Admin Panel
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
                <Button variant="ghost" size="sm" className="text-sm">Sign in</Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-ring text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4">
                  Get started
                </Button>
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border w-72">
              {/* Sheet header */}
              <div className="flex items-center gap-2 pb-6 border-b border-border">
                <img src="/favicon.svg" alt="VIBELEARN" className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/30" />
                <span className="font-display text-base font-bold tracking-widest uppercase">
                  VIBE<span className="text-primary">LEARN</span>
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link key={l.to} to={l.to} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted transition">
                    <l.icon className="h-4 w-4 text-primary" /> {l.label}
                  </Link>
                ))}
              </div>
              {/* Mobile auth buttons */}
              {!user && (
                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                  <Link to="/auth"><Button variant="outline" className="w-full">Sign in</Button></Link>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Get started free</Button>
                  </Link>
                </div>
              )}
              {user && (
                <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
                  <Link to="/dashboard"><Button variant="outline" className="w-full justify-start gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Button></Link>
                  {isAdmin && <Link to="/admin"><Button variant="outline" className="w-full justify-start gap-2"><Shield className="h-4 w-4" /> Admin Panel</Button></Link>}
                  <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
