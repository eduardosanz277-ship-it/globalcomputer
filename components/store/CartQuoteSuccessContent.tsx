"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { CartQuoteSuccessActions } from "@/components/store/CartQuoteSuccessActions";
import { CartQuoteSuccessOrderNumber } from "@/components/store/CartQuoteSuccessOrderNumber";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

type Props = {
  isLoggedIn: boolean;
};

/** Contenido de éxito de cotización reactivo al idioma del cliente. */
export function CartQuoteSuccessContent({ isLoggedIn }: Props) {
  const { t, locale } = useI18n();

  useEffect(() => {
    document.title = t("storefront.quoteSuccess.metaTitle");
  }, [locale, t]);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("storefront.quoteSuccess.heading")}
      </h1>
      <p className="mt-3 text-base font-medium leading-relaxed text-foreground">
        {t("storefront.quoteSuccess.description")}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {isLoggedIn
          ? t("storefront.quoteSuccess.loggedInHint")
          : t("storefront.quoteSuccess.guestHint")}
      </p>
      <CartQuoteSuccessOrderNumber />
      <CartQuoteSuccessActions isLoggedIn={isLoggedIn} />
    </div>
  );
}
