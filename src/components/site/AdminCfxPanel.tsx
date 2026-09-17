import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { attachAssetToProduct, importCfxAssets, updateAssetGrant } from "@/lib/cfx.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw } from "lucide-react";

type AssetRow = {
  id: string;
  asset_name: string;
  display_name: string | null;
  version: string | null;
  product_id: string | null;
};

type GrantRow = {
  id: string;
  status: string;
  cfx_id: string | null;
  asset_name: string | null;
  created_at: string;
  products: { name: string } | null;
  user_id: string;
};

export function AdminCfxPanel({ products }: { products: { id: string; name: string }[] }) {
  const queryClient = useQueryClient();
  const importAssets = useServerFn(importCfxAssets);
  const attach = useServerFn(attachAssetToProduct);
  const updateGrant = useServerFn(updateAssetGrant);
  const [raw, setRaw] = useState("");

  const assets = useQuery({
    queryKey: ["admin", "cfx-assets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cfx_assets")
        .select("id, asset_name, display_name, version, product_id")
        .order("asset_name");
      if (error) throw error;
      return data as unknown as AssetRow[];
    },
  });

  const grants = useQuery({
    queryKey: ["admin", "asset-grants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_grants")
        .select("id, status, cfx_id, asset_name, created_at, user_id, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GrantRow[];
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => importAssets({ data: { raw } }),
    onSuccess: (result) => {
      toast.success(`${result.imported} asset beolvasva`);
      setRaw("");
      queryClient.invalidateQueries({ queryKey: ["admin", "cfx-assets"] });
    },
    onError: (error) => toast.error("A beolvasás nem sikerült", { description: (error as Error).message }),
  });

  const attachMutation = useMutation({
    mutationFn: async ({ assetId, productId }: { assetId: string; productId: string | null }) =>
      attach({ data: { assetId, productId } }),
    onSuccess: () => {
      toast.success("Asset hozzárendelve");
      queryClient.invalidateQueries({ queryKey: ["admin", "cfx-assets"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (error) => toast.error("Nem sikerült hozzárendelni", { description: (error as Error).message }),
  });

  const grantMutation = useMutation({
    mutationFn: async ({ grantId, status }: { grantId: string; status: "pending" | "granted" | "failed" }) =>
      updateGrant({ data: { grantId, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "asset-grants"] });
    },
    onError: (error) => toast.error("Nem sikerült frissíteni", { description: (error as Error).message }),
  });

  return (
    <>
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Escrow assetek (Keymaster)</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A CFX nem ad nyilvános API-t a Keymasterhez, ezért az assetlistát a Keymaster „Granted Assets” oldaláról
          kimásolva olvassuk be – soronként egy asset. Formátum: <code className="font-mono">asset_neve</code>,
          vagy <code className="font-mono">asset_neve | Megjelenítendő név | v1.2.0</code>.
        </p>
        <div className="panel mt-4 space-y-3 p-5">
          <Textarea
            rows={5}
            placeholder={"nova_ems | Advanced EMS | v2.4.1\nnova_mdt | Police MDT | v3.1.0"}
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
          <Button onClick={() => importMutation.mutate()} disabled={!raw.trim() || importMutation.isPending}>
            <RefreshCw className="size-4" /> Assetek beolvasása
          </Button>

          <div className="divide-y divide-border">
            {assets.data?.map((asset) => (
              <div key={asset.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-mono">{asset.asset_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {asset.display_name ?? "—"} {asset.version ? `· ${asset.version}` : ""}
                  </p>
                </div>
                <select
                  className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  value={asset.product_id ?? ""}
                  onChange={(event) =>
                    attachMutation.mutate({ assetId: asset.id, productId: event.target.value || null })
                  }
                >
                  <option value="">Nincs scripthez rendelve</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {assets.data?.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">Még nincs beolvasott asset.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Vásárlói hozzáadások</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Másold ki a vásárló CFX azonosítóját, add hozzá a Keymasterben az assethez, majd jelöld itt késznek – a vásárló
          fiókjában azonnal látszik az állapot.
        </p>
        <div className="panel mt-4 divide-y divide-border">
          {grants.data && grants.data.length > 0 ? (
            grants.data.map((grant) => (
              <div key={grant.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium">{grant.products?.name ?? "Script"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(grant.created_at).toLocaleString("hu-HU")} · asset: {grant.asset_name ?? "—"} · CFX:{" "}
                    {grant.cfx_id ?? "nincs megadva"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={grant.status === "granted" ? "default" : grant.status === "failed" ? "destructive" : "secondary"}
                  >
                    {grant.status === "granted" ? "Hozzáadva" : grant.status === "failed" ? "Hiba" : "Várakozik"}
                  </Badge>
                  {grant.cfx_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(grant.cfx_id ?? "");
                        toast.success("CFX azonosító kimásolva");
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    onClick={() => grantMutation.mutate({ grantId: grant.id, status: "granted" })}
                    disabled={grantMutation.isPending || grant.status === "granted"}
                  >
                    Késznek jelölés
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">Még nincs hozzáadási igény.</p>
          )}
        </div>
      </section>
    </>
  );
}
