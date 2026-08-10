import { CartQuoteSuccessOrderNumber } from "@/components/store/CartQuoteSuccessOrderNumber";
import { CartQuoteSuccessWhatsAppLink } from "@/components/store/CartQuoteSuccessWhatsAppLink";
import { buttonVariants } from "@/components/ui/button-variants";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { cn } from "@/utils/cn";
import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: translate(locale, "storefront.quoteSuccess.metaTitle"),
    description: translate(locale, "storefront.quoteSuccess.metaDescription"),
  };
}

export default async function CartQuoteSuccessPage() {
  const locale = await getServerLocale();
  const t = (key: string) => translate(locale, key);
  const user = await getCurrentUserService();
  const isLoggedIn = Boolean(user?.id);

  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-muted/25 to-background px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("storefront.quoteSuccess.heading")}
        </h1>
        <CartQuoteSuccessOrderNumber />
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("storefront.quoteSuccess.description")}{" "}
          {isLoggedIn
            ? t("storefront.quoteSuccess.loggedInHint")
            : t("storefront.quoteSuccess.guestHint")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isLoggedIn ? (
            <Link
              href="/profile?tab=orders"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-xl",
              )}
            >
              {t("storefront.quoteSuccess.ordersLink")}
            </Link>
          ) : (
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "default" }),
                "rounded-xl",
              )}
            >
              {t("storefront.cart.continueShopping")}
            </Link>
          )}
          {isLoggedIn ? (
            <Link
              href="/products"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl",
              )}
            >
              {t("storefront.cart.continueShopping")}
            </Link>
          ) : (
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-xl",
              )}
            >
              {t("storefront.cartSuccess.homeLink")}
            </Link>
          )}
        </div>
        <div className="mt-4 flex justify-center">
          <CartQuoteSuccessWhatsAppLink />
        </div>
      </div>
    </div>
  );
}
