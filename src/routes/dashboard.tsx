import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getDownloadUrl } from "@/lib/store.functions";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download, KeyRound } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Fiókom – licencek és letöltések | NovaScripts" },
      {
        name: "description",
        content:
          "Kezeld a megvásárolt FiveM scripteket: licenckulcsok, szerver IP hozzárendelés, letöltések és megrendelések állapota.",
      },
      { property: "og:title", content: "Fiókom | NovaScripts" },
      { property: "og:description", content: "Licenckulcsok, letöltések és megrendelések egy helyen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

type LicenseRow = {
  id: string;
  license_key: string;
  status: string;
  server_ip: string | null;
  activations: number;
  last_check_at: string | null;
  products: { name: string; slug: string; version: string; escrow_asset_name: string | null } | null;
};

type OrderRow = {
  id: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  cfx_id: string | null;
  products: { name: string; slug: string } | null;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const download = useServerFn(getDownloadUrl);
  const [ipDrafts, setIpDrafts] = useState<Record<string, string>>({});

  const licenses = useQuery({
    queryKey: ["licenses", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("licenses")
        .select("id, license_key, status, server_ip, activations, last_check_at, products(name, slug, version, escrow_asset_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LicenseRow[];
    },
  });

  const orders = useQuery({
    queryKey: ["orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, amount_cents, currency, created_at, cfx_id, products(name, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  const saveIp = useMutation({
    mutationFn: async ({ id, ip }: { id: string; ip: string }) => {
      const { error } = await supabase.from("licenses").update({ server_ip: ip || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Szerver IP mentve");
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
    },
    onError: (error) => toast.error("Nem sikerült a mentés", { description: (error as Error).message }),
  });

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-muted-foreground">Betöltés…</div>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Ehhez be kell lépned</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A licenckulcsaid és letöltéseid csak bejelentkezés után láthatók.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Belépés</Link>
        </Button>
      </main>
    );
  }

  const handleDownload = async (licenseId: string) => {
    try {
      const result = await download({ data: { licenseId } });
      if (!result.url) {
        toast.info("Nincs letölthető fájl", { description: result.reason ?? undefined });
        return;
      }
      window.open(result.url, "_blank", "noopener");
    } catch (error) {
      toast.error("A letöltés nem indult el", { description: (error as Error).message });
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Fiókom</h1>
      <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Licenckulcsaim</h2>
        {licenses.data && licenses.data.length > 0 ? (
          <div className="mt-4 space-y-4">
            {licenses.data.map((license) => (
              <div key={license.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">{license.products?.name ?? "Script"}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      v{license.products?.version} · resource: {license.products?.escrow_asset_name ?? "—"} ·{" "}
                      {license.activations} ellenőrzés
                    </p>
                  </div>
                  <Badge variant={license.status === "active" ? "default" : "destructive"}>
                    {license.status === "active" ? "Aktív" : license.status}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <code className="rounded-md bg-surface-strong px-3 py-2 font-mono text-sm">{license.license_key}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard.writeText(license.license_key);
                      toast.success("Kulcs kimásolva");
                    }}
                  >
                    <Copy className="size-4" /> Másolás
                  </Button>
                  <Button size="sm" onClick={() => handleDownload(license.id)}>
                    <Download className="size-4" /> Letöltés
                  </Button>
                </div>

                <div className="mt-4 grid gap-2 sm:max-w-sm">
                  <Label htmlFor={`ip-${license.id}`}>Szerver IP (licenc kötése)</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`ip-${license.id}`}
                      placeholder="pl. 51.83.12.44"
                      value={ipDrafts[license.id] ?? license.server_ip ?? ""}
                      onChange={(event) => setIpDrafts((prev) => ({ ...prev, [license.id]: event.target.value }))}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => saveIp.mutate({ id: license.id, ip: ipDrafts[license.id] ?? "" })}
                      disabled={saveIp.isPending}
                    >
                      Mentés
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel mt-4 flex flex-col items-start gap-3 p-6 text-sm text-muted-foreground">
            <KeyRound className="size-5 text-primary" />
            Még nincs licenckulcsod. A megrendelés jóváhagyása után jelenik meg itt.
            <Button asChild size="sm" variant="outline">
              <Link to="/">Scriptek böngészése</Link>
            </Button>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Megrendeléseim</h2>
        {orders.data && orders.data.length > 0 ? (
          <div className="panel mt-4 divide-y divide-border">
            {orders.data.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{order.products?.name ?? "Script"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("hu-HU")}
                    {order.cfx_id ? ` · ${order.cfx_id}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatPrice(order.amount_cents, order.currency)}</span>
                  <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                    {order.status === "paid" ? "Fizetve" : order.status === "pending" ? "Fizetésre vár" : order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Még nincs megrendelésed.</p>
        )}
      </section>
    </main>
  );
}
