import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getBrandBySlug,
  getBrandTypeBySlug,
  listProductsByBrandAndType,
} from "@/modules/catalog/storefront-products.service";
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
  const brand = await getBrandBySlug(brandSlug);
  if (!brand) return { title: "Catálogo" };
  const typeRow = await getBrandTypeBySlug(brand.id, brandTypeSlug);
  if (!typeRow) return { title: "Catálogo" };
  return {
    title: `${brand.name} — ${typeRow.name}`,
    description: `Productos ${typeRow.name} de ${brand.name}.`,
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
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            className={inter.className}
            items={[
              { label: "Inicio", href: "/" },
              { label: "Catálogo", href: "/products" },
              { label: brand.name, href: `/brands/${brand.slug}` },
              { label: typeRow.name },
            ]}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={typeRow.name}
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
