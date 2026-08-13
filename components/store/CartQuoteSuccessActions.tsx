"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  GC_MANUAL_QUOTE_ORDER_NUMBER_KEY,
  GC_MANUAL_QUOTE_WHATSAPP_KEY,
} from "@/lib/manual-quote-success";
import { cn } from "@/utils/cn";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

function readStoredWhatsAppUrl(): string | null {
  try {
    const stored = sessionStorage.getItem(GC_MANUAL_QUOTE_WHATSAPP_KEY);
    return stored?.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

function clearStoredWhatsAppUrl() {
  try {
    sessionStorage.removeItem(GC_MANUAL_QUOTE_WHATSAPP_KEY);
  } catch {
    /* ignore */
  }
}

function readStoredOrderNumber(): string | null {
  try {
    const stored = sessionStorage.getItem(GC_MANUAL_QUOTE_ORDER_NUMBER_KEY);
    return stored?.trim() ? stored.trim() : null;
  } catch {
    return null;
  }
}

/** CTAs de éxito de cotización: Seguir comprando + WhatsApp (si hay URL). */
export function CartQuoteSuccessActions() {
  const { t } = useI18n();
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappUrl(readStoredWhatsAppUrl());
    setOrderNumber(readStoredOrderNumber());
  }, []);

  const hasWhatsApp = Boolean(whatsappUrl);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "mx-auto flex w-full max-w-md flex-col gap-3",
          hasWhatsApp
            ? "sm:grid sm:grid-cols-2"
            : "items-center sm:max-w-none",
        )}
      >
        <Link
          href="/products"
          className={cn(
            buttonVariants({ variant: "default" }),
            "rounded-xl",
            hasWhatsApp ? "w-full" : "w-full sm:w-auto",
          )}
        >
          {t("storefront.cart.continueShopping")}
        </Link>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              clearStoredWhatsAppUrl();
            }}
            className={cn(
              buttonVariants({ variant: "default" }),
              "inline-flex w-full items-center justify-center gap-2 rounded-xl",
              "border-transparent bg-[#1ebe57] text-white hover:bg-[#25D366]",
              "focus-visible:ring-[#25D366]/40",
            )}
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("storefront.quoteSuccess.openWhatsApp")}
          </a>
        ) : null}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href={
            orderNumber
              ? `/order-lookup?order=${encodeURIComponent(orderNumber)}`
              : "/order-lookup"
          }
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {orderNumber ? t("orderLookup.trackLink") : t("footer.trackOrder")}
        </Link>
      </p>
    </div>
  );
}
