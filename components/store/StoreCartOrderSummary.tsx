"use client";

import { computeCartSubtotal } from "@/components/store/cart-line-price";
import {
  ManualQuoteShippingAddressDialog,
  type ManualQuoteShippingAddressValues,
} from "@/components/store/ManualQuoteShippingAddressDialog";
import { formatUsd } from "@/components/store/store-cart-format";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { useI18n } from "@/components/i18n/I18nProvider";
import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import type { PublicSiteOffer } from "@/lib/site-offer.types";
import {
  gcCartClear,
  gcCartTotalUnits,
  type GcCartItem,
} from "@/lib/store-cart";
import { redirectAfterManualQuoteSuccess, openWhatsAppWindowForUserGesture, closePreOpenedWhatsAppWindow } from "@/lib/manual-quote-success";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import type { ShippingQuote } from "@/modules/shipping/shipping.types";
import { cn } from "@/utils/cn";
import { Gift, Info, Loader2, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "react-toastify";

/** Skeleton de importe: mantiene layout estable mientras se actualizan precios (patrón ecommerce). */
function CartAmountSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "inline-block animate-pulse rounded-md",
        "bg-zinc-300/90 dark:bg-zinc-600/80",
        size === "sm" && "h-3.5 w-14",
        size === "md" && "h-4 w-16",
        size === "lg" && "h-5 w-[4.75rem]",
      )}
      aria-hidden
    />
  );
}

function CartAmountValue({
  pending,
  size = "md",
  updatingLabel,
  children,
  className,
}: {
  pending: boolean;
  size?: "sm" | "md" | "lg";
  updatingLabel: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[1em] items-center justify-end",
        className,
      )}
      aria-busy={pending || undefined}
      aria-live="polite"
    >
      {pending ? (
        <>
          <CartAmountSkeleton size={size} />
          <span className="sr-only">{updatingLabel}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

export function StoreCartOrderSummary({
  items,
  productsById,
  loading,
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
  tier: StorefrontPriceTier;
  variant: "drawer" | "page";
  panelOpen?: boolean;
  onContinueShopping?: () => void;
  /** Notifica al padre para sincronizar skeleton del listado con los importes. */
  onUiPendingChange?: (pending: boolean) => void;
  /**
   * Si se define (p. ej. drawer), el padre abre el modal de dirección fuera del
   * panel del carrito para que quede por encima y pueda ocultar el carrito.
   */
  onQuoteAddressRequest?: () => void;
}) {
  const { t, locale } = useI18n();
  const subtotal = computeCartSubtotal(items, productsById, tier);
  const totalUnits = gcCartTotalUnits(items);
  const hasUnresolvedProducts = items.some(
    (line) => !productsById[line.productId],
  );

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteAddressOpen, setQuoteAddressOpen] = useState(false);
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

  useEffect(() => {
    if (variant === "drawer" && !panelOpen) return;
    if (items.length === 0) {
      setShippingQuote(null);
      setShippingLoading(false);
      return;
    }
    /** Mantener skeleton de envío alineado mientras aún cargan los productos. */
    if (hasUnresolvedProducts) {
      setShippingQuote(null);
      setShippingLoading(true);
      return;
    }

    let cancelled = false;
    setShippingLoading(true);
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
  }, [items, hasUnresolvedProducts, variant, panelOpen, locale]);

  async function goToStripeCheckout() {
    if (items.length === 0 || hasUnresolvedProducts) return;
    if (shippingQuote?.requiresQuote) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
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
      const msg =
        e instanceof Error
          ? e.message
          : t("storefront.cart.toastCheckoutStartError");
      toast.error(msg);
    } finally {
      setCheckoutLoading(false);
    }
  }

  function openManualQuoteAddress() {
    if (
      quoteLoading ||
      items.length === 0 ||
      hasUnresolvedProducts ||
      !shippingQuote?.requiresQuote ||
      !shippingQuote.whatsappUrl
    ) {
      return;
    }
    if (onQuoteAddressRequest) {
      onQuoteAddressRequest();
      return;
    }
    setQuoteAddressOpen(true);
  }

  async function requestManualQuote(
    shippingAddress: ManualQuoteShippingAddressValues,
  ) {
    if (
      quoteLoading ||
      items.length === 0 ||
      hasUnresolvedProducts ||
      !shippingQuote?.requiresQuote ||
      !shippingQuote.whatsappUrl
    ) {
      return;
    }
    const whatsappWindow = openWhatsAppWindowForUserGesture(
      t("storefront.cart.openingWhatsApp"),
    );
    setQuoteLoading(true);
    try {
      const res = await fetch("/api/site-orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
          })),
          locale,
          shippingAddress,
        }),
      });
      const data = (await res.json()) as {
        whatsappUrl?: string;
        order?: { order_number?: string };
        error?: string;
      };
      if (!res.ok || !data.whatsappUrl) {
        throw new Error(
          data.error ?? t("storefront.cart.toastQuoteOrderError"),
        );
      }

      await gcCartClear();
      redirectAfterManualQuoteSuccess(data.whatsappUrl, {
        preOpenedWindow: whatsappWindow,
        orderNumber: data.order?.order_number,
      });
    } catch (e) {
      closePreOpenedWhatsAppWindow(whatsappWindow);
      const msg =
        e instanceof Error
          ? e.message
          : t("storefront.cart.toastQuoteOrderError");
      toast.error(msg);
      setQuoteLoading(false);
    }
  }

  const requiresQuote = Boolean(shippingQuote?.requiresQuote);
  const checkoutDisabled =
    loading ||
    items.length === 0 ||
    hasUnresolvedProducts ||
    checkoutLoading ||
    quoteLoading ||
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

  useEffect(() => {
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
    hasUnresolvedProducts ||
    quoteLoading ||
    pricesPending ||
    !shippingQuote?.whatsappUrl;

  const payButton = (
    <Button
      type="button"
      size={variant === "page" ? "lg" : "default"}
      className={cn("w-full rounded-xl", variant === "drawer" && "sm:flex-1")}
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
        )}
        disabled={quoteDisabled}
        onClick={openManualQuoteAddress}
      >
        {quoteLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {t("storefront.cart.requestShippingQuotePending")}
          </>
        ) : (
          <>
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t("storefront.cart.requestShippingQuote")}
          </>
        )}
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
      {!onQuoteAddressRequest ? (
        <ManualQuoteShippingAddressDialog
          open={quoteAddressOpen}
          onOpenChange={setQuoteAddressOpen}
          submitting={quoteLoading}
          onSubmit={requestManualQuote}
        />
      ) : null}
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
            size="md"
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
              size="sm"
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
                size="sm"
                updatingLabel={updatingLabel}
                className="font-semibold tabular-nums text-foreground"
              >
                {formatUsd(shippingQuote?.baseRate ?? 0)}
              </CartAmountValue>
            </div>
            {pricesPending || (shippingQuote?.surchargesTotal ?? 0) > 0 ? (
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
                  size="sm"
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
                size="sm"
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
            size="lg"
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
            "h-px w-full bg-border",
            variant === "drawer" && "-mx-4",
            variant === "page" && "lg:-mx-6",
          )}
          role="separator"
          aria-label={t("storefront.cart.sectionSeparatorAria")}
        />
      ) : null}

      {variant === "page" ? (
        <div className="flex flex-col gap-2 pt-2">
          {requiresQuote ? quoteButton : payButton}
          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-xl",
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
