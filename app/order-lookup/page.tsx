import { Suspense } from "react";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { OrderLookupClient } from "@/components/store/OrderLookupClient";
import { translate } from "@/lib/i18n/get-translation";
import { getServerLocale } from "@/lib/i18n/server-locale";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: translate(locale, "orderLookup.metaTitle"),
    description: translate(locale, "orderLookup.metaDescription"),
  };
}

export default function OrderLookupPage() {
  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              {
                label: (
                  <LocalizedText es="Consultar pedido" en="Track order" />
                ),
              },
            ]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={
                <LocalizedText es="Consultar pedido" en="Track your order" />
              }
              description={
                <LocalizedText
                  es="Introduce el número de pedido y el correo con el que compraste o solicitaste cotización."
                  en="Enter your order number and the email you used to purchase or request a quote."
                />
              }
              className="max-w-none"
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 max-w-2xl text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="mx-auto h-48 max-w-3xl animate-pulse rounded-2xl border border-border/70 bg-muted/30" />
          }
        >
          <OrderLookupClient />
        </Suspense>
      </div>
    </main>
  );
}
