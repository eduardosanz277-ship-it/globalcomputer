import { CartQuoteSuccessContent } from "@/components/store/CartQuoteSuccessContent";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: translate(locale, "storefront.quoteSuccess.metaTitle"),
    description: translate(locale, "storefront.quoteSuccess.metaDescription"),
  };
}

export default async function CartQuoteSuccessPage() {
  const user = await getCurrentUserService();
  const isLoggedIn = Boolean(user?.id);

  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-muted/25 to-background px-4 py-16 sm:px-6">
      <CartQuoteSuccessContent isLoggedIn={isLoggedIn} />
    </div>
  );
}
