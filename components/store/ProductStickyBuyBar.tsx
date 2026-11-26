"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ButtonPending } from "@/components/ui/button-pending";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatClientError } from "@/lib/errors/format-client-error";
import { gcCartAddProduct } from "@/lib/store-cart";
import { cn } from "@/utils/cn";

type Props = {
  productId: string;
  productName: string;
  priceLabel: string;
  imageUrl?: string | null;
  canBuy: boolean;
};

/** Distancia de scroll (px) a partir de la cual aparece la barra fija. */
const SHOW_AFTER_PX = 700;

/**
 * Barra fija inferior de compra en la ficha de producto: aparece al bajar
 * la página y mantiene visibles foto, precio y botón de añadir al carrito.
 */
export function ProductStickyBuyBar({
  productId,
  productName,
  priceLabel,
  imageUrl,
  canBuy,
}: Props) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform duration-300",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        {imageUrl ? (
          <span className="relative hidden h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/40 sm:block">
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="44px" />
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {productName}
        </span>
        <span className="shrink-0 text-base font-bold tabular-nums text-primary">
          {priceLabel}
        </span>
        <ButtonPending
          type="button"
          disabled={!canBuy}
          pending={isAdding}
          pendingLabel={t("storefront.card.addingPending")}
          skipMinWidth
          className="h-10 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
          onClick={async () => {
            if (!canBuy) {
              toast.info(t("storefront.card.toastNoStock"));
              return;
            }
            setIsAdding(true);
            try {
              await gcCartAddProduct(productId, 1);
            } catch (error) {
              toast.error(
                formatClientError(error, t, {
                  errorMessage: t("storefront.card.toastAddError"),
                }),
              );
            } finally {
              setIsAdding(false);
            }
          }}
        >
          {canBuy
            ? t("storefront.card.addToCart")
            : t("storefront.card.outOfStock")}
        </ButtonPending>
      </div>
    </div>
  );
}
