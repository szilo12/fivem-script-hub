import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Terminal, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

export function Nav() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Terminal className="size-4" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            Nova<span className="text-primary">Scripts</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 text-sm md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Scriptek</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/docs">Telepítés</Link>
          </Button>
          {user ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Fiókom</Link>
            </Button>
          ) : null}
          {isAdmin ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild size="sm" variant="secondary" className="md:hidden">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">Kilépés</span>
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to="/auth">Belépés</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
