import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { StorefrontProductCatalog } from "@/components/store/StorefrontProductCatalog";
import { resolveStorefrontPriceTier } from "@/lib/storefront-pricing";
import { getCurrentUserService } from "@/modules/auth/auth.service";
import {
  getCharacteristicGeneralBySlugOrId,
  getCharacteristicSpecificBySlugOrId,
  listProductsByGeneralAndSpecific,
} from "@/modules/catalog/storefront-security.service";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: { generalSlug: string; specificSlug: string };
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { generalSlug, specificSlug } = await Promise.resolve(params);
  const generalResolved = await getCharacteristicGeneralBySlugOrId(generalSlug);
  if (!generalResolved) return { title: "Security System" };
  const specificResolved = await getCharacteristicSpecificBySlugOrId(
    generalResolved.general.id,
    specificSlug,
  );
  const specific = specificResolved?.specific;
  if (!specific) return { title: "Security System" };
  return {
    title: specific.name,
    description: `Productos de ${specific.name}.`,
  };
}

export default async function SecuritySpecificPage({ params }: Props) {
  const { generalSlug, specificSlug } = await Promise.resolve(params);
  const generalResolved = await getCharacteristicGeneralBySlugOrId(generalSlug);
  if (!generalResolved) return notFound();

  const specificResolved = await getCharacteristicSpecificBySlugOrId(
    generalResolved.general.id,
    specificSlug,
  );
  if (!specificResolved) return notFound();

  const { general, source: generalSource } = generalResolved;
  const { specific, source: specificSource } = specificResolved;

  if (generalSource === "id" || specificSource === "id") {
    redirect(`/security-system/${general.slug}/${specific.slug}`);
  }

  const [products, user] = await Promise.all([
    listProductsByGeneralAndSpecific(general.id, specific.id),
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
              { label: general.name, href: `/security-system/${general.slug}` },
              { label: specific.name },
            ]}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={specific.name}
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
