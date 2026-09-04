import { Inter } from "next/font/google";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { ServiceCardLink } from "@/components/marketing/ServiceCardLink";
import { ServicesListingAdvisorCta } from "@/components/marketing/ServicesListingAdvisorCta";
import {
  resolvePrimaryServiceImage,
  type ServiceRow,
} from "@/components/marketing/service-card-shared";
import { getPublicSiteContact } from "@/lib/site-contact.server";
import { getCatalogSupabase } from "@/lib/supabaseCatalogClient";
import { assertRemoteOk } from "@/lib/errors/rsc-network-error";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ServicesPage() {
  const supabase = await getCatalogSupabase();
  const contact = await getPublicSiteContact();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, name_en, slug, short_description, short_description_en, service_images(id, url, is_primary, sort_order)",
    )
    .order("name", { ascending: true });
  assertRemoteOk(error);

  const rows = (data ?? []) as ServiceRow[];

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              { label: <LocalizedText es="Servicios" en="Services" /> },
            ]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              className="max-w-none"
              align="left"
              title={
                <LocalizedText es="Nuestros servicios" en="Our services" />
              }
              description={
                <LocalizedText
                  es="Elige el servicio que necesitas y solicita una evaluación gratuita."
                  en="Choose the service you need and request a free evaluation."
                />
              }
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 w-full max-w-none text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 pb-8 sm:px-6 sm:pb-10 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:min-h-0">
          {rows.map((s) => (
            <ServiceCardLink
              key={s.id}
              name={s.name}
              nameEn={s.name_en}
              description={s.short_description}
              descriptionEn={s.short_description_en}
              imageUrl={resolvePrimaryServiceImage(s.service_images)}
              href={`/services/${s.slug ?? s.id}`}
              showAdvisorCta={false}
            />
          ))}
        </div>
      </div>
      <ServicesListingAdvisorCta
        phoneDisplay={contact.phoneDisplay}
        phoneTel={contact.phoneTel}
      />
    </main>
  );
}
