"use client";

import { computeCartSubtotal } from "@/components/store/cart-line-price";
import { formatUsd } from "@/components/store/store-cart-format";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { useI18n } from "@/components/i18n/I18nProvider";
import { computeSiteOfferOnSubtotal } from "@/lib/site-offer-discount";
import type { PublicSiteOffer } from "@/lib/site-offer.types";
import { gcCartTotalUnits, type GcCartItem } from "@/lib/store-cart";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { Gift, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export function StoreCartOrderSummary({
  items,
  productsById,
  loading,
  tier,
  variant,
  /** Panel lateral: al abrirse (`true`) se consulta de nuevo la oferta. */
  panelOpen,
  onContinueShopping,
}: {
  items: GcCartItem[];
  productsById: Record<string, StorefrontProduct>;
  loading: boolean;
  tier: StorefrontPriceTier;
  variant: "drawer" | "page";
  panelOpen?: boolean;
  onContinueShopping?: () => void;
}) {
  const { t } = useI18n();
  const subtotal = computeCartSubtotal(items, productsById, tier);
  const totalUnits = gcCartTotalUnits(items);
  const hasUnresolvedProducts = items.some(
    (line) => !productsById[line.productId],
  );

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [liveOffer, setLiveOffer] = useState<PublicSiteOffer | null>(null);

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

  async function goToStripeCheckout() {
    if (items.length === 0 || hasUnresolvedProducts) return;
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

  const checkoutDisabled =
    loading || items.length === 0 || hasUnresolvedProducts || checkoutLoading;
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

  const offerText = t("storefront.cart.offerBanner")
    .replace("{pct}", formatOfferPercentage(offerPercentage))
    .replace("{amount}", formatUsd(offerAmount));

  const amountPending = loading && items.length > 0 && hasUnresolvedProducts;

  return (
    <div
      className={cn(
        "space-y-4",
        variant === "page" &&
          "lg:rounded-2xl lg:border lg:border-border/60 lg:bg-card lg:p-6 lg:shadow-soft",
        variant === "drawer" && "px-0",
      )}
    >
      {hasOffer ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
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
            )
          </span>
          <span
            className={cn(
              "font-bold tabular-nums text-foreground",
              offerApplies ? "text-base" : "text-xl",
            )}
          >
            {amountPending ? "—" : formatUsd(subtotal)}
          </span>
        </div>

        {offerApplies ? (
          <>
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
              </span>
              <span className="font-semibold tabular-nums">
                {amountPending ? "—" : `−${formatUsd(discountUsd)}`}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-t border-border/60 pt-3">
              <span
                className={cn(
                  "font-semibold text-foreground",
                  variant === "page" ? "text-lg" : "text-base sm:text-lg",
                )}
              >
                {t("storefront.cart.estimatedTotal")}
              </span>
              <span
                className={cn(
                  "font-semibold tabular-nums text-foreground",
                  variant === "page" ? "text-xl" : "text-lg sm:text-xl",
                )}
              >
                {amountPending ? "—" : formatUsd(totalAfterDiscountUsd)}
              </span>
            </div>
          </>
        ) : null}

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("storefront.cart.stripeInfo")}
        </p>
      </div>

      {variant === "page" ? (
        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl"
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
          <Button
            type="button"
            className="w-full rounded-xl sm:flex-1"
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
        </div>
      ) : null}
    </div>
  );
}
