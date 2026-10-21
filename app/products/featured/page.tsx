import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { loadStorefrontCatalogPage } from "@/modules/catalog/storefront-catalog.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  if (locale === "en") {
    return {
      title: "Featured products",
      description:
        "Catalog of featured active products in the store: cameras, recorders, kits, and accessories.",
    };
  }
  return {
    title: "Productos destacados",
    description:
      "Catálogo de productos destacados activos en la tienda: cámaras, grabadoras, kits y accesorios.",
  };
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProductosDestacadosPage({ searchParams }: Props) {
  const [resolvedSearchParams, user, locale] = await Promise.all([
    searchParams,
    getCurrentUserService(),
    getServerLocale(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);
  const catalog = await loadStorefrontCatalogPage(
    { kind: "featured" },
    resolvedSearchParams ?? {},
    priceTier,
    locale,
  );

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              {
                label: <LocalizedText es="Catálogo" en="Catalog" />,
                href: "/products",
              },
              { label: <LocalizedText es="Destacados" en="Featured" /> },
            ]}
            className={inter.className}
          />

          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={
                <LocalizedText es="Productos destacados" en="Featured products" />
              }
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <StorefrontProductCatalog catalog={catalog} priceTier={priceTier} />
      </div>
    </main>
  );
}
