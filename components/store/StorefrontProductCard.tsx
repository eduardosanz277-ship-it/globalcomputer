"use client";

import { ButtonPending } from "@/components/ui/button-pending";
import { gcCartAddProduct } from "@/lib/store-cart";
import {
  activeDiscountPercent,
  resolveStorefrontBasePrice,
  resolveStorefrontUnitPrice,
  type StorefrontPriceTier,
} from "@/lib/storefront-pricing";
import { stockBadgeClass } from "@/lib/storefront-stock";
import {
  isStorefrontProductNew,
  storefrontLocalizedText,
  storefrontPrimaryImageUrl,
  storefrontProductDisplayName,
  type StorefrontProduct,
} from "@/modules/catalog/storefront-product.shared";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatClientError } from "@/lib/errors/format-client-error";
import { buildStorefrontProductHref } from "@/lib/storefront-product-nav";
import { cn } from "@/utils/cn";
import { ImageOff, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

function formatUsd(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}

function AddToCartGlyphIcon({
  className,
  plain,
}: {
  className?: string;
  /** Sin sombra en el badge «+». */
  plain?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-6 w-6 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <ShoppingCart className="relative z-0 h-5 w-5" strokeWidth={2} />
      <span
        className={cn(
          "pointer-events-none absolute right-1 top-2/5 z-[1] flex h-3 w-3 -translate-y-1/2 translate-x-[35%] items-center justify-center rounded-full bg-primary-foreground ring-[1.5px] ring-primary/50",
          plain ? "shadow-none" : "shadow-md",
        )}
      >
        <Plus className="h-2 w-2 !text-primary" strokeWidth={3} />
      </span>
    </span>
  );
}

export type StorefrontProductCardProps = {
  product: StorefrontProduct;
  priceTier: StorefrontPriceTier;
  /** Clases Tailwind para el `<li>` (p. ej. ancho en carrusel). */
  className?: string;
  interClassName?: string;
  /**
   * Fila sobre fondo plano (p. ej. productos similares): sin sombras, sin borde,
   * sin elevación al hover, superficies opacas sin mezclas.
   */
  embedPlain?: boolean;
  /** Clases extra para el contenedor de la imagen (p. ej. otra proporción). */
  imageClassName?: string;
};

export function StorefrontProductCard({
  product: p,
  priceTier,
  className,
  interClassName,
  embedPlain = false,
  imageClassName,
}: StorefrontProductCardProps) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const productHref = useMemo(
    () => buildStorefrontProductHref(p.slug, pathname, searchParams.get("q")),
    [p.slug, pathname, searchParams],
  );
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const displayName = storefrontProductDisplayName(p, locale);
  const displayBrand = storefrontLocalizedText(
    locale,
    p.brand_name,
    p.brand_name_en,
  )?.toUpperCase();

  const handleAddToCart = async (productId: string, canBuy: boolean) => {
    if (!canBuy) {
      toast.info(t("storefront.card.toastNoStock"));
      return;
    }
    setAddingProductId(productId);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 220));
      await gcCartAddProduct(productId, 1);
    } catch (error) {
      toast.error(
        formatClientError(error, t, {
          errorMessage: t("storefront.card.toastAddError"),
        }),
      );
    } finally {
      setAddingProductId((current) => (current === productId ? null : current));
    }
  };

  const img = storefrontPrimaryImageUrl(p);
  const pct = activeDiscountPercent(p, priceTier);
  const listPrice = resolveStorefrontBasePrice(p, priceTier);
  const sale = resolveStorefrontUnitPrice(p, priceTier);
  const showCompare = pct > 0 && sale < listPrice;
  const stockUi = stockBadgeClass(p.stock, locale);
  const canBuy = p.stock > 0;
  const isNew = isStorefrontProductNew(p);

  return (
    <li
      className={cn(
        /*
         * `overflow-hidden` se mueve al contenedor de imagen (abajo) para que no
         * comparta elemento con `box-shadow` + `transform`. Tenerlos juntos crea un
         * contexto de composición que recorta la sombra propia en Chrome/Safari.
         */
        "group/card flex flex-col rounded-2xl bg-card",
        embedPlain
          ? "border-0 shadow-sm outline-none ring-0 transition-shadow hover:translate-y-0 hover:shadow-md"
          : "border border-border/50 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-soft-lg",
        className,
      )}
    >
      <div
        className={cn(
          /*
           * `overflow-hidden` + `rounded-t-2xl` aquí recortan la imagen y el overlay
           * a los bordes redondeados superiores de la tarjeta sin afectar la sombra del <li>.
           */
          "relative aspect-square w-full overflow-hidden rounded-t-2xl",
          embedPlain ? "bg-[rgb(229,231,235)]" : "bg-muted/40",
          imageClassName,
        )}
      >
        <Link
          href={productHref}
          className="absolute inset-0 z-0 block outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
        >
          {img ? (
            <Image
              src={img}
              alt={displayName}
              fill
              className={cn(
                "object-cover transition duration-500 ease-out",
                embedPlain
                  ? "group-hover/card:scale-100"
                  : "group-hover/card:scale-[1.04]",
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div
              className={cn(
                "flex h-full flex-col items-center justify-center gap-2 text-muted-foreground",
                embedPlain
                  ? "bg-[rgb(239,240,241)]"
                  : "bg-gradient-to-b from-muted/50 to-muted/80",
              )}
              role="img"
              aria-label={t("storefront.card.imageMissingAria")}
            >
              <ImageOff
                className="h-12 w-12 opacity-50"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="sr-only">
                {t("storefront.card.imageMissingSr")}
              </span>
            </div>
          )}
        </Link>

        {pct > 0 || isNew ? (
          <div className="pointer-events-none absolute left-2 top-2 z-[3] flex flex-wrap items-center gap-2">
            {pct > 0 ? (
              <span
                className={cn(
                  interClassName,
                  "rounded-full bg-gradient-to-br from-rose-600 to-red-600 px-2 py-[2px] text-[11px] font-semibold tabular-nums text-white ring-2 ring-white/25 sm:text-[12px]",
                  embedPlain ? "shadow-none" : "shadow-md",
                )}
                aria-label={t("storefront.card.discountAria").replace(
                  "{pct}",
                  String(Math.round(pct)),
                )}
              >
                −{Math.round(pct)}%
              </span>
            ) : null}
            {isNew ? (
              <span
                className={cn(
                  interClassName,
                  "rounded-full bg-emerald-600 px-2 py-[2px] text-[11px] font-semibold text-white ring-2 ring-white/25 sm:text-[12px]",
                  embedPlain ? "shadow-none" : "shadow-md",
                )}
              >
                {t("storefront.card.newBadge")}
              </span>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-[2] flex justify-end px-2 pb-2 pt-6",
            "lg:justify-center lg:px-2.5 lg:pb-2.5",
            "translate-y-0 opacity-100 transition-all duration-300 ease-out",
            "lg:translate-y-1 lg:opacity-0",
            "lg:group-hover/card:translate-y-0 lg:group-hover/card:opacity-100",
          )}
        >
          <span
            className={cn(
              "pointer-events-auto inline-flex max-w-full",
              addingProductId === p.id && "cursor-wait",
            )}
            onClickCapture={(e) => {
              if (addingProductId === p.id) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          >
            <ButtonPending
              type="button"
              variant="default"
              disabled={!canBuy}
              pending={addingProductId === p.id}
              pendingLabel={
                <span className="hidden lg:inline">
                  {t("storefront.card.addingPending")}
                </span>
              }
              pendingClassName="relative max-lg:inline-flex max-lg:items-center max-lg:justify-center max-lg:p-0 lg:gap-2"
              pendingLoaderClassName="text-primary-foreground max-lg:absolute max-lg:left-[calc(50%-0.5rem)] max-lg:top-[calc(50%-0.5rem)] max-lg:!m-0"
              skipMinWidth
              aria-label={
                canBuy
                  ? t("storefront.card.addToCartAria")
                  : t("storefront.card.outOfStockAria")
              }
              className={cn(
                interClassName,
                "pointer-events-auto rounded-full border-0 border-white text-primary-foreground transition hover:bg-primary",
                embedPlain
                  ? "shadow-none hover:shadow-none"
                  : "shadow-md hover:shadow-lg",
                "bg-primary/90 hover:bg-primary",
                canBuy
                  ? "h-9 w-9 min-w-[2.25rem] shrink-0 px-0 lg:h-9 lg:w-auto lg:min-w-[12rem] lg:max-w-[min(17rem,calc(100%-0.5rem))] lg:px-4 lg:text-sm"
                  : "h-9 w-auto min-w-[5.75rem] shrink-0 px-2.5 lg:min-w-[12rem] lg:max-w-[min(17rem,calc(100%-0.5rem))] lg:px-4 lg:text-sm",
                "gap-0",
                "text-[11px] font-medium leading-none tracking-wide lg:text-[13px] lg:font-semibold",
                "[&_svg]:text-primary-foreground",
                addingProductId === p.id && "disabled:!opacity-100",
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleAddToCart(p.id, canBuy);
              }}
            >
              {canBuy ? (
                <>
                  <AddToCartGlyphIcon
                    className="lg:hidden"
                    plain={embedPlain}
                  />
                  <span className="hidden lg:inline">
                    {t("storefront.card.addToCart")}
                  </span>
                </>
              ) : (
                <span className="text-center">
                  {t("storefront.card.outOfStock")}
                </span>
              )}
            </ButtonPending>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={productHref}
          className="min-w-0 outline-none ring-offset-2 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-primary"
        >
          <h3
            className={cn(
              interClassName,
              "text-[14px] font-semibold leading-snug tracking-[0.015em] text-foreground line-clamp-2 transition group-hover/card:text-primary sm:text-[15px]",
            )}
          >
            <p
              className={cn(
                interClassName,
                "mb-0.5 text-left text-[11px] font-semibold leading-tight tracking-wide text-muted-foreground",
              )}
            >
              {displayBrand}
            </p>
            {displayName}
          </h3>
          {p.sku ? (
            <p
              className={cn(
                interClassName,
                "mb-2 mt-1 text-left text-[11px] leading-tight",
              )}
            >
              <span className="text-muted-foreground/80">SKU </span>
              <span className="text-muted-foreground">{p.sku}</span>
            </p>
          ) : null}
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {showCompare ? (
            <>
              <span
                className={cn(
                  interClassName,
                  "text-base font-bold tabular-nums text-primary sm:text-lg",
                )}
              >
                {formatUsd(sale)}
              </span>
              <span
                className={cn(
                  interClassName,
                  "shrink-0 text-[13px] font-normal tabular-nums text-muted-foreground line-through decoration-muted-foreground/70",
                )}
              >
                {formatUsd(listPrice)}
              </span>
            </>
          ) : (
            <span
              className={cn(
                interClassName,
                "text-base font-semibold tabular-nums text-primary sm:text-lg",
              )}
            >
              {formatUsd(sale)}
            </span>
          )}
        </div>

        <span
          className={cn(
            interClassName,
            "mt-1.5 inline-flex w-fit max-w-full items-center rounded-full border px-2.5 py-0.5 text-left text-[12px] font-medium leading-snug sm:text-[12px]",
            stockUi.cardLabelClassName,
          )}
        >
          {stockUi.label}
        </span>
      </div>
    </li>
  );
}
