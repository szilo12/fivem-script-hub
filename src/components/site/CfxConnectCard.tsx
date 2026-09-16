import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { linkCfxAccount, unlinkCfxAccount } from "@/lib/cfx.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Link2Off } from "lucide-react";

type CfxAccount = {
  id: string;
  cfx_id: string;
  forum_name: string | null;
  status: string;
  is_seller: boolean;
  connected_at: string | null;
};

type GrantRow = {
  id: string;
  status: string;
  asset_name: string | null;
  cfx_id: string | null;
  granted_at: string | null;
  products: { name: string } | null;
};

export function CfxConnectCard({ userId, seller = false }: { userId: string; seller?: boolean }) {
  const queryClient = useQueryClient();
  const link = useServerFn(linkCfxAccount);
  const unlink = useServerFn(unlinkCfxAccount);
  const [cfxId, setCfxId] = useState("");
  const [forumName, setForumName] = useState("");

  const account = useQuery({
    queryKey: ["cfx-account", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cfx_accounts")
        .select("id, cfx_id, forum_name, status, is_seller, connected_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as CfxAccount) ?? null;
    },
  });

  const grants = useQuery({
    queryKey: ["asset-grants", userId],
    enabled: !seller,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_grants")
        .select("id, status, asset_name, cfx_id, granted_at, products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as GrantRow[];
    },
  });

  const linkMutation = useMutation({
    mutationFn: async () =>
      link({ data: { cfxId, forumName: forumName || undefined, isSeller: seller } }),
    onSuccess: () => {
      toast.success("CFX fiók összekapcsolva");
      setCfxId("");
      setForumName("");
      queryClient.invalidateQueries({ queryKey: ["cfx-account"] });
      queryClient.invalidateQueries({ queryKey: ["asset-grants"] });
    },
    onError: (error) => toast.error("Nem sikerült összekapcsolni", { description: (error as Error).message }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => unlink({}),
    onSuccess: () => {
      toast.success("CFX fiók leválasztva");
      queryClient.invalidateQueries({ queryKey: ["cfx-account"] });
    },
    onError: (error) => toast.error("Nem sikerült leválasztani", { description: (error as Error).message }),
  });

  const linked = account.data;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link2 className="size-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">CFX fiók</h2>
        </div>
        {linked ? <Badge>Összekapcsolva</Badge> : <Badge variant="secondary">Nincs összekapcsolva</Badge>}
      </div>

      {linked ? (
        <div className="mt-4 space-y-3 text-sm">
          <p>
            CFX azonosító: <code className="font-mono text-primary">{linked.cfx_id}</code>
          </p>
          {linked.forum_name ? (
            <p className="text-muted-foreground">Fórum név: {linked.forum_name}</p>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => unlinkMutation.mutate()} disabled={unlinkMutation.isPending}>
            <Link2Off className="size-4" /> Leválasztás
          </Button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:max-w-md">
          <p className="text-sm text-muted-foreground">
            {seller
              ? "Add meg a Keymaster fiókodhoz tartozó CFX azonosítót, hogy az escrow assetjeidet a scriptekhez tudd rendelni."
              : "Add meg a CFX azonosítódat (Keymaster / forum fiók), így a megvásárolt scripteket hozzá tudjuk adni a fiókodhoz."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="cfx-id">CFX azonosító</Label>
            <Input
              id="cfx-id"
              placeholder="pl. cfx_id: 1234567 vagy license/szerver azonosító"
              value={cfxId}
              onChange={(event) => setCfxId(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfx-forum">Fórum név (opcionális)</Label>
            <Input
              id="cfx-forum"
              placeholder="forum.cfx.re felhasználónév"
              value={forumName}
              onChange={(event) => setForumName(event.target.value)}
            />
          </div>
          <Button onClick={() => linkMutation.mutate()} disabled={!cfxId.trim() || linkMutation.isPending}>
            Összekapcsolás
          </Button>
        </div>
      )}

      {!seller ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold">Escrow hozzáférések</h3>
          {grants.data && grants.data.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {grants.data.map((grant) => (
                <li key={grant.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-strong px-3 py-2">
                  <span>
                    {grant.products?.name ?? "Script"}
                    {grant.asset_name ? <span className="text-muted-foreground"> · {grant.asset_name}</span> : null}
                  </span>
                  <Badge variant={grant.status === "granted" ? "default" : grant.status === "failed" ? "destructive" : "secondary"}>
                    {grant.status === "granted" ? "Hozzáadva" : grant.status === "failed" ? "Hiba" : "Feldolgozás alatt"}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Még nincs hozzáadási igény. Vásárlás után itt látszik, mikor kerül a script a CFX fiókodhoz.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
