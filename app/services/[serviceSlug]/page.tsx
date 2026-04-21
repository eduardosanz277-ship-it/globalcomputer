import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { ServiceDescriptionContent } from "@/components/services/ServiceDescriptionContent";
import { Inter } from "next/font/google";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  getServiceBySlugOrId,
  StorefrontService,
} from "@/modules/catalog/storefront-services.service";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Props = {
  params: { serviceSlug: string };
};

export async function generateMetadata({ params }: Props) {
  const { serviceSlug } = await Promise.resolve(params);
  const resolved = await getServiceBySlugOrId(serviceSlug);
  const service = resolved?.service;
  if (!service) return { title: "Servicio" };
  return {
    title: service.name,
    description:
      service.description?.slice(0, 155).trim() ||
      `${service.name} · Servicios de Global Computers USA.`,
  };
}

export default async function ServiceSlugPage({ params }: Props) {
  const { serviceSlug } = await Promise.resolve(params);
  const resolved = await getServiceBySlugOrId(serviceSlug);
  if (!resolved) return notFound();
  const { service, source } = resolved;
  if (source === "id") {
    redirect(`/services/${service.slug}`);
  }

  const images = service.images
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  const primaryImageUrl = images[0]?.url ?? null;

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            className={inter.className}
            items={[
              { label: "Inicio", href: "/" },
              { label: "Servicios", href: "/services" },
              { label: service.name },
            ]}
          />
          <div className="mt-4">
            <HomeSectionHeading
              className="max-w-none"
              align="left"
              title={service.name}
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
            />
          </div>
        </div>
      </div>

  {primaryImageUrl ? (
    <section className="relative w-full overflow-hidden border-y border-border/40 bg-black/90">
      <div className="relative h-[46vh] min-h-[17rem] w-full sm:h-[56vh] lg:h-[64vh]">
        <Image
          src={primaryImageUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40 blur-sm"
          priority
        />
        <Image
          src={primaryImageUrl}
          alt={service.name}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>
    </section>
  ) : null}

      <div className="relative z-10 mx-auto -mt-6 max-w-7xl px-4 pb-12 sm:-mt-10 sm:px-6 lg:-mt-14 lg:px-8">
        <ServiceDescriptionContent description={service.description} />
      </div>
    </main>
  );
}
