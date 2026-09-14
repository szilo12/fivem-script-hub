import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  license_key: z.string().trim().min(6).max(64),
  resource: z.string().trim().max(120).optional(),
  server_ip: z.string().trim().max(120).optional(),
  cfx_id: z.string().trim().max(160).optional(),
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/**
 * Publikus licenc-ellenőrző végpont a FiveM szerverekhez.
 * A szerveroldali script ide POST-ol induláskor és időnként újra.
 */
export const Route = createFileRoute("/api/public/license/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let parsed: z.infer<typeof bodySchema>;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return json({ valid: false, error: "invalid_request" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: license, error } = await supabaseAdmin
          .from("licenses")
          .select("id, status, server_ip, activations, product_id, products(name, slug, escrow_asset_name, version)")
          .eq("license_key", parsed.license_key.toUpperCase())
          .maybeSingle();

        if (error) return json({ valid: false, error: "server_error" }, 500);
        if (!license) return json({ valid: false, error: "unknown_key" }, 404);
        if (license.status !== "active") return json({ valid: false, error: `license_${license.status}` }, 403);

        const product = license.products as unknown as {
          name: string;
          slug: string;
          escrow_asset_name: string | null;
          version: string;
        } | null;

        if (parsed.resource && product?.escrow_asset_name && parsed.resource !== product.escrow_asset_name) {
          return json({ valid: false, error: "resource_mismatch" }, 403);
        }

        const boundIp = license.server_ip;
        if (boundIp && parsed.server_ip && boundIp !== parsed.server_ip) {
          return json({ valid: false, error: "ip_mismatch", bound_ip: boundIp }, 403);
        }

        const patch: { last_check_at: string; activations: number; server_ip: string | null; cfx_id?: string } = {
          last_check_at: new Date().toISOString(),
          activations: license.activations + 1,
          server_ip: boundIp ?? parsed.server_ip ?? null,
        };
        if (parsed.cfx_id) patch.cfx_id = parsed.cfx_id;

        await supabaseAdmin.from("licenses").update(patch).eq("id", license.id);

        return json({
          valid: true,
          product: product?.name ?? null,
          resource: product?.escrow_asset_name ?? null,
          version: product?.version ?? null,
        });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "content-type",
            "access-control-allow-methods": "POST, OPTIONS",
          },
        }),
    },
  },
});
