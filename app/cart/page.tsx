import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StoreCartView } from "@/components/store/StoreCartView";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  if (locale === "en") {
    return {
      title: "Your shopping cart",
      description: "Review the products in your cart and continue checkout.",
    };
  }
  return {
    title: "Tu carrito de compras",
    description: "Revisa los productos en tu carrito y continúa la compra.",
  };
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function CarritoPage() {
  const user = await getCurrentUserService();
  const tier = resolveStorefrontPriceTier(user?.role);

  return (
    <div className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div
        id="cart-page-hero"
        className="border-b border-border/60 bg-card/40 transition-all duration-300"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              { label: <LocalizedText es="Carrito" en="Cart" /> },
            ]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={
                <LocalizedText es="Carrito de compras" en="Shopping cart" />
              }
              description={
                <LocalizedText
                  es="Gestiona cantidades y revisa el total antes de finalizar."
                  en="Adjust quantities and review the total before checkout."
                />
              }
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <StoreCartView tier={tier} />
    </div>
  );
}
