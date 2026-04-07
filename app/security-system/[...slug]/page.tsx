import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import {
  getCharacteristicGeneralById,
  getCharacteristicSpecificById,
  listProductsByGeneralAndSpecific,
  listProductsByGeneralId,
} from "@/modules/catalog/storefront-security.service";

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
    const g = await getCharacteristicGeneralById(segments[0]);
    if (!g) return { title: "Security System" };
    return {
      title: g.name,
      description: `Productos — ${g.name}.`,
    };
  }
  if (segments.length === 2) {
    const [, specificId] = segments;
    const spec = await getCharacteristicSpecificById(specificId);
    if (!spec) return { title: "Security System" };
    const general = await getCharacteristicGeneralById(spec.general_id);
    if (!general) return { title: "Security System" };
    return {
      title: spec.name,
      description: `Productos de ${spec.name}.`,
    };
  }
  return { title: "Security System" };
}

export default async function SecuritySystemSlugPage({ params }: Props) {
  const segments = await slugSegments(params);

  if (segments.length === 1) {
    const generalId = segments[0];
    if (!UUID_RE.test(generalId)) notFound();

    const general = await getCharacteristicGeneralById(generalId);
    if (!general) notFound();

    const products = await listProductsByGeneralId(generalId);

    return (
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <MarketingBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Catálogo", href: "/security-system" },
            { label: general.name },
          ]}
        />
        <div className="mt-6">
          <HomeSectionHeading
            title={general.name}
            description="Catálogo de productos de esta categoría."
          />
        </div>

        <div className="mt-10">
          <StorefrontProductGrid products={products} />
        </div>
      </main>
    );
  }

  if (segments.length === 2) {
    const [generalId, specificId] = segments;

    if (
      !generalId ||
      !specificId ||
      !UUID_RE.test(generalId) ||
      !UUID_RE.test(specificId)
    ) {
      notFound();
    }

    const specRow = await getCharacteristicSpecificById(specificId);
    if (!specRow) notFound();

    if (specRow.general_id !== generalId) {
      redirect(`/security-system/${specRow.general_id}/${specificId}`);
    }

    const general = await getCharacteristicGeneralById(generalId);
    if (!general) notFound();

    const products = await listProductsByGeneralAndSpecific(generalId, specificId);

    return (
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <MarketingBreadcrumb
          items={[
            { label: "Inicio", href: "/" },
            { label: "Catálogo", href: "/security-system" },
            { label: general.name, href: `/security-system/${generalId}` },
            { label: specRow.name },
          ]}
        />

        <div className="mt-6">
          <HomeSectionHeading
            title={specRow.name}
            description={`Productos de ${specRow.name}.`}
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
