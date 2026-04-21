import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getBrandById,
  getBrandTypeById,
  listProductsByBrandAndType,
  listProductsByBrandId,
} from "@/modules/catalog/storefront-products.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";

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
    const brand = await getBrandById(segments[0]);
    if (!brand) return { title: "Marca" };
    return {
      title: brand.name,
      description: `Productos ${brand.name}.`,
    };
  }
  if (segments.length === 2) {
    const [, brandTypeId] = segments;
    const typeRow = await getBrandTypeById(brandTypeId);
    if (!typeRow) return { title: "Catálogo" };
    const brand = await getBrandById(typeRow.brand_id);
    if (!brand) return { title: "Catálogo" };
    return {
      title: `${brand.name} — ${typeRow.name}`,
      description: `Productos ${typeRow.name} de ${brand.name}.`,
    };
  }
  return { title: "Shop by brand" };
}

/** Una sola ruta catch-all evita fallos con rutas dinámicas anidadas en dev/Turbopack. */
export default async function BrandsSlugPage({ params }: Props) {
  const segments = await slugSegments(params);

  if (segments.length === 1) {
    const brandId = segments[0];
    if (!UUID_RE.test(brandId)) notFound();

    const brand = await getBrandById(brandId);
    if (!brand) notFound();

    const [products, user] = await Promise.all([
      listProductsByBrandId(brandId),
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
                { label: brand.name },
              ]}
            />
            <div className="mt-4">
              {/* description="Catálogo de productos de esta marca." */}
              {/* descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`} */}
              <HomeSectionHeading
                align="left"
                title={brand.name}
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
    const [brandId, brandTypeId] = segments;

    if (
      !brandId ||
      !brandTypeId ||
      !UUID_RE.test(brandId) ||
      !UUID_RE.test(brandTypeId)
    ) {
      notFound();
    }

    const typeRow = await getBrandTypeById(brandTypeId);
    if (!typeRow) notFound();

    if (typeRow.brand_id !== brandId) {
      redirect(`/brands/${typeRow.brand_id}/${brandTypeId}`);
    }

    const brand = await getBrandById(brandId);
    if (!brand) notFound();

    const [products, user] = await Promise.all([
      listProductsByBrandAndType(brandId, brandTypeId),
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
                { label: brand.name, href: `/brands/${brandId}` },
                { label: typeRow.name },
              ]}
            />

            <div className="mt-4">
              {/* description={`Productos de ${typeRow.name}.`} */}
              {/* descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`} */}
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

  notFound();
}
