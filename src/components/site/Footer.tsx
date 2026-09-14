import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-surface/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p className="max-w-md">
          NovaScripts — prémium FiveM erőforrások Asset Escrow védelemmel, licenckulcsos jogosultságkezeléssel.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/" className="transition-colors hover:text-foreground">
            Scriptek
          </Link>
          <Link to="/docs" className="transition-colors hover:text-foreground">
            Telepítési útmutató
          </Link>
          <Link to="/dashboard" className="transition-colors hover:text-foreground">
            Fiókom
          </Link>
        </div>
      </div>
    </footer>
  );
}
