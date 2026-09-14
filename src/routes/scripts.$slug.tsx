import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createOrder } from "@/lib/store.functions";
import { useAuth } from "@/hooks/useAuth";
import { coverFor, formatPrice, frameworkLabels, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/scripts/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} – FiveM script | NovaScripts` },
      {
        name: "description",
        content: "Escrow-védett FiveM script részletei, funkciói, ára és telepítési tudnivalói a NovaScripts boltban.",
      },
      { property: "og:title", content: `${params.slug} – FiveM script` },
      { property: "og:description", content: "Escrow-védett FiveM script licenckulccsal és azonnali letöltéssel." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const order = useServerFn(createOrder);
  const [cfxId, setCfxId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Product | null;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-muted-foreground">Betöltés…</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24">
        <h1 className="font-display text-2xl font-semibold">Ez a script nem található</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">Vissza a bolthoz</Link>
        </Button>
      </div>
    );
  }

  const cover = coverFor(product);

  const handleBuy = async () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    try {
      await order({ data: { productId: product.id, ...(cfxId.trim() ? { cfxId: cfxId.trim() } : {}) } });
      toast.success("Megrendelés létrehozva", {
        description: "A fiókodban követheted az állapotát és találod majd a licenckulcsot.",
      });
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error("Nem sikerült a megrendelés", { description: (error as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
        <Link to="/">
          <ChevronLeft className="size-4" /> Vissza
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="panel overflow-hidden">
            {cover ? (
              <img
                src={cover}
                alt={`${product.name} borítókép`}
                width={1024}
                height={640}
                className="aspect-[16/10] w-full object-cover"
              />
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{frameworkLabels[product.framework] ?? product.framework}</Badge>
            <Badge variant="outline">v{product.version}</Badge>
            {product.escrow_asset_name ? <Badge variant="outline">{product.escrow_asset_name}</Badge> : null}
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{product.name}</h1>
          <p className="mt-3 text-muted-foreground">{product.tagline}</p>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/90">{product.description}</p>

          {product.features.length > 0 ? (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold">Amit tartalmaz</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="panel p-6">
            <p className="font-display text-3xl font-semibold text-primary">
              {formatPrice(product.price_cents, product.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Egyszeri díj, korlátlan frissítés egy szerverre.</p>

            <div className="mt-6 space-y-2">
              <Label htmlFor="cfx">CFX / szerver azonosító (opcionális)</Label>
              <Input
                id="cfx"
                placeholder="pl. cfx.re/join/abc123"
                value={cfxId}
                onChange={(event) => setCfxId(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ide írd a szervered CFX linkjét vagy a Keymaster fiókod azonosítóját – ehhez rendeljük a licencet.
              </p>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={handleBuy} disabled={submitting}>
              {user ? "Megrendelés" : "Belépés a vásárláshoz"}
            </Button>

            <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                Escrow-védett resource. A licenckulcs a szervered IP-jéhez kötődik az első indításkor.
              </p>
              <Link to="/docs" className="inline-block text-primary hover:underline">
                Telepítési útmutató megnyitása
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
