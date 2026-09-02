"use client";

import { computeCartSubtotal } from "@/components/store/cart-line-price";
import { formatUsd } from "@/components/store/store-cart-format";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { useI18n } from "@/components/i18n/I18nProvider";
import { resolveClientLocale } from "@/lib/i18n/client-locale";
import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import type { PublicSiteOffer } from "@/lib/site-offer.types";
import {
  gcCartTotalUnits,
  type GcCartItem,
} from "@/lib/store-cart";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import type { ShippingQuote } from "@/modules/shipping/shipping.types";
import { cn } from "@/utils/cn";
import { Gift, Info, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { formatClientError } from "@/lib/errors/format-client-error";
import { toast } from "react-toastify";

/** Skeleton de importe: misma caja que el número para no cambiar la altura de la fila. */
function CartAmountValue({
  pending,
  updatingLabel,
  children,
  className,
}: {
  pending: boolean;
  updatingLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-end leading-none",
        className,
      )}
      aria-busy={pending || undefined}
      aria-live="polite"
    >
      <span className={cn(pending && "invisible")}>{children}</span>
      {pending ? (
        <>
          <span
            className="absolute inset-x-0 inset-y-[0.12em] animate-pulse rounded-sm bg-zinc-300/90 dark:bg-zinc-600/80"
            aria-hidden
          />
          <span className="sr-only">{updatingLabel}</span>
        </>
      ) : null}
    </span>
  );
}

export function StoreCartOrderSummary({
  items,
  productsById,
  loading,
  productsLoadFailed = false,
  tier,
  variant,
  panelOpen,
  onContinueShopping,
  onUiPendingChange,
  onQuoteAddressRequest,
}: {
  items: GcCartItem[];
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
  /** Fallo al hidratar productos: no tratar como “producto no disponible” ni pending infinito. */
  productsLoadFailed?: boolean;
  tier: StorefrontPriceTier;
  variant: "drawer" | "page";
  panelOpen?: boolean;
  onContinueShopping?: () => void;
  /** Notifica al padre para sincronizar skeleton del listado con los importes. */
  onUiPendingChange?: (pending: boolean) => void;
  /** Abre el panel de dirección de envío (página /cart o paso del drawer). */
  onQuoteAddressRequest: () => void;
}) {
  const { t, locale } = useI18n();
  const subtotal = computeCartSubtotal(items, productsById, tier);
  const totalUnits = gcCartTotalUnits(items);
  const hasUnresolvedProducts =
    !productsLoadFailed &&
    items.some((line) => !productsById[line.productId]);
  const hasSurchargeProducts = items.some((line) => {
    const product = productsById[line.productId];
    if (!product) return false;
    return (
      product.shipping_type === "non_standard" &&
      Number(product.shipping_surcharge_per_unit) > 0
    );
  });

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const checkoutLockRef = useRef(false);
  const [liveOffer, setLiveOffer] = useState<PublicSiteOffer | null>(null);
  const [shippingQuote, setShippingQuote] = useState<ShippingQuote | null>(
    null,
  );
  const [shippingLoading, setShippingLoading] = useState(
    () => items.length > 0,
  );

  useEffect(() => {
    if (variant === "drawer" && !panelOpen) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/offer", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as PublicSiteOffer;
        if (!cancelled) setLiveOffer(data);
      } catch {
        if (!cancelled) {
          setLiveOffer({ offerAmount: 0, offerPercentage: 0 });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [variant, panelOpen]);

  useLayoutEffect(() => {
    if (variant === "drawer" && !panelOpen) return;
    if (items.length === 0 || productsLoadFailed) {
      setShippingLoading(false);
      return;
    }
    setShippingLoading(true);
  }, [items, hasUnresolvedProducts, productsLoadFailed, variant, panelOpen, locale]);

  useEffect(() => {
    if (variant === "drawer" && !panelOpen) return;
    if (items.length === 0) {
      setShippingQuote(null);
      setShippingLoading(false);
      return;
    }
    /** Fallo de hidratación: no cotizar envío ni dejar pending infinito. */
    if (productsLoadFailed) {
      setShippingQuote(null);
      setShippingLoading(false);
      return;
    }
    /** Mantener skeleton de envío alineado mientras aún cargan los productos. */
    if (hasUnresolvedProducts) {
      setShippingQuote(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/shop/shipping/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, locale }),
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setShippingQuote(null);
          return;
        }
        const data = (await res.json()) as ShippingQuote;
        if (!cancelled) setShippingQuote(data);
      } catch {
        if (!cancelled) setShippingQuote(null);
      } finally {
        if (!cancelled) setShippingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items, hasUnresolvedProducts, productsLoadFailed, variant, panelOpen, locale]);

  async function goToStripeCheckout() {
    if (checkoutLockRef.current) return;
    if (items.length === 0 || productsLoadFailed || hasUnresolvedProducts) return;
    if (shippingQuote?.requiresQuote) return;
    checkoutLockRef.current = true;
    setCheckoutLoading(true);
    const checkoutLocale = resolveClientLocale(locale);
    console.info("[checkout] locale al pagar", {
      reactLocale: locale,
      resolvedLocale: checkoutLocale,
    });
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale: checkoutLocale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 503 || data.code === "NETWORK") {
          throw new TypeError("Failed to fetch");
        }
        throw new Error(
          data.error ?? t("storefront.cart.toastCheckoutStartError"),
        );
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error(t("storefront.cart.toastCheckoutInvalidResponse"));
    } catch (e) {
      checkoutLockRef.current = false;
      setCheckoutLoading(false);
      toast.error(
        formatClientError(e, t, {
          errorMessage: t("storefront.cart.toastCheckoutStartError"),
        }),
      );
    }
  }

  function openManualQuoteAddress() {
    if (
      items.length === 0 ||
      productsLoadFailed ||
      hasUnresolvedProducts ||
      !shippingQuote?.requiresQuote ||
      !shippingQuote.whatsappUrl
    ) {
      return;
    }
    onQuoteAddressRequest();
  }

  const requiresQuote = Boolean(shippingQuote?.requiresQuote);
  const checkoutDisabled =
    loading ||
    items.length === 0 ||
    productsLoadFailed ||
    hasUnresolvedProducts ||
    checkoutLoading ||
    shippingLoading ||
    requiresQuote ||
    shippingQuote?.status === "no_rate" ||
    shippingQuote?.status === "invalid";

  const offerResolved: PublicSiteOffer = liveOffer ?? {
    offerAmount: 0,
    offerPercentage: 0,
  };
  const offerAmount = offerResolved.offerAmount;
  const offerPercentage = offerResolved.offerPercentage;
  const hasOffer = offerPercentage > 0;
  const formatOfferPercentage = (value: number) =>
    Number.isInteger(value)
      ? value.toString()
      : value.toFixed(2).replace(/\.?0+$/, "");
  const {
    applies: offerApplies,
    discountUsd,
    totalAfterDiscountUsd,
  } = computeSiteOfferOnSubtotal(subtotal, offerResolved);

  const shippingTotal =
    shippingQuote && shippingQuote.status === "ok"
      ? shippingQuote.shippingTotal
      : 0;
  const orderTotal = requiresQuote
    ? totalAfterDiscountUsd
    : totalAfterDiscountUsd + shippingTotal;

  const offerText = t("storefront.cart.offerBanner")
    .replace("{pct}", formatOfferPercentage(offerPercentage))
    .replace("{amount}", formatUsd(offerAmount));

  /** Productos, mutación o envío: un solo pending para importes (y listado vía callback). */
  const pricesPending =
    items.length > 0 && (loading || shippingLoading || hasUnresolvedProducts);

  useLayoutEffect(() => {
    onUiPendingChange?.(pricesPending);
  }, [pricesPending, onUiPendingChange]);

  useEffect(() => {
    return () => {
      onUiPendingChange?.(false);
    };
  }, [onUiPendingChange]);

  const updatingLabel = t("storefront.cart.amountsUpdating");

  const quoteDisabled =
    loading ||
    items.length === 0 ||
    productsLoadFailed ||
    hasUnresolvedProducts ||
    pricesPending ||
    !shippingQuote?.whatsappUrl;

  const payButton = (
    <Button
      type="button"
      size={variant === "page" ? "lg" : "default"}
      className={cn(
        "w-full rounded-xl",
        variant === "drawer" && "sm:flex-1",
        variant === "page" && "md:flex-1 lg:h-10 lg:flex-none lg:w-full",
      )}
      disabled={checkoutDisabled}
      onClick={goToStripeCheckout}
    >
      {checkoutLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          {t("storefront.cart.openCheckout")}
        </>
      ) : (
        t("storefront.cart.payWithStripe")
      )}
    </Button>
  );

  const quoteButton = requiresQuote ? (
    shippingQuote?.whatsappUrl ? (
      <Button
        type="button"
        size={variant === "page" ? "lg" : "default"}
        className={cn(
          "w-full gap-2 rounded-xl",
          variant === "drawer" && "sm:flex-1",
          variant === "page" && "md:flex-1 lg:h-10 lg:flex-none lg:w-full",
        )}
        disabled={quoteDisabled}
        onClick={openManualQuoteAddress}
      >
        <>
          <MessageCircle className="h-4 w-4" aria-hidden />
          {t("storefront.cart.requestShippingQuote")}
        </>
      </Button>
    ) : (
      <Button type="button" className="w-full rounded-xl" disabled>
        {t("storefront.cart.requestShippingQuoteUnavailable")}
      </Button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "space-y-4",
        variant === "page" &&
          "lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:p-6 lg:shadow-soft",
        variant === "drawer" && "px-0",
      )}
    >
      {hasOffer && !offerApplies ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-sm font-medium text-emerald-800">
          <Gift
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
            aria-hidden
          />
          <span>{offerText}</span>
        </div>
      ) : null}

      {variant === "page" ? (
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("storefront.cart.summaryTitle")}
        </h2>
      ) : null}

      <div className="space-y-3">
        <div
          className={cn(
            "flex items-baseline justify-between gap-2",
            variant === "drawer" && "text-sm",
          )}
        >
          <span
            className={cn(
              "font-semibold text-foreground",
              variant === "page" ? "text-base" : "text-sm",
            )}
          >
            {t("storefront.cart.subtotalPrefix")} ({totalUnits}{" "}
            {totalUnits === 1
              ? t("storefront.cart.itemOne")
              : t("storefront.cart.itemMany")}
            ):
          </span>
          <CartAmountValue
            pending={pricesPending}
            updatingLabel={updatingLabel}
            className="text-base font-bold tabular-nums text-foreground"
          >
            {formatUsd(subtotal)}
          </CartAmountValue>
        </div>

        {offerApplies ? (
          <div
            className={cn(
              "flex items-baseline justify-between gap-2 text-emerald-800 dark:text-emerald-200/90",
              variant === "page" && "text-sm",
              variant === "drawer" && "text-xs",
            )}
          >
            <span className="font-semibold">
              {t("storefront.cart.offerDiscountLabel").replace(
                "{pct}",
                formatOfferPercentage(offerPercentage),
              )}
              :
            </span>
            <CartAmountValue
              pending={pricesPending}
              updatingLabel={updatingLabel}
              className="font-semibold tabular-nums"
            >
              {`−${formatUsd(discountUsd)}`}
            </CartAmountValue>
          </div>
        ) : null}

        {requiresQuote ? (
          <div
            role="status"
            className="rounded-xl border border-primary/25 border-l-[3px] border-l-primary bg-[color-mix(in_srgb,#357fd2_9%,white)] px-3.5 py-3 text-xs leading-relaxed shadow-sm"
          >
            <div className="flex items-start gap-1.5">
              <Info
                className="mt-px h-3.5 w-3.5 shrink-0 text-primary"
                strokeWidth={2.25}
                aria-hidden
              />
              <div className="min-w-0 space-y-1.5">
                <p className="font-semibold leading-snug break-words text-primary">
                  {t("storefront.cart.shippingQuoteTitle")}
                </p>
                <p className="leading-relaxed text-primary/85">
                  {t("storefront.cart.shippingQuoteDescription")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex items-baseline justify-between gap-2",
                variant === "page" && "text-sm",
                variant === "drawer" && "text-xs",
              )}
            >
              <span className="font-semibold text-foreground">
                {t("storefront.cart.shippingBaseLabel")}:
              </span>
              <CartAmountValue
                pending={pricesPending}
                updatingLabel={updatingLabel}
                className="font-semibold tabular-nums text-foreground"
              >
                {formatUsd(shippingQuote?.baseRate ?? 0)}
              </CartAmountValue>
            </div>
            {hasSurchargeProducts &&
            (pricesPending || (shippingQuote?.surchargesTotal ?? 0) > 0) ? (
              <div
                className={cn(
                  "flex items-baseline justify-between gap-2",
                  variant === "page" && "text-sm",
                  variant === "drawer" && "text-xs",
                )}
              >
                <span className="font-semibold text-foreground">
                  {t("storefront.cart.shippingSurchargeLabel")}:
                </span>
                <CartAmountValue
                  pending={pricesPending}
                  updatingLabel={updatingLabel}
                  className="font-semibold tabular-nums text-foreground"
                >
                  {formatUsd(shippingQuote?.surchargesTotal ?? 0)}
                </CartAmountValue>
              </div>
            ) : null}
            <div
              className={cn(
                "flex items-baseline justify-between gap-2",
                variant === "page" && "text-sm",
                variant === "drawer" && "text-xs",
              )}
            >
              <span className="font-semibold text-foreground">
                {t("storefront.cart.shippingTotalLabel")}:
              </span>
              <CartAmountValue
                pending={pricesPending}
                updatingLabel={updatingLabel}
                className="font-semibold tabular-nums text-foreground"
              >
                {formatUsd(shippingTotal)}
              </CartAmountValue>
            </div>
          </>
        )}

        <div className="flex items-baseline justify-between gap-2 border-t border-border pt-3">
          <span
            className={cn(
              "font-semibold text-foreground",
              variant === "page" ? "text-lg" : "text-base sm:text-lg",
            )}
          >
            {t("storefront.cart.estimatedTotal")}:
          </span>
          <CartAmountValue
            pending={pricesPending}
            updatingLabel={updatingLabel}
            className={cn(
              "font-semibold tabular-nums text-foreground",
              variant === "page" ? "text-xl" : "text-lg sm:text-xl",
            )}
          >
            {formatUsd(orderTotal)}
          </CartAmountValue>
        </div>

        {/* Temporalmente oculto
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("storefront.cart.stripeInfo")}
        </p>
        */}
      </div>

      {variant === "page" || (variant === "drawer" && items.length > 0) ? (
        <div
          className={cn(
            variant === "drawer" && "-mx-4",
            variant === "page" && "-mx-4 sm:-mx-6 lg:-mx-6",
          )}
        >
          <div
            className="h-px w-full bg-border"
            role="separator"
            aria-label={t("storefront.cart.sectionSeparatorAria")}
          />
        </div>
      ) : null}

      {variant === "page" ? (
        <div className="flex flex-col gap-2 pt-2 md:flex-row lg:flex-col">
          {requiresQuote ? quoteButton : payButton}
          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full rounded-xl md:flex-1 lg:h-10 lg:flex-none lg:w-full",
            )}
          >
            {t("storefront.cart.continueShopping")}
          </Link>
        </div>
      ) : null}

      {variant === "drawer" && items.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          {loading ? (
            <Button
              type="button"
              variant="outline"
              disabled
              className="w-full rounded-xl sm:flex-1"
            >
              {t("storefront.cart.viewCart")}
            </Button>
          ) : (
            <Link
              href="/cart"
              onClick={onContinueShopping}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full rounded-xl sm:flex-1",
              )}
            >
              {t("storefront.cart.viewCart")}
            </Link>
          )}
          {requiresQuote ? quoteButton : payButton}
        </div>
      ) : null}
    </div>
  );
}
