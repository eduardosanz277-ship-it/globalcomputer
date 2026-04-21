import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
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
  const segments = await slugSegments(params);
  if (segments.length === 1) {
    const category = await getStorefrontCategoryBySlug(segments[0]);
    if (!category) return { title: "Catálogo" };
    return {
      title: `${category.name} | Catálogo`,
      description: `Productos en la categoría ${category.name}.`,
    };
  }

  if (segments.length === 2) {
    const category = await getStorefrontCategoryBySlug(segments[0]);
    if (!category) return { title: "Catálogo" };
    const subcategory = await getStorefrontSubcategoryInCategoryBySlug(
      category.id,
      segments[1],
    );
    if (!subcategory) return { title: "Catálogo" };
    return {
      title: `${category.name} — ${subcategory.name} | Catálogo`,
      description: `Productos en ${subcategory.name} (${category.name}).`,
    };
  }

  return { title: "Catálogo" };
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
        <div className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <MarketingBreadcrumb
              className={inter.className}
              items={[
                { label: "Inicio", href: "/" },
                { label: "Catálogo", href: "/products" },
                { label: category.name },
              ]}
            />
            <div className="mt-4">
              <HomeSectionHeading
                align="left"
                title={category.name}
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
        <div className="border-b border-border/60 bg-card/40">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <MarketingBreadcrumb
              className={inter.className}
              items={[
                { label: "Inicio", href: "/" },
                { label: "Catálogo", href: "/products" },
                {
                  label: category.name,
                  href: `/catalog/${category.slug}`,
                },
                {
                  label: subcategory.name,
                  href: `/catalog/${category.slug}/${subcategory.slug}`,
                },
              ]}
            />
            <div className="mt-4">
              <HomeSectionHeading
                align="left"
                title={subcategory.name}
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
