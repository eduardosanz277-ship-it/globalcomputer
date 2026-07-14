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
  listProductsByBrandId,
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
  params: { brandSlug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { brandSlug } = await Promise.resolve(params);
  const locale = await getServerLocale();
  const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) {
    return {
      title: locale === "en" ? `Brand | ${catalogLabel}` : `Marca | ${catalogLabel}`,
    };
  }
  const displayName = storefrontLocalizedText(locale, brand.name, brand.nameEn);
  const desc =
    locale === "en"
      ? `Products from ${displayName}.`
      : `Productos de ${displayName}.`;
  if (brand.slug !== brandSlug) {
    return {
      title: `${displayName} | ${catalogLabel}`,
      description: desc,
    };
  }
  return {
    title: `${displayName} | ${catalogLabel}`,
    description: desc,
  };
}

export default async function BrandPage({ params }: Props) {
  const { brandSlug } = await Promise.resolve(params);
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) notFound();
  if (brand.slug !== brandSlug) {
    redirect(`/brands/${brand.slug}`);
  }

  const [products, user] = await Promise.all([
    listProductsByBrandId(brand.id),
    getCurrentUserService(),
  ]);
  const priceTier = resolveStorefrontPriceTier(user?.role);

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <StorefrontTieredDocumentTitle
        primaryName={brand.name}
        primaryNameEn={brand.nameEn}
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
                    name={brand.name}
                    nameEn={brand.nameEn}
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
                  name={brand.name}
                  nameEn={brand.nameEn}
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
