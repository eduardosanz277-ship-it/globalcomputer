"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { gcCartTotalUnits, type GcCartItem } from "@/lib/store-cart";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { formatUsd } from "@/components/store/store-cart-format";
import { computeCartSubtotal } from "@/components/store/cart-line-price";

export function StoreCartOrderSummary({
  items,
  productsById,
  loading,
  tier,
  variant,
  onContinueShopping,
}: {
  items: GcCartItem[];
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
  tier: StorefrontPriceTier;
  variant: "drawer" | "page";
  onContinueShopping?: () => void;
}) {
  const subtotal = computeCartSubtotal(items, productsById, tier);
  const totalUnits = gcCartTotalUnits(items);
  const hasUnresolvedProducts = items.some(
    (line) => !productsById[line.productId],
  );

  return (
    <div
      className={cn(
        "space-y-4",
        variant === "page" &&
          "lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:p-6 lg:shadow-soft",
        variant === "drawer" && "px-0",
      )}
    >
      {variant === "page" ? (
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Resumen del pedido
        </h2>
      ) : null}

      <div className="space-y-3">
        {/* <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}
            )
          </span>
          <span className="font-semibold tabular-nums text-foreground">
            {loading && items.length > 0 ? "—" : formatUsd(subtotal)}
          </span>
        </div> */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-semibold text-foreground">
            Subtotal ({totalUnits} {totalUnits === 1 ? "artículo" : "artículos"}
            )
          </span>
          <span className="text-xl font-bold tabular-nums text-foreground">
            {loading && items.length > 0 && hasUnresolvedProducts
              ? "—"
              : formatUsd(subtotal)}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Los impuestos y el envío se confirman en el siguiente paso.
        </p>
      </div>

      {variant === "page" ? (
        <div className="flex flex-col gap-2 pt-2">
          <Button type="button" size="lg" className="w-full rounded-xl">
            Finalizar compra
          </Button>
          <Link
            href="/productos"
            className={cn(buttonVariants({ variant: "outline" }), "w-full rounded-xl")}
          >
            Seguir comprando
          </Link>
        </div>
      ) : null}

      {variant === "drawer" && items.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/carrito"
            onClick={onContinueShopping}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-xl sm:flex-1",
            )}
          >
            Ver carrito
          </Link>
          <Button type="button" className="w-full rounded-xl sm:flex-1">
            Finalizar compra
          </Button>
        </div>
      ) : null}
    </div>
  );
}
