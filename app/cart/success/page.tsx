import { CartCheckoutSuccessClient } from "@/components/store/CartCheckoutSuccessClient";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { getStoreOrderNumberByStripeSessionId } from "@/modules/commerce/store-orders.service";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: translate(locale, "storefront.cartSuccess.metaTitle"),
    description: translate(locale, "storefront.cartSuccess.metaDescription"),
  };
}

type Props = {
  searchParams?:
    | Promise<{ session_id?: string | string[] }>
    | { session_id?: string | string[] };
};

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || null;
  }
  return null;
}

export default async function CarritoExitoPage({ searchParams }: Props) {
  const resolved = searchParams ? await Promise.resolve(searchParams) : {};
  const sessionId = firstParam(resolved.session_id);
  const initialOrderNumber = sessionId
    ? await getStoreOrderNumberByStripeSessionId(sessionId)
    : null;

  return (
    <div className="min-h-[50vh] bg-gradient-to-b from-muted/25 to-background px-4 py-16 sm:px-6">
      <CartCheckoutSuccessClient
        initialOrderNumber={initialOrderNumber}
        sessionId={sessionId}
      />
    </div>
  );
}
