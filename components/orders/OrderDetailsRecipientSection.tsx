"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { OrderShippingRecipient } from "@/lib/order-shipping-recipient";
import { countryCodeToName } from "@/lib/countries-options";
import { MapPin } from "lucide-react";

type Props = {
  recipient: OrderShippingRecipient;
};

export function OrderDetailsRecipientSection({ recipient }: Props) {
  const { t } = useI18n();
  const cityLine = [recipient.city, recipient.state, recipient.postalCode]
    .filter(Boolean)
    .join(", ");
  const countryLabel =
    countryCodeToName(recipient.country) || recipient.country;

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <MapPin className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("profile.dialogRecipientTitle")}
          </p>
          <div className="space-y-1 text-sm leading-relaxed">
            <p className="break-words font-semibold text-foreground">
              {recipient.recipientName}
            </p>
            <p className="text-foreground tabular-nums">
              {recipient.recipientPhone}
            </p>
            {recipient.recipientEmail ? (
              <p className="break-all text-foreground">
                {recipient.recipientEmail}
              </p>
            ) : null}
            <div className="space-y-0.5 break-words pt-1 text-muted-foreground">
              <p>{recipient.addressLine}</p>
              {recipient.addressLine2 ? <p>{recipient.addressLine2}</p> : null}
              {cityLine ? <p>{cityLine}</p> : null}
              {countryLabel ? <p>{countryLabel}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
