import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/catalog";
import heroImage from "@/assets/hero.jpg";
import { ShieldCheck, KeyRound, Download, Server } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NovaScripts – prémium FiveM scriptek escrow védelemmel" },
      {
        name: "description",
        content:
          "Vásárolj prémium FiveM scripteket: azonnali letöltés, licenckulcsos szerverjogosultság és Asset Escrow védelem ESX, QBCore és standalone szerverekhez.",
      },
      { property: "og:title", content: "NovaScripts – prémium FiveM scriptek" },
      {
        property: "og:description",
        content: "FiveM script bolt licenckulcsos jogosultságkezeléssel és azonnali letöltéssel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const highlights = [
  {
    icon: ShieldCheck,
    title: "Escrow védelem",
    text: "A scriptek magja Asset Escrow-val védett, a config nyitva marad a szerkesztésre.",
  },
  {
    icon: KeyRound,
    title: "Licenckulcs",
    text: "Minden vásárláshoz egyedi kulcs jár, ami a szerveredhez köthető.",
  },
  {
    icon: Download,
    title: "Azonnali letöltés",
    text: "Fizetés után a fiókodból bármikor letöltheted a legfrissebb verziót.",
  },
  {
    icon: Server,
    title: "Szerveroldali ellenőrzés",
    text: "A resource indulásnál ellenőrzi a jogosultságot – lopott másolat nem indul el.",
  },
];

function Home() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border/70">
        <img
          src={heroImage}
          alt="Éjszakai roleplay város hangulatkép"
          width={1920}
          height={1088}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-32">
          <Badge variant="secondary" className="mb-6">
            ESX · QBCore · Standalone
          </Badge>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight md:text-6xl">
            Prémium FiveM scriptek, <span className="text-gradient">valódi licenckezeléssel</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Vedd meg, töltsd le, tedd fel a szerverre. A licenckulcs a szerveredhez kötődik, a resource pedig
            indulásnál ellenőrzi, hogy jogosult vagy-e rá.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#scripts">Scriptek böngészése</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/docs">Hogyan működik?</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.title} className="panel p-5">
            <item.icon className="size-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </section>

      <section id="scripts" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold md:text-3xl">Elérhető scriptek</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Mind escrow-védett, dokumentált és folyamatosan frissített.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="panel h-80 animate-pulse bg-surface-strong/60" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            Még nincs publikált script a boltban.
          </div>
        )}
      </section>
    </main>
  );
}
