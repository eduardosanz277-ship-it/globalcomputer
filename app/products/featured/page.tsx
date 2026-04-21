import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { listAllFeaturedStorefrontProducts } from "@/modules/catalog/storefront-products.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos destacados",
  description:
    "Catálogo de productos destacados activos en la tienda: cámaras, grabadoras, kits y accesorios.",
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ProductosDestacadosPage() {
  const [products, user] = await Promise.all([
    listAllFeaturedStorefrontProducts(),
    getCurrentUserService(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo", href: "/products" },
              { label: "Destacados" },
            ]}
            className={inter.className}
          />

          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title="Productos destacados"
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <StorefrontProductCatalog products={products} priceTier={priceTier} />
      </div>
    </main>
  );
}
