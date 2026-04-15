"use client";

import { ButtonPending } from "@/components/ui/button-pending";
import { gcCartAddProduct } from "@/lib/store-cart";
import {
  activeDiscountPercent,
  priceAfterDiscount,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import { stockBadgeClass } from "@/lib/storefront-stock";
import {
  isStorefrontProductNew,
  storefrontPrimaryImageUrl,
  type StorefrontProduct,
} from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { ImageOff, Plus, ShoppingCart } from "lucide-react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

/**
 * Un solo glifo compuesto: carrito + «+» en esquina (Lucide no incluye shopping-cart-plus).
 * Solo bajo `lg`; en escritorio el botón usa texto.
 */
function AddToCartGlyphIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-6 w-6 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <ShoppingCart className="relative z-0 h-5 w-5" strokeWidth={2} />
      {/* Mitad sobre el carrito (lado derecho), mitad asomando: típico “badge” */}
      <span className="pointer-events-none absolute right-1 top-2/5 z-[1] flex h-3 w-3 -translate-y-1/2 translate-x-[35%] items-center justify-center rounded-full bg-primary-foreground shadow-md ring-[1.5px] ring-primary/50">
        <Plus className="h-2 w-2 !text-primary" strokeWidth={3} />
      </span>
    </span>
  );
}

export function StorefrontProductGrid({
  products,
  priceTier,
  gridClassName,
}: {
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
  gridClassName?: string;
}) {
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  const handleAddToCart = async (productId: string, canBuy: boolean) => {
    if (!canBuy) {
      toast.info("Este producto no tiene stock disponible.");
      return;
    }
    setAddingProductId(productId);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      await gcCartAddProduct(productId, 1);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo agregar el producto al carrito.";
      toast.error(message);
    } finally {
      setAddingProductId((current) => (current === productId ? null : current));
    }
  };

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-muted/70 px-6 py-12 text-center text-sm text-muted-foreground">
        No hay productos disponibles en esta sección por ahora.
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        gridClassName,
      )}
    >
      {products.map((p) => {
        const img = storefrontPrimaryImageUrl(p);
        const pct = activeDiscountPercent(p, priceTier);
        const sale = priceAfterDiscount(p.price, pct);
        const showCompare = pct > 0 && sale < p.price;
        const stockUi = stockBadgeClass(p.stock);
        const canBuy = p.stock > 0;
        const isNew = isStorefrontProductNew(p);

        return (
          <li
            key={p.id}
            className="group/card flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/40">
              <Link
                href={`/productos/${p.id}`}
                className="absolute inset-0 z-0 block outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
              >
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

              {pct > 0 || isNew ? (
                <div className="pointer-events-none absolute left-2 top-2 z-[3] flex flex-wrap items-center gap-2">
                  {pct > 0 ? (
                    <span
                      className={cn(
                        inter.className,
                        "rounded-full bg-gradient-to-br from-rose-600 to-red-600 px-2 py-[2px] text-[11px] font-semibold tabular-nums text-white shadow-md ring-2 ring-white/25 sm:text-[12px]",
                      )}
                      aria-label={`Descuento ${Math.round(pct)} por ciento`}
                    >
                      −{Math.round(pct)}%
                    </span>
                  ) : null}
                  {isNew ? (
                    <span
                      className={cn(
                        inter.className,
                        "rounded-full bg-emerald-600 px-2 py-[2px] text-[11px] font-semibold text-white shadow-md ring-2 ring-white/25 sm:text-[12px]",
                      )}
                    >
                      Nuevo
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-end px-2 pb-2 pt-6",
                  "lg:justify-center lg:px-2.5 lg:pb-2.5",
                  "translate-y-0 opacity-100 transition-all duration-300 ease-out",
                  /* Solo en pantallas grandes se oculta hasta hover (tablet/móvil no tienen hover fiable). */
                  "lg:translate-y-1 lg:opacity-0",
                  "lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100",
                )}
              >
                <ButtonPending
                  type="button"
                  variant="default"
                  disabled={!canBuy}
                  pending={addingProductId === p.id}
                  pendingLabel={
                    <span className="hidden lg:inline">Añadiendo</span>
                  }
                  skipMinWidth
                  aria-label="Añadir al carrito"
                  className={cn(
                    inter.className,
                    "pointer-events-auto rounded-full border-0 border-white text-primary-foreground shadow-md transition hover:bg-primary hover:shadow-lg",
                    "bg-primary/90 hover:bg-primary",
                    "h-9 w-9 min-w-[2.25rem] shrink-0 px-0 lg:h-9 lg:w-auto lg:min-w-[12rem] lg:max-w-[min(17rem,calc(100%-0.5rem))] lg:px-4 lg:text-sm",
                    "gap-0",
                    "text-[11px] font-medium leading-none tracking-wide lg:text-[13px] lg:font-semibold",
                    "[&_svg]:text-primary-foreground",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleAddToCart(p.id, canBuy);
                  }}
                >
                  <AddToCartGlyphIcon className="lg:hidden" />
                  <span className="hidden lg:inline">Añadir al carrito</span>
                </ButtonPending>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <Link
                href={`/productos/${p.id}`}
                className="min-w-0 outline-none ring-offset-2 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-primary"
              >
                <h3
                  className={cn(
                    inter.className,
                    "text-[14px] font-semibold leading-snug tracking-[0.015em] text-foreground line-clamp-2 transition group-hover/card:text-primary sm:text-[15px]",
                  )}
                >
                  {p.name}
                </h3>
                <p
                  className={cn(
                    inter.className,
                    "mt-1 text-left text-[12px] font-medium leading-tight text-muted-foreground",
                  )}
                >
                  {p.brand_name}
                </p>
              </Link>

              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                {showCompare ? (
                  <>
                    <span
                      className={cn(
                        inter.className,
                        "text-base font-bold tabular-nums text-primary sm:text-lg",
                      )}
                    >
                      {formatUsd(sale)}
                    </span>
                    <span
                      className={cn(
                        inter.className,
                        "shrink-0 text-[13px] font-normal tabular-nums text-muted-foreground line-through decoration-muted-foreground/70",
                      )}
                    >
                      {formatUsd(p.price)}
                    </span>
                  </>
                ) : (
                  <span
                    className={cn(
                      inter.className,
                      "text-base font-semibold tabular-nums text-primary sm:text-lg",
                    )}
                  >
                    {formatUsd(sale)}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  inter.className,
                  "mt-1.5 inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-0.5 text-left text-[12px] font-medium leading-snug sm:text-[12px]",
                  stockUi.cardLabelClassName,
                )}
              >
                {stockUi.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
