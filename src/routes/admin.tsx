import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { approveOrder } from "@/lib/store.functions";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { CfxConnectCard } from "@/components/site/CfxConnectCard";
import { AdminCfxPanel } from "@/components/site/AdminCfxPanel";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin – scriptek és megrendelések | NovaScripts" },
      {
        name: "description",
        content: "Adminfelület a FiveM scriptek, fájlfeltöltések, megrendelések és licenckulcsok kezeléséhez.",
      },
      { property: "og:title", content: "Admin | NovaScripts" },
      { property: "og:description", content: "Scriptek, megrendelések és licencek kezelése." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

type AdminOrder = {
  id: string;
  status: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  cfx_id: string | null;
  user_id: string;
  products: { name: string } | null;
};

const emptyDraft = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  price_cents: 0,
  framework: "esx",
  version: "1.0.0",
  escrow_asset_name: "",
  features: "",
  is_published: false,
  is_featured: false,
};

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const approve = useServerFn(approveOrder);
  const [draft, setDraft] = useState(emptyDraft);

  const products = useQuery({
    queryKey: ["admin", "products"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as (Product & { download_path: string | null })[];
    },
  });

  const orders = useQuery({
    queryKey: ["admin", "orders"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, amount_cents, currency, created_at, cfx_id, user_id, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as AdminOrder[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("products").insert({
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        tagline: draft.tagline.trim(),
        description: draft.description.trim(),
        price_cents: Number(draft.price_cents) || 0,
        framework: draft.framework,
        version: draft.version.trim() || "1.0.0",
        escrow_asset_name: draft.escrow_asset_name.trim() || null,
        features: draft.features
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        is_published: draft.is_published,
        is_featured: draft.is_featured,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Script létrehozva");
      setDraft(emptyDraft);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error("Nem sikerült létrehozni", { description: (error as Error).message }),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("products").update({ is_published: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => toast.error("Nem sikerült módosítani", { description: (error as Error).message }),
  });

  const uploadFile = useMutation({
    mutationFn: async ({ id, slug, file }: { id: string; slug: string; file: File }) => {
      const path = `${slug}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("script-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from("products").update({ download_path: path }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fájl feltöltve");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (error) => toast.error("A feltöltés nem sikerült", { description: (error as Error).message }),
  });

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => approve({ data: { orderId } }),
    onSuccess: (result) => {
      toast.success("Jóváhagyva", { description: `Licenckulcs: ${result.licenseKey}` });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (error) => toast.error("Nem sikerült jóváhagyni", { description: (error as Error).message }),
  });

  if (loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-sm text-muted-foreground">Betöltés…</div>;
  }

  if (!user || !isAdmin) {
    return (
      <main className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Csak adminoknak</h1>
        <p className="mt-3 text-sm text-muted-foreground">Ehhez az oldalhoz admin jogosultság kell.</p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/">Vissza a bolthoz</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl font-semibold">Admin</h1>

      <section className="mt-8">
        <CfxConnectCard userId={user.id} seller />
      </section>

      <AdminCfxPanel products={(products.data ?? []).map((p) => ({ id: p.id, name: p.name }))} />

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Megrendelések</h2>
        <div className="panel mt-4 divide-y divide-border">
          {orders.data && orders.data.length > 0 ? (
            orders.data.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{order.products?.name ?? "Script"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("hu-HU")}
                    {order.cfx_id ? ` · ${order.cfx_id}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span>{formatPrice(order.amount_cents, order.currency)}</span>
                  <Badge variant={order.status === "paid" ? "default" : "secondary"}>{order.status}</Badge>
                  <Button size="sm" onClick={() => approveMutation.mutate(order.id)} disabled={approveMutation.isPending}>
                    Jóváhagyás + kulcs
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Még nincs megrendelés.</p>
          )}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Scriptek</h2>
        <div className="panel mt-4 divide-y divide-border">
          {products.data?.map((product) => (
            <div key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.slug} · {formatPrice(product.price_cents, product.currency)} ·{" "}
                  {product.download_path ?? "nincs fájl"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <Upload className="size-4" />
                  Fájl
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadFile.mutate({ id: product.id, slug: product.slug, file });
                    }}
                  />
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Publikált</span>
                  <Switch
                    checked={product.is_published}
                    onCheckedChange={(value) => togglePublish.mutate({ id: product.id, value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Új script</h2>
        <div className="panel mt-4 grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Név</Label>
            <Input id="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL név (slug)</Label>
            <Input id="slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Ár (centben, pl. 2999 = 29,99 €)</Label>
            <Input
              id="price"
              type="number"
              value={draft.price_cents}
              onChange={(e) => setDraft({ ...draft, price_cents: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="framework">Keretrendszer (esx / qb / standalone)</Label>
            <Input
              id="framework"
              value={draft.framework}
              onChange={(e) => setDraft({ ...draft, framework: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="version">Verzió</Label>
            <Input id="version" value={draft.version} onChange={(e) => setDraft({ ...draft, version: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="asset">Escrow resource neve</Label>
            <Input
              id="asset"
              value={draft.escrow_asset_name}
              onChange={(e) => setDraft({ ...draft, escrow_asset_name: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tagline">Rövid leírás</Label>
            <Input id="tagline" value={draft.tagline} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Hosszú leírás</Label>
            <Textarea
              id="description"
              rows={5}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="features">Funkciók (soronként egy)</Label>
            <Textarea
              id="features"
              rows={4}
              value={draft.features}
              onChange={(e) => setDraft({ ...draft, features: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-6 md:col-span-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.is_published}
                onCheckedChange={(value) => setDraft({ ...draft, is_published: value })}
              />
              <span className="text-sm">Publikált</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.is_featured}
                onCheckedChange={(value) => setDraft({ ...draft, is_featured: value })}
              />
              <span className="text-sm">Kiemelt</span>
            </div>
            <Button className="ml-auto" onClick={() => createProduct.mutate()} disabled={createProduct.isPending}>
              Létrehozás
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
