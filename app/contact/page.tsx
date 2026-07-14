import { Inter } from "next/font/google";
import { LocalizedText } from "@/components/i18n/LocalizedText";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { ContactPageClient } from "@/components/site/ContactPageClient";
import { getPublicSiteContact } from "@/lib/site-contact.server";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ContactPage() {
  const contact = await getPublicSiteContact();

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:pt-6 md:pb-4 lg:px-8">
          <MarketingBreadcrumb
            items={[
              { label: <LocalizedText es="Inicio" en="Home" />, href: "/" },
              { label: <LocalizedText es="Contacto" en="Contact" /> },
            ]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title={<LocalizedText es="Contáctanos" en="Contact us" />}
              description={
                <LocalizedText
                  es="Nuestro equipo te ayuda con asesoria, instalacion y soporte tecnico para sistemas de seguridad."
                  en="Our team helps you with advisory, installation, and technical support for security systems."
                />
              }
              className="max-w-none"
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 max-w-none whitespace-nowrap text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
        <ContactPageClient contact={contact} />
      </div>
    </main>
  );
}
