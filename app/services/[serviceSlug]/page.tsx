import { LocalizedText } from "@/components/i18n/LocalizedText";
import { ServiceDescriptionContent } from "@/components/services/ServiceDescriptionContent";
import { ServiceHeroBanner } from "@/components/services/ServiceHeroBanner";
import { Inter } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { getServiceBySlugOrId } from "@/modules/catalog/storefront-services.service";

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
  const short =
    service.short_description?.trim() ||
    service.description
      ?.replace(/<[^>]+>/g, " ")
      .slice(0, 155)
      .trim();
  return {
    title: service.name,
    description:
      short || `${service.name} · Servicios de Global Computers USA.`,
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

  const breadcrumbItems = [
    { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
    {
      label: <LocalizedText es="Servicios" en="Services" />,
      href: "/services",
    },
    { label: <LocalizedText es={service.name} en={service.name_en} /> },
  ];

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background lg:bg-background">
      <ServiceHeroBanner
        serviceName={service.name}
        serviceNameEn={service.name_en}
        shortDescription={service.short_description}
        shortDescriptionEn={service.short_description_en}
        bannerMobileUrl={service.banner_mobile_url}
        bannerTabletUrl={service.banner_tablet_url}
        bannerDesktopUrl={service.banner_desktop_url}
        breadcrumbItems={breadcrumbItems}
        breadcrumbClassName={inter.className}
      />

      <div className="relative z-10 w-full max-lg:-mt-4 max-lg:pb-0 lg:z-20 lg:-mt-12 lg:mx-auto lg:max-w-7xl lg:px-8 lg:pb-12">
        <ServiceDescriptionContent
          description={service.description}
          descriptionEn={service.description_en}
        />
      </div>
    </main>
  );
}
