"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageOff, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { gcCartAddProduct } from "@/lib/store-cart";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { stockBadgeClass } from "@/lib/storefront-stock";
import { storefrontPrimaryImageUrl } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

export function StorefrontProductGrid({
  products,
  priceTier,
}: {
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
}) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-muted/70 px-6 py-12 text-center text-sm text-muted-foreground">
        No hay productos disponibles en esta sección por ahora.
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((p) => {
        const img = storefrontPrimaryImageUrl(p);
        const pct = activeDiscountPercent(p, priceTier);
        const sale = priceAfterDiscount(p.price, pct);
        const showCompare = pct > 0 && sale < p.price;
        const stockUi = stockBadgeClass(p.stock);
        const canBuy = p.stock > 0;

        return (
          <li
            key={p.id}
            className="group/card flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
          >
            <Link
              href={`/productos/${p.id}`}
              className="relative block aspect-[4/3] w-full overflow-hidden bg-muted/40 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
            >
              {pct > 0 ? (
                <span
                  className="absolute left-2 top-2 z-[1] rounded-full bg-gradient-to-br from-rose-600 to-red-600 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white shadow-md ring-2 ring-white/25"
                  aria-label={`Descuento ${Math.round(pct)} por ciento`}
                >
                  −{Math.round(pct)}%
                </span>
              ) : null}
              <span
                className={cn(
                  "absolute right-2 top-2 z-[1] inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums shadow-md",
                  stockUi.className,
                )}
              >
                {stockUi.label}
              </span>
              {img ? (
                <Image
                  src={img}
                  alt={p.name}
                  fill
                  className="object-cover transition duration-500 ease-out group-hover/card:scale-[1.04]"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              ) : (
                <div
                  className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted/50 to-muted/80 text-muted-foreground"
                  role="img"
                  aria-label="Sin imagen del producto"
                >
                  <ImageOff
                    className="h-12 w-12 opacity-50"
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <span className="sr-only">Sin imagen</span>
                </div>
              )}
            </Link>

            <div className="flex flex-1 flex-col p-4">
              <Link
                href={`/productos/${p.id}`}
                className="min-w-0 outline-none ring-offset-2 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition group-hover/card:text-primary/90">
                  {p.brand_name}
                </p>
                <h3 className="mt-1.5 font-display text-base font-semibold leading-snug text-foreground line-clamp-2 min-h-[2.75rem] transition group-hover/card:text-primary">
                  {p.name}
                </h3>
              </Link>

              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-lg font-bold tabular-nums text-primary">
                  {formatUsd(sale)}
                </span>
                {showCompare ? (
                  <span className="text-sm tabular-nums text-muted-foreground line-through decoration-2 decoration-muted-foreground/70">
                    {formatUsd(p.price)}
                  </span>
                ) : null}
              </div>

              <Button
                type="button"
                variant="default"
                disabled={!canBuy}
                className="mt-4 h-11 w-full gap-2 rounded-xl text-sm font-semibold shadow-sm transition hover:shadow-md"
                onClick={() => {
                  if (!canBuy) {
                    toast.info("Este producto no tiene stock disponible.");
                    return;
                  }
                  gcCartAddProduct(p.id, 1);
                  toast.success(`${p.name} · añadido al carrito`);
                }}
              >
                <ShoppingCart className="h-4 w-4 shrink-0" strokeWidth={2} />
                Añadir al carrito
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
