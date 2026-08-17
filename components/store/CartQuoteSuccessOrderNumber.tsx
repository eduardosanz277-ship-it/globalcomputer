"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { StoreOrderNumberCard } from "@/components/store/StoreOrderNumberCard";
import { GC_MANUAL_QUOTE_ORDER_NUMBER_KEY } from "@/lib/manual-quote-success";
import { useEffect, useState } from "react";

function readStoredOrderNumber(): string | null {
  try {
    const stored = sessionStorage.getItem(GC_MANUAL_QUOTE_ORDER_NUMBER_KEY);
    return stored?.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

/** Muestra el nº de pedido guardado al completar la cotización manual. */
export function CartQuoteSuccessOrderNumber() {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // No borrar al leer: evita pérdida por remount (Strict Mode) o refresh.
    setOrderNumber(readStoredOrderNumber());
  }, []);

  if (!orderNumber) return null;

  return <StoreOrderNumberCard orderNumber={orderNumber} />;
}
