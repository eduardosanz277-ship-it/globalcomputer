"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

type Props = {
  orderNumber: string;
};

/** Tarjeta de nº de pedido con copiar (éxito de checkout y cotización). */
export function StoreOrderNumberCard({ orderNumber }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function copyOrderNumber() {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      toast.success(t("storefront.cartSuccess.copyOrderNumberToast"));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t("storefront.cartSuccess.copyOrderNumberError"));
    }
  }

  return (
    <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-sm">
      <div className="min-w-0 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t("storefront.cartSuccess.orderNumberLabel")}
        </p>
        <p className="mt-0.5 truncate font-mono text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-lg">
          {orderNumber}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void copyOrderNumber()}
        className={cn(
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground transition-colors",
          "hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        )}
        aria-label={t("storefront.cartSuccess.copyOrderNumberAria")}
        title={t("storefront.cartSuccess.copyOrderNumberAria")}
      >
        {copied ? (
          <Check className="h-4 w-4 text-primary" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
