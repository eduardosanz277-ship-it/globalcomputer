import { LocalizedText } from "@/components/i18n/LocalizedText";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import type { Locale } from "@/components/i18n/translations";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontCatalogPageData } from "@/modules/catalog/storefront-catalog.shared";
import { inter } from "@/lib/fonts/inter";


type Props = {
  catalog: StorefrontCatalogPageData;
  priceTier: StorefrontPriceTier;
  query: string;
  locale: Locale;
};

export function SearchResultsPage({ catalog, priceTier, query, locale }: Props) {
  const title =
    query && locale === "en"
      ? `Search results for "${query}"`
      : query
        ? `Resultados para "${query}"`
        : null;

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              { label: <LocalizedText es="Catálogo" en="Catalog" /> },
            ]}
            className={inter.className}
          />

          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={
                title ?? <LocalizedText es="Todos los productos" en="All products" />
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
