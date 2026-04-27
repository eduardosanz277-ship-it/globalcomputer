import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { StorefrontTieredDocumentTitle } from "@/components/store/StorefrontTieredDocumentTitle";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getBrandBySlug,
  getBrandTypeBySlug,
  listProductsByBrandAndType,
} from "@/modules/catalog/storefront-products.service";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  params: { brandSlug: string; brandTypeSlug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug, brandTypeSlug } = await Promise.resolve(params);
  const locale = await getServerLocale();
  const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) {
    return { title: catalogLabel };
  }
  const typeRow = await getBrandTypeBySlug(brand.id, brandTypeSlug);
  if (!typeRow) {
    return { title: catalogLabel };
  }
  const bName = storefrontLocalizedText(locale, brand.name, brand.nameEn);
  const tName = storefrontLocalizedText(locale, typeRow.name, typeRow.nameEn);
  return {
    title: `${bName} — ${tName} | ${catalogLabel}`,
    description:
      locale === "en"
        ? `${tName} products from ${bName}.`
        : `Productos ${tName} de ${bName}.`,
  };
}

export default async function BrandTypePage({ params }: Props) {
  const { brandSlug, brandTypeSlug } = await Promise.resolve(params);
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();

  const typeRow = await getBrandTypeBySlug(brand.id, brandTypeSlug);
  if (!typeRow) notFound();

  if (brand.slug !== brandSlug || typeRow.slug !== brandTypeSlug) {
    redirect(`/brands/${brand.slug}/${typeRow.slug}`);
  }

  const [products, user] = await Promise.all([
    listProductsByBrandAndType(brand.id, typeRow.id),
    getCurrentUserService(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <StorefrontTieredDocumentTitle
        primaryName={brand.name}
        primaryNameEn={brand.nameEn}
        secondaryName={typeRow.name}
        secondaryNameEn={typeRow.nameEn}
      />
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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
                    name={brand.name}
                    nameEn={brand.nameEn}
                  />
                ),
                href: `/brands/${brand.slug}`,
              },
              {
                label: (
                  <StorefrontLocalizedName
                    name={typeRow.name}
                    nameEn={typeRow.nameEn}
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
                  name={typeRow.name}
                  nameEn={typeRow.nameEn}
                />
              }
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
