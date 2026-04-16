"use client";

import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { StoreCartLineItems } from "@/components/store/StoreCartLineItems";
import { StoreCartOrderSummary } from "@/components/store/StoreCartOrderSummary";
import { useCartProductsMap } from "@/components/store/useCartProductsMap";
import { useGcCart } from "@/components/store/useGcCart";
import { useRunCartMutation } from "@/components/store/useRunCartMutation";

export function StoreCartDrawer({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: StorefrontPriceTier;
}) {
  const items = useGcCart();
  const ids = items.map((i) => i.productId);
  const { productsById, loading } = useCartProductsMap(ids);
  const { mutationPending, runCartMutation } = useRunCartMutation();
  const listBusy = loading || mutationPending;

  /** Solo el carrito vacío real; no mezclar con `loading` (evita skeleton + pie inconsistente al borrar). */
  const isCartEmpty = items.length === 0;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Tu carrito de compras"
      description="Revisa los artículos añadidos antes de continuar."
      panelClassName="z-[100] w-full sm:max-w-md"
      contentAriaLabel="Lista de productos en el carrito"
      contentClassName="bg-muted/90"
      footer={
        !isCartEmpty ? (
          <SlideOverFooter className="flex-col items-stretch gap-0 border-t border-border/70 bg-muted/10 py-5">
            <StoreCartOrderSummary
              items={items}
              productsById={productsById}
              loading={listBusy}
              tier={tier}
              variant="drawer"
              onContinueShopping={onClose}
            />
          </SlideOverFooter>
        ) : null
      }
    >
      {isCartEmpty ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-white/60">
            <ShoppingBasket
              className="h-10 w-10 text-muted-foreground"
              strokeWidth={1.25}
            />
          </div>
          <p className="text-sm font-medium text-foreground">
            Tu carrito está vacío
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Añade productos desde el catálogo para verlos aquí.
          </p>
          <Link
            href="/productos"
            onClick={onClose}
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-5 h-11 rounded-xl px-6",
            )}
          >
            Seguir comprando
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          <StoreCartLineItems
            items={items}
            productsById={productsById}
            loading={loading}
            mutationPending={mutationPending}
            runCartMutation={runCartMutation}
            tier={tier}
            dense
            onProductNavigate={onClose}
          />
        </div>
      )}
    </SlideOver>
  );
}
