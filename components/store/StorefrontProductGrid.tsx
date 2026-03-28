import Image from "next/image";
import type { StorefrontProduct } from "@/modules/catalog/storefront-products.service";
import { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-products.service";

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function StorefrontProductGrid({
  products,
}: {
  products: StorefrontProduct[];
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
        No hay productos disponibles en esta sección por ahora.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => {
        const img = storefrontPrimaryImageUrl(p);
        return (
          <li
            key={p.id}
            className="flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition hover:shadow-soft-lg"
          >
            <div className="relative aspect-[4/3] w-full bg-muted/40">
              {img ? (
                <Image
                  src={img}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-base font-semibold leading-snug text-foreground line-clamp-2">
                {p.name}
              </h3>
              {p.description ? (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {p.description}
                </p>
              ) : null}
              <p className="mt-auto pt-3 text-lg font-bold text-primary">
                {formatUsd(p.price)}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                SKU {p.sku}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
