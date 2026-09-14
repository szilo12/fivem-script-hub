import { Link } from "@tanstack/react-router";
import { coverFor, formatPrice, frameworkLabels, type Product } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const cover = coverFor(product);

  return (
    <Link
      to="/scripts/$slug"
      params={{ slug: product.slug }}
      className="group panel overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-glow"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-strong">
        {cover ? (
          <img
            src={cover}
            alt={`${product.name} borítókép`}
            loading="lazy"
            width={1024}
            height={640}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="secondary">{frameworkLabels[product.framework] ?? product.framework}</Badge>
          {product.is_featured ? <Badge>Kiemelt</Badge> : null}
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.tagline}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="font-display text-base font-semibold text-primary">
            {formatPrice(product.price_cents, product.currency)}
          </span>
          <span className="text-xs text-muted-foreground">v{product.version}</span>
        </div>
      </div>
    </Link>
  );
}
