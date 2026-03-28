import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductGrid } from "@/components/store/StorefrontProductGrid";
import {
  getCharacteristicGeneralById,
  getCharacteristicSpecificById,
  listProductsByGeneralAndSpecific,
  listSpecificsForGeneral,
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
      description: `${g.name} — Security System.`,
    };
  }
  if (segments.length === 2) {
    const [, specificId] = segments;
    const spec = await getCharacteristicSpecificById(specificId);
    if (!spec) return { title: "Security System" };
    const general = await getCharacteristicGeneralById(spec.general_id);
    if (!general) return { title: "Security System" };
    return {
      title: `${general.name} — ${spec.name}`,
      description: `Productos con ${spec.name} (${general.name}).`,
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

    const specifics = await listSpecificsForGeneral(generalId);

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <HomeSectionHeading
          eyebrow="Security System"
          title={general.name}
          description={
            specifics.length > 0
              ? "Elige una opción para ver productos asociados."
              : "No hay valores específicos configurados para esta categoría."
          }
        />

        {specifics.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specifics.map((s) => (
              <Link
                key={s.id}
                href={`/security-system/${generalId}/${s.id}`}
                className="group flex flex-col rounded-2xl border border-border/50 bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                  {s.name}
                </h2>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
                  Ver productos
                  <ArrowRight className="ml-1.5 h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        ) : null}
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
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav className="text-xs text-muted-foreground">
          <Link href="/security-system" className="hover:text-foreground">
            Security System
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/security-system/${generalId}`}
            className="hover:text-foreground"
          >
            {general.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{specRow.name}</span>
        </nav>

        <div className="mt-6">
          <HomeSectionHeading
            eyebrow={general.name}
            title={specRow.name}
            description={`Productos asociados a «${specRow.name}» en ${general.name}.`}
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
