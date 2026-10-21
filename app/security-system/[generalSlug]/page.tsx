import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { StorefrontTieredDocumentTitle } from "@/components/store/StorefrontTieredDocumentTitle";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import { loadStorefrontCatalogPage } from "@/modules/catalog/storefront-catalog.service";
import { getCharacteristicGeneralBySlugOrId } from "@/modules/catalog/storefront-security.service";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import type { Metadata } from "next";
import { inter } from "@/lib/fonts";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: { generalSlug: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generalSlug } = await Promise.resolve(params);
  const locale = await getServerLocale();
  const resolved = await getCharacteristicGeneralBySlugOrId(generalSlug);
  const general = resolved?.general;
  if (!general) {
    return {
      title: locale === "en" ? "Security Systems | Catalog" : "Sistemas de Seguridad | Catálogo",
    };
  }
  const name = storefrontLocalizedText(locale, general.name, general.nameEn);
  const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
  return {
    title: `${name} | ${catalogLabel}`,
    description:
      locale === "en"
        ? `Products filtered by ${name}.`
        : `Productos filtrados por ${name}.`,
  };
}

export default async function SecurityGeneralPage({ params, searchParams }: Props) {
  const { generalSlug } = await Promise.resolve(params);
  const resolved = await getCharacteristicGeneralBySlugOrId(generalSlug);
  if (!resolved) return notFound();
  const { general, source } = resolved;
  if (source === "id") {
    redirect(`/security-system/${general.slug}`);
  }

  const [resolvedSearchParams, user, locale] = await Promise.all([
    searchParams,
    getCurrentUserService(),
    getServerLocale(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);
  const catalog = await loadStorefrontCatalogPage(
    { kind: "general", generalId: general.id },
    resolvedSearchParams ?? {},
    priceTier,
    locale,
  );

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <StorefrontTieredDocumentTitle
        primaryName={general.name}
        primaryNameEn={general.nameEn}
      />
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            className={inter.className}
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              {
                label: <LocalizedText es="Catálogo" en="Catalog" />,
                href: "/products",
              },
              {
                label: (
                  <StorefrontLocalizedName
                    name={general.name}
                    nameEn={general.nameEn}
                  />
                ),
              },
            ]}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={
                <StorefrontLocalizedName
                  name={general.name}
                  nameEn={general.nameEn}
                />
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
