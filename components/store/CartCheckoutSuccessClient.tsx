"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { StoreOrderNumberCard } from "@/components/store/StoreOrderNumberCard";
import { buttonVariants } from "@/components/ui/button-variants";
import { getCartMeta } from "@/lib/cart-meta";
import { releaseCartReservations } from "@/lib/cart-reservation";
import { recognizedAppLocale } from "@/lib/i18n/parse-locale";
import { gcCartClear, gcCartRead } from "@/lib/store-cart";
import { cn } from "@/utils/cn";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Nº de pedido ya resuelto en servidor (webhook / pedido previo). */
  initialOrderNumber?: string | null;
  sessionId?: string | null;
  /** Locale del Checkout (`success_url`), no el de localStorage/SSR. */
  checkoutLocale?: "es" | "en" | null;
  isLoggedIn?: boolean;
};

async function fetchOrderNumberBySession(
  sessionId: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `/api/site-orders?session_id=${encodeURIComponent(sessionId)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { orderNumber?: string | null };
    const value = data.orderNumber?.trim();
    return value || null;
  } catch {
    return null;
  }
}

/**
 * Vacía el carrito local tras Stripe y muestra el nº de pedido
 * (servidor, respuesta del POST o consulta por session_id).
 */
export function CartCheckoutSuccessClient({
  initialOrderNumber = null,
  sessionId = null,
  checkoutLocale = null,
  isLoggedIn = false,
}: Props) {
  const { t, locale } = useI18n();
  const done = useRef(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(
    initialOrderNumber?.trim() || null,
  );

  useEffect(() => {
    document.title = t("storefront.cartSuccess.metaTitle");
  }, [locale, t]);

  useEffect(() => {
    if (initialOrderNumber?.trim()) {
      setOrderNumber(initialOrderNumber.trim());
    }
  }, [initialOrderNumber]);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const cleanup = async () => {
      const meta = getCartMeta();
      const items = gcCartRead();
      const params = new URLSearchParams(window.location.search);
      const sid =
        sessionId?.trim() || params.get("session_id")?.trim() || undefined;
      const orderLocale =
        recognizedAppLocale(checkoutLocale) ??
        recognizedAppLocale(params.get("locale"));

      // Siempre registra/alinea el pedido si hay session_id (aunque el carrito
      // ya esté vacío: el webhook pudo crear la fila antes).
      if (sid) {
        try {
          const res = await fetch("/api/site-orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: items.map((item) => ({
                productId: item.productId,
                qty: item.qty,
              })),
              sessionId: sid,
              locale: orderLocale ?? "en",
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as {
              order?: { order_number?: string };
            };
            const fromPost = data.order?.order_number?.trim();
            if (fromPost) setOrderNumber(fromPost);
          }
        } catch (error) {
          console.error("site-orders api error:", error);
        }
      }

      if (!initialOrderNumber?.trim() && sid) {
        let found = await fetchOrderNumberBySession(sid);
        if (!found) {
          for (let i = 0; i < 4 && !found; i += 1) {
            await new Promise((r) => window.setTimeout(r, 700));
            found = await fetchOrderNumberBySession(sid);
          }
        }
        if (found) setOrderNumber(found);
      }

      if (meta?.token) {
        await releaseCartReservations(meta.token).catch(() => undefined);
      }
      await gcCartClear();
    };

    void cleanup();
  }, [initialOrderNumber, sessionId, checkoutLocale]);

  const viewOrderHref = isLoggedIn
    ? "/profile?tab=orders"
    : orderNumber
      ? `/order-lookup?order=${encodeURIComponent(orderNumber)}`
      : "/order-lookup";

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("storefront.cartSuccess.heading")}
      </h1>
      <p className="mt-3 text-base font-medium leading-relaxed text-foreground">
        {t("storefront.cartSuccess.confirmation")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {t("storefront.cartSuccess.emailHint")}
      </p>

      {orderNumber ? <StoreOrderNumberCard orderNumber={orderNumber} /> : null}

      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
        <Link
          href={viewOrderHref}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full rounded-xl sm:w-auto sm:min-w-[12rem]",
          )}
        >
          {t("storefront.cartSuccess.viewOrder")}
        </Link>
        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full rounded-xl sm:w-auto sm:min-w-[12rem]",
          )}
        >
          {t("storefront.cart.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
