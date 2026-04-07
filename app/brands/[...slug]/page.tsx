import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import {
  getBrandById,
  getBrandTypeById,
  listProductsByBrandAndType,
  listProductsByBrandId,
} from "@/modules/catalog/storefront-products.service";

export const dynamic = "force-dynamic";

type PageParams = { slug: string[] };

type Props = {
  params: Promise<PageParams> | PageParams;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const products = await listProductsByBrandId(brandId);

    return (
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <MarketingBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Catálogo", href: "/brands" },
            { label: brand.name },
          ]}
        />
        <div className="mt-6">
          <HomeSectionHeading
            title={brand.name}
            description="Catálogo de productos de esta marca."
          />
        </div>

        <div className="mt-10">
          <StorefrontProductGrid products={products} />
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

    const products = await listProductsByBrandAndType(brandId, brandTypeId);

    return (
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <MarketingBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Catálogo", href: "/brands" },
            { label: brand.name, href: `/brands/${brandId}` },
            { label: typeRow.name },
          ]}
        />

        <div className="mt-6">
          <HomeSectionHeading
            title={typeRow.name}
            description={`Productos de ${typeRow.name}.`}
          />
        </div>

        <div className="mt-10">
          <StorefrontProductGrid products={products} />
        </div>
      </main>
    );
  }

  notFound();
}
