import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getStorefrontCategoryById,
  getStorefrontSubcategoryInCategory,
} from "@/modules/catalog/storefront-categories.service";
import {
  listProductsByCategoryId,
  listProductsBySubcategoryId,
} from "@/modules/catalog/storefront-products.service";

export const dynamic = "force-dynamic";

type PageParams = { slug: string[] };

type Props = {
  params: Promise<PageParams> | PageParams;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    const cat = await getStorefrontCategoryById(segments[0]);
    if (!cat) return { title: "Catálogo" };
    return {
      title: `${cat.name} | Catálogo`,
      description: `Productos en la categoría ${cat.name}.`,
    };
  }
  if (segments.length === 2) {
    const [categoryId, subId] = segments;
    const sub = await getStorefrontSubcategoryInCategory(categoryId, subId);
    if (!sub) return { title: "Catálogo" };
    const cat = await getStorefrontCategoryById(categoryId);
    if (!cat) return { title: "Catálogo" };
    return {
      title: `${cat.name} — ${sub.name} | Catálogo`,
      description: `Productos en ${sub.name} (${cat.name}).`,
    };
  }
  return { title: "Catálogo" };
}

export default async function CatalogoSlugPage({ params }: Props) {
  const segments = await slugSegments(params);

  if (segments.length === 1) {
    const categoryId = segments[0];
    if (!UUID_RE.test(categoryId)) notFound();

    const category = await getStorefrontCategoryById(categoryId);
    if (!category) notFound();

    const [products, user] = await Promise.all([
      listProductsByCategoryId(categoryId),
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
                { label: "Catálogo", href: "/productos" },
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
    const [categoryId, subcategoryId] = segments;
    if (
      !categoryId ||
      !subcategoryId ||
      !UUID_RE.test(categoryId) ||
      !UUID_RE.test(subcategoryId)
    ) {
      notFound();
    }

    const category = await getStorefrontCategoryById(categoryId);
    if (!category) notFound();

    const subcategory = await getStorefrontSubcategoryInCategory(
      categoryId,
      subcategoryId,
    );
    if (!subcategory) notFound();

    const [products, user] = await Promise.all([
      listProductsBySubcategoryId(subcategoryId),
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
                { label: "Catálogo", href: "/productos" },
                {
                  label: category.name,
                  href: `/catalogo/${categoryId}`,
                },
                { label: subcategory.name },
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
