import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import {
  getBrandById,
  getBrandTypeById,
  listBrandTypesForBrand,
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
      description: `Productos ${brand.name} — Shop by brand.`,
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

    const types = await listBrandTypesForBrand(brandId);
    const products =
      types.length === 0 ? await listProductsByBrandId(brandId) : [];

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <HomeSectionHeading
          eyebrow="Shop by brand"
          title={brand.name}
          description={
            types.length > 0
              ? "Elige un tipo de producto para ver el catálogo de esta marca."
              : "Catálogo de productos de esta marca."
          }
        />

        {types.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => (
              <Link
                key={t.id}
                href={`/brands/${brandId}/${t.id}`}
                className="group flex flex-col rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                  {t.name}
                </h2>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                  Ver productos
                  <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <StorefrontProductGrid products={products} />
          </div>
        )}
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
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-xs text-muted-foreground">
          <Link href="/brands" className="hover:text-foreground">
            Shop by brand
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/brands/${brandId}`} className="hover:text-foreground">
            {brand.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{typeRow.name}</span>
        </nav>

        <div className="mt-6">
          <HomeSectionHeading
            eyebrow={brand.name}
            title={typeRow.name}
            description={`Productos de ${typeRow.name} en ${brand.name}.`}
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
