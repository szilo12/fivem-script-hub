import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const cfxIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[A-Za-z0-9_.:\-\s]+$/, "Csak betűk, számok és a _ . : - karakterek engedélyezettek.");

/** CFX fiók összekapcsolása (vagy frissítése) a bejelentkezett felhasználóhoz. */
export const linkCfxAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        cfxId: cfxIdSchema,
        forumName: z.string().trim().max(120).optional(),
        isSeller: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("cfx_accounts")
      .select("id, verification_code")
      .eq("user_id", userId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      cfx_id: data.cfxId,
      forum_name: data.forumName ?? null,
      is_seller: data.isSeller ?? false,
      status: "linked",
      connected_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase.from("cfx_accounts").update(payload).eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("cfx_accounts").insert(payload);
      if (error) throw new Error(error.message);
    }

    // A profilban is eltároljuk, hogy a megrendeléseknél kéznél legyen.
    await supabase.from("profiles").update({ cfx_id: data.cfxId }).eq("id", userId);

    // A még nyitott hozzáadási igényekre rávezetjük az új CFX azonosítót.
    await supabase
      .from("asset_grants")
      .update({ cfx_id: data.cfxId })
      .eq("user_id", userId)
      .eq("status", "pending");

    return { ok: true };
  });

/** CFX fiók leválasztása. */
export const unlinkCfxAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cfx_accounts").delete().eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Escrow assetek beolvasása a Keymasterből kimásolt listából.
 * A CFX nem ad nyilvános API-t, ezért a lista beillesztéssel (soronként egy asset) kerül be.
 */
export const importCfxAssets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ raw: z.string().min(1).max(20000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Nincs jogosultságod ehhez.");

    const rows = data.raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Támogatott formák: "asset_name", "asset_name | Megjelenítendő név", "asset_name,v1.2.0"
        const parts = line.split(/[|,;\t]/).map((part) => part.trim());
        const assetName = (parts[0] ?? "").replace(/\s+/g, "_");
        const second = parts[1] ?? "";
        const third = parts[2] ?? "";
        const version = /^v?\d+(\.\d+)*$/i.test(second) ? second : third || null;
        const displayName = version === second ? null : second || null;
        return { assetName, displayName, version };
      })
      .filter((row) => row.assetName.length > 1);

    if (rows.length === 0) throw new Error("Nem találtam asset nevet a beillesztett listában.");

    const { error } = await supabase.from("cfx_assets").upsert(
      rows.map((row) => ({
        owner_id: userId,
        asset_name: row.assetName,
        display_name: row.displayName,
        version: row.version,
        source: "keymaster_paste",
        imported_at: new Date().toISOString(),
      })),
      { onConflict: "owner_id,asset_name" },
    );
    if (error) throw new Error(error.message);

    return { imported: rows.length };
  });

/** Asset hozzárendelése egy scripthez (így a vásárlásnál tudjuk, mit kell a Keymasterben megosztani). */
export const attachAssetToProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ assetId: z.string().uuid(), productId: z.string().uuid().nullable() })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Nincs jogosultságod ehhez.");

    const { data: asset, error: assetError } = await supabase
      .from("cfx_assets")
      .select("asset_name")
      .eq("id", data.assetId)
      .maybeSingle();
    if (assetError) throw new Error(assetError.message);
    if (!asset) throw new Error("Az asset nem található.");

    const { error } = await supabase
      .from("cfx_assets")
      .update({ product_id: data.productId })
      .eq("id", data.assetId);
    if (error) throw new Error(error.message);

    if (data.productId) {
      const { error: productError } = await supabase
        .from("products")
        .update({ escrow_asset_name: asset.asset_name })
        .eq("id", data.productId);
      if (productError) throw new Error(productError.message);
    }

    return { ok: true };
  });

/** Hozzáadási igény állapotának frissítése (admin jelöli, ha a Keymasterben megosztotta). */
export const updateAssetGrant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        grantId: z.string().uuid(),
        status: z.enum(["pending", "granted", "failed"]),
        note: z.string().trim().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Nincs jogosultságod ehhez.");

    const { error } = await supabase
      .from("asset_grants")
      .update({
        status: data.status,
        note: data.note ?? null,
        granted_at: data.status === "granted" ? new Date().toISOString() : null,
      })
      .eq("id", data.grantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
