"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { ManualQuoteShippingAddressValues } from "@/components/store/ManualQuoteShippingAddressForm";
import { resolveClientLocale } from "@/lib/i18n/client-locale";
import {
  closePreOpenedWhatsAppWindow,
  openWhatsAppWindowForUserGesture,
  redirectAfterManualQuoteSuccess,
} from "@/lib/manual-quote-success";
import { formatClientError } from "@/lib/errors/format-client-error";
import { gcCartClear, type GcCartItem } from "@/lib/store-cart";
import { useState } from "react";
import { toast } from "react-toastify";

/** Alta de pedido de cotización + WhatsApp (página /cart y drawer). */
export function useManualQuoteSubmit(items: GcCartItem[]) {
  const { t, locale } = useI18n();
  const [quoteLoading, setQuoteLoading] = useState(false);

  async function submitManualQuote(
    shippingAddress: ManualQuoteShippingAddressValues,
  ) {
    if (quoteLoading || items.length === 0) return;
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
          locale: resolveClientLocale(locale),
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
      toast.error(
        formatClientError(e, t, {
          errorMessage: t("storefront.cart.toastQuoteOrderError"),
        }),
      );
      setQuoteLoading(false);
    }
  }

  return { quoteLoading, submitManualQuote };
}
