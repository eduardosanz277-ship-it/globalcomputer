import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StoreCartView } from "@/components/store/StoreCartView";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";

export const metadata: Metadata = {
  title: "Tu carrito de compras",
  description: "Revisa los productos en tu carrito y continúa la compra.",
};

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
            items={[{ label: "Inicio", href: "/" }, { label: "Carrito" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title="Carrito de compras"
              description="Gestiona cantidades y revisa el total antes de finalizar."
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
