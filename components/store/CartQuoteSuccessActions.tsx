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

type Props = {
  isLoggedIn: boolean;
};

const actionButtonClassName =
  "w-full rounded-xl sm:w-auto sm:min-w-[12rem]";

/** CTAs de éxito de cotización, mismo orden que la confirmación de pedido. */
export function CartQuoteSuccessActions({ isLoggedIn }: Props) {
  const { t } = useI18n();
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setWhatsappUrl(readStoredWhatsAppUrl());
    setOrderNumber(readStoredOrderNumber());
  }, []);

  const viewOrderHref = isLoggedIn
    ? "/profile?tab=orders"
    : orderNumber
      ? `/order-lookup?order=${encodeURIComponent(orderNumber)}`
      : "/order-lookup";

  return (
    <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
      <Link
        href={viewOrderHref}
        className={cn(buttonVariants({ variant: "default" }), actionButtonClassName)}
      >
        {t("storefront.cartSuccess.viewOrder")}
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
            actionButtonClassName,
            "inline-flex items-center justify-center gap-2",
            "border-transparent bg-[#1ebe57] text-white hover:bg-[#25D366]",
            "focus-visible:ring-[#25D366]/40",
          )}
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
          {t("storefront.quoteSuccess.openWhatsApp")}
        </a>
      ) : null}
      <Link
        href="/products"
        className={cn(
          buttonVariants({ variant: "outline" }),
          actionButtonClassName,
        )}
      >
        {t("storefront.cart.continueShopping")}
      </Link>
    </div>
  );
}
