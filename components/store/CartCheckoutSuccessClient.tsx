"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import { getCartMeta } from "@/lib/cart-meta";
import { releaseCartReservations } from "@/lib/cart-reservation";
import { gcCartClear, gcCartRead } from "@/lib/store-cart";
import { cn } from "@/utils/cn";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Nº de pedido ya resuelto en servidor (webhook / pedido previo). */
  initialOrderNumber?: string | null;
  sessionId?: string | null;
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

      // Registra en BD solo si aún hay carrito y Stripe devolvió session_id.
      // Si el carrito ya está vacío, el webhook crea el pedido en servidor.
      if (items.length > 0 && sid) {
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
  }, [initialOrderNumber, sessionId]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("storefront.cartSuccess.heading")}
      </h1>
      {orderNumber ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("storefront.cartSuccess.orderNumberLabel")}{" "}
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            {orderNumber}
          </span>
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {t("storefront.cartSuccess.description")}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
        >
          {t("storefront.cart.continueShopping")}
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          {t("storefront.cartSuccess.homeLink")}
        </Link>
      </div>
      {orderNumber ? (
        <p className="mt-4 text-sm text-muted-foreground">
          <Link
            href={`/order-lookup?order=${encodeURIComponent(orderNumber)}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("orderLookup.trackLink")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
