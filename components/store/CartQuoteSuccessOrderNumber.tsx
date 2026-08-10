"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { GC_MANUAL_QUOTE_ORDER_NUMBER_KEY } from "@/lib/manual-quote-success";
import { useEffect, useState } from "react";

/** Muestra el nº de pedido guardado al completar la cotización manual. */
export function CartQuoteSuccessOrderNumber() {
  const { t } = useI18n();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(GC_MANUAL_QUOTE_ORDER_NUMBER_KEY);
      if (stored?.trim()) {
        setOrderNumber(stored.trim());
        sessionStorage.removeItem(GC_MANUAL_QUOTE_ORDER_NUMBER_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!orderNumber) return null;

  return (
    <p className="mt-3 text-sm text-muted-foreground">
      {t("storefront.quoteSuccess.orderNumberLabel")}{" "}
      <span className="font-mono text-sm font-medium tabular-nums text-foreground">
        {orderNumber}
      </span>
    </p>
  );
}
