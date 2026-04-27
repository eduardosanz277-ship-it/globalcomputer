import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontCatalogDocumentTitle } from "@/components/store/StorefrontCatalogDocumentTitle";
import { StorefrontLocalizedName } from "@/components/store/StorefrontLocalizedName";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getStorefrontCategoryBySlug,
  getStorefrontSubcategoryInCategoryBySlug,
} from "@/modules/catalog/storefront-categories.service";
import {
  listProductsByCategoryId,
  listProductsBySubcategoryId,
} from "@/modules/catalog/storefront-products.service";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type PageParams = { slug: string[] };

type Props = {
  params: Promise<PageParams> | PageParams;
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

async function slugSegments(
  params: Promise<PageParams> | PageParams,
): Promise<string[]> {
  const p = await Promise.resolve(params);
  const s = p.slug;
  return Array.isArray(s) ? s : [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getServerLocale();
  const segments = await slugSegments(params);
  if (segments.length === 1) {
    const category = await getStorefrontCategoryBySlug(segments[0]);
    if (!category) return { title: locale === "en" ? "Catalog" : "Catálogo" };
    const categoryName = storefrontLocalizedText(
      locale,
      category.name,
      category.nameEn,
    );
    const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
    return {
      title: `${categoryName} | ${catalogLabel}`,
      description:
        locale === "en"
          ? `Products in the ${categoryName} category.`
          : `Productos en la categoría ${categoryName}.`,
    };
  }

  if (segments.length === 2) {
    const category = await getStorefrontCategoryBySlug(segments[0]);
    if (!category) return { title: locale === "en" ? "Catalog" : "Catálogo" };
    const subcategory = await getStorefrontSubcategoryInCategoryBySlug(
      category.id,
      segments[1],
    );
    if (!subcategory) return { title: locale === "en" ? "Catalog" : "Catálogo" };
    const categoryName = storefrontLocalizedText(
      locale,
      category.name,
      category.nameEn,
    );
    const subcategoryName = storefrontLocalizedText(
      locale,
      subcategory.name,
      subcategory.nameEn,
    );
    const catalogLabel = locale === "en" ? "Catalog" : "Catálogo";
    return {
      title: `${categoryName} — ${subcategoryName} | ${catalogLabel}`,
      description:
        locale === "en"
          ? `Products in ${subcategoryName} (${categoryName}).`
          : `Productos en ${subcategoryName} (${categoryName}).`,
    };
  }

  return { title: locale === "en" ? "Catalog" : "Catálogo" };
}

export default async function CatalogoSlugPage({ params }: Props) {
  const segments = await slugSegments(params);
  if (segments.length === 1) {
    const categorySlug = segments[0];
    const category = await getStorefrontCategoryBySlug(categorySlug);
    if (!category) notFound();

    const [products, user] = await Promise.all([
      listProductsByCategoryId(category.id),
      getCurrentUserService(),
    ]);
    const priceTier = resolveStorefrontPriceTier(user?.role);

    return (
      <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
        <StorefrontCatalogDocumentTitle
          categoryName={category.name}
          categoryNameEn={category.nameEn}
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
                      name={category.name}
                      nameEn={category.nameEn}
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
                    name={category.name}
                    nameEn={category.nameEn}
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

  if (segments.length === 2) {
    const [categorySlug, subcategorySlug] = segments;
    if (!categorySlug || !subcategorySlug) {
      notFound();
    }

    const category = await getStorefrontCategoryBySlug(categorySlug);
    if (!category) notFound();

    const subcategory = await getStorefrontSubcategoryInCategoryBySlug(
      category.id,
      subcategorySlug,
    );
    if (!subcategory) notFound();

    const [products, user] = await Promise.all([
      listProductsBySubcategoryId(subcategory.id),
      getCurrentUserService(),
    ]);
    const priceTier = resolveStorefrontPriceTier(user?.role);

    return (
      <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
        <StorefrontCatalogDocumentTitle
          categoryName={category.name}
          categoryNameEn={category.nameEn}
          subcategoryName={subcategory.name}
          subcategoryNameEn={subcategory.nameEn}
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
                      name={category.name}
                      nameEn={category.nameEn}
                    />
                  ),
                  href: `/catalog/${category.slug}`,
                },
                {
                  label: (
                    <StorefrontLocalizedName
                      name={subcategory.name}
                      nameEn={subcategory.nameEn}
                    />
                  ),
                  href: `/catalog/${category.slug}/${subcategory.slug}`,
                },
              ]}
            />
            <div className="mt-4">
              <HomeSectionHeading
                align="left"
                title={
                  <StorefrontLocalizedName
                    name={subcategory.name}
                    nameEn={subcategory.nameEn}
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

  notFound();
}
