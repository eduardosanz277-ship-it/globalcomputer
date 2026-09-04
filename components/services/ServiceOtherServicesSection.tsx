import { LocalizedText } from "@/components/i18n/LocalizedText";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { ServiceCardLink } from "@/components/marketing/ServiceCardLink";
import { resolvePrimaryServiceImage } from "@/components/marketing/service-card-shared";
import type { StorefrontServiceCard } from "@/modules/catalog/storefront-services.service";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function ServiceOtherServicesSection({
  services,
}: {
  services: StorefrontServiceCard[];
}) {
  if (services.length === 0) return null;

  return (
    <section className="border-t border-border/60 bg-muted/25 pb-12 pt-10 sm:pb-14 sm:pt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HomeSectionHeading
          className="max-w-none"
          align="left"
          title={<LocalizedText es="Otros servicios" en="Other services" />}
          description={
            <LocalizedText
              es="Explora el resto de soluciones que ofrecemos."
              en="Explore the other solutions we offer."
            />
          }
          titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
          descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-h-0">
          {services.map((s) => (
            <ServiceCardLink
              key={s.id}
              name={s.name}
              nameEn={s.name_en}
              description={s.short_description}
              descriptionEn={s.short_description_en}
              imageUrl={resolvePrimaryServiceImage(s.service_images)}
              href={`/services/${s.slug}`}
              showAdvisorCta={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
