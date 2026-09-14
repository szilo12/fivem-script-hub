import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function makeLicenseKey(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `FVM-${block()}-${block()}-${block()}`;
}

/** Megrendelés indítása: a bejelentkezett felhasználó nevében készít egy fizetésre váró rendelést. */
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid(), cfxId: z.string().trim().max(120).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, price_cents, currency, is_published")
      .eq("id", data.productId)
      .maybeSingle();

    if (productError) throw new Error(productError.message);
    if (!product || !product.is_published) throw new Error("A script nem elérhető.");

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        product_id: product.id,
        amount_cents: product.price_cents,
        currency: product.currency,
        status: "pending",
        cfx_id: data.cfxId ?? null,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { orderId: order.id };
  });

/** Admin jóváhagyás: fizetettre állítja a rendelést és licenckulcsot generál. */
export const approveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Nincs jogosultságod ehhez.");

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, user_id, product_id, status, cfx_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("A rendelés nem található.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (order.status !== "paid") {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ status: "paid", provider: order.status === "pending" ? "manual" : null })
        .eq("id", order.id);
      if (error) throw new Error(error.message);
    }

    const { data: existing } = await supabaseAdmin
      .from("licenses")
      .select("id, license_key")
      .eq("order_id", order.id)
      .maybeSingle();
    if (existing) return { licenseKey: existing.license_key };

    const licenseKey = makeLicenseKey();
    const { error } = await supabaseAdmin.from("licenses").insert({
      user_id: order.user_id,
      product_id: order.product_id,
      order_id: order.id,
      license_key: licenseKey,
      cfx_id: order.cfx_id,
    });
    if (error) throw new Error(error.message);
    return { licenseKey };
  });

/** Időlimites letöltési link a saját licencedhez tartozó scripthez. */
export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ licenseId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: license, error } = await supabase
      .from("licenses")
      .select("id, status, product_id, products(name, download_path)")
      .eq("id", data.licenseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!license) throw new Error("Ehhez a licenchez nincs jogosultságod.");
    if (license.status !== "active") throw new Error("A licenc nem aktív.");

    const product = license.products as unknown as { name: string; download_path: string | null } | null;
    if (!product?.download_path) {
      return { url: null as string | null, reason: "Ehhez a scripthez még nincs feltöltve fájl." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from("script-files")
      .createSignedUrl(product.download_path, 300);
    if (signError) throw new Error(signError.message);

    return { url: signed.signedUrl, reason: null as string | null };
  });
