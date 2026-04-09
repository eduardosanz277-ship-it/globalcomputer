import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
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

    const [products, user] = await Promise.all([
      listProductsByGeneralId(generalId),
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
                { label: "Catálogo", href: "/security-system" },
                { label: general.name },
              ]}
            />
            <div className="mt-4">
              <HomeSectionHeading
                align="left"
                title={general.name}
                description="Catálogo de productos de esta categoría."
                titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
                descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`}
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

    const [products, user] = await Promise.all([
      listProductsByGeneralAndSpecific(generalId, specificId),
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
                { label: "Catálogo", href: "/security-system" },
                { label: general.name, href: `/security-system/${generalId}` },
                { label: specRow.name },
              ]}
            />

            <div className="mt-4">
              <HomeSectionHeading
                align="left"
                title={specRow.name}
                description={`Productos de ${specRow.name}.`}
                titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
                descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`}
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
