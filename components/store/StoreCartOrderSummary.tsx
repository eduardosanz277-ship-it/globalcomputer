"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
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

  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
        throw new Error(data.error ?? "No se pudo iniciar el pago.");
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("Respuesta inválida del servidor.");
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "No se pudo iniciar el pago.";
      toast.error(msg);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const checkoutDisabled =
    loading ||
    items.length === 0 ||
    hasUnresolvedProducts ||
    checkoutLoading;

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
          Al finalizar se abrirá la página segura de Stripe (Checkout) con el importe y los
          artículos. Impuestos y envío se confirman allí según corresponda.
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
                Abriendo pago…
              </>
            ) : (
              "Pagar con Stripe"
            )}
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
          <Button
            type="button"
            className="w-full rounded-xl sm:flex-1"
            disabled={checkoutDisabled}
            onClick={goToStripeCheckout}
          >
            {checkoutLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Abriendo…
              </>
            ) : (
              "Pagar con Stripe"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
