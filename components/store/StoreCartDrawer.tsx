"use client";

import { StoreCartLineItems } from "@/components/store/StoreCartLineItems";
import { StoreCartOrderSummary } from "@/components/store/StoreCartOrderSummary";
import { useCartProductsMap } from "@/components/store/useCartProductsMap";
import { useGcCart } from "@/components/store/useGcCart";
import { useRunCartMutation } from "@/components/store/useRunCartMutation";
import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import { cn } from "@/utils/cn";
import { ShoppingBasket } from "lucide-react";
import Link from "next/link";

export function StoreCartDrawer({
  open,
  onClose,
  tier,
}: {
  open: boolean;
  onClose: () => void;
  tier: StorefrontPriceTier;
}) {
  const { t } = useI18n();
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
      title={t("storefront.cart.drawerTitle")}
      description={t("storefront.cart.drawerDescription")}
      panelClassName="z-[100] w-full sm:max-w-md"
      contentAriaLabel={t("storefront.cart.drawerContentAria")}
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
            {t("storefront.cart.emptyTitle")}
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            {t("storefront.cart.emptyDescription")}
          </p>
          <Link
            href="/products"
            onClick={onClose}
            className={cn(
              buttonVariants({ variant: "default" }),
              "mt-5 h-11 rounded-xl px-6",
            )}
          >
            {t("storefront.cart.continueShopping")}
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
