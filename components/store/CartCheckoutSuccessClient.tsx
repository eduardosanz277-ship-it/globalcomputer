"use client";

import { useEffect, useRef } from "react";
import { gcCartClear, gcCartRead } from "@/lib/store-cart";
import { getCartMeta } from "@/lib/cart-meta";
import { releaseCartReservations } from "@/lib/cart-reservation";

/** Tras un pago correcto en Stripe, vacía el carrito local una sola vez. */
export function CartCheckoutSuccessClient() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const cleanup = async () => {
      const meta = getCartMeta();
      const items = gcCartRead();
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id") ?? undefined;
      // Registra en BD solo si aún hay carrito y Stripe devolvió session_id (evita pedidos huérfanos).
      // Si el carrito ya está vacío, el webhook `checkout.session.completed` crea el pedido en servidor.
      if (items.length > 0 && sessionId) {
        await fetch("/api/site-orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "",
            email: "",
            items: items.map((item) => ({
              productId: item.productId,
              qty: item.qty,
            })),
            sessionId,
          }),
        }).catch((error) => {
          console.error("site-orders api error:", error);
        });
      }
      if (meta?.token) {
        await releaseCartReservations(meta.token).catch(() => undefined);
      }
      await gcCartClear();
    };
    void cleanup();
  }, []);
  return null;
}
