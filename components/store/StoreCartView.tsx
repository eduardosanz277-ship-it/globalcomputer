"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { cn } from "@/utils/cn";
import { StoreCartLineItems } from "@/components/store/StoreCartLineItems";
import { StoreCartOrderSummary } from "@/components/store/StoreCartOrderSummary";
import { useCartProductsMap } from "@/components/store/useCartProductsMap";
import { useGcCart } from "@/components/store/useGcCart";
import { useRunCartMutation } from "@/components/store/useRunCartMutation";

export function StoreCartView({ tier }: { tier: StorefrontPriceTier }) {
  const items = useGcCart();
  const ids = items.map((i) => i.productId);
  const { productsById, loading } = useCartProductsMap(ids);
  const { mutationPending, runCartMutation } = useRunCartMutation();
  const listBusy = loading || mutationPending;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center md:py-14">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-white/60 shadow-inner">
          <ShoppingBasket
            className="h-10 w-10 text-muted-foreground"
            strokeWidth={1.25}
          />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Tu carrito está vacío
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Explora el catálogo y añade productos para verlos aquí.
        </p>
        <Link
          href="/productos"
          className={cn(
            buttonVariants({ variant: "default" }),
            "mt-6 h-11 rounded-xl px-6",
          )}
        >
          Seguir comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 md:gap-6 sm:px-6 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-10">
      <div className={cn("space-y-3 lg:col-span-8")}>
        <StoreCartLineItems
          items={items}
          productsById={productsById}
          loading={loading}
          mutationPending={mutationPending}
          runCartMutation={runCartMutation}
          tier={tier}
        />
        <div
          className="-mx-4 h-px bg-border/70 lg:hidden"
          role="separator"
          aria-label="Separador de secciones del carrito"
        />
      </div>

      <aside className="lg:col-span-4 lg:sticky lg:top-24 transition-all duration-300">
        <StoreCartOrderSummary
          items={items}
          productsById={productsById}
          loading={listBusy}
          tier={tier}
          variant="page"
        />
      </aside>
    </div>
  );
}
