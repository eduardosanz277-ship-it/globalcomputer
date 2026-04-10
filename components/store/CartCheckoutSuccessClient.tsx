"use client";

import { useEffect, useRef } from "react";
import { gcCartClear } from "@/lib/store-cart";

/** Tras un pago correcto en Stripe, vacía el carrito local una sola vez. */
export function CartCheckoutSuccessClient() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    gcCartClear();
  }, []);
  return null;
}
