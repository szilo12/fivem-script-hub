import coverEms from "@/assets/cover-ems.jpg";
import coverMdt from "@/assets/cover-mdt.jpg";
import coverShop from "@/assets/cover-shop.jpg";

const fallbackCovers: Record<string, string> = {
  "advanced-ems": coverEms,
  "police-mdt": coverMdt,
  "vehicle-shop": coverShop,
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price_cents: number;
  currency: string;
  framework: string;
  version: string;
  cover_url: string | null;
  escrow_asset_name: string | null;
  features: string[];
  is_published: boolean;
  is_featured: boolean;
};

export function coverFor(product: Pick<Product, "slug" | "cover_url">): string | undefined {
  return product.cover_url ?? fallbackCovers[product.slug];
}

export function formatPrice(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export const frameworkLabels: Record<string, string> = {
  esx: "ESX",
  qb: "QBCore",
  standalone: "Standalone",
  other: "Egyéb",
};
