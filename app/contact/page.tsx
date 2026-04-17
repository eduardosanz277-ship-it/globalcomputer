import { Inter } from "next/font/google";
import { MarketingBreadcrumb } from "@/components/marketing/MarketingBreadcrumb";
import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { siteContactMapsUrl } from "@/lib/site";
import { getPublicSiteContact } from "@/lib/site-contact.server";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function ContactPage() {
  const contact = await getPublicSiteContact();

  return (
    <main className="min-h-[60vh] bg-gradient-to-b from-muted/25 to-background">
      <div className="border-b border-border/60 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <MarketingBreadcrumb
            items={[{ label: "Inicio", href: "/" }, { label: "Contacto" }]}
            className={inter.className}
          />
          <div className="mt-4">
            <HomeSectionHeading
              align="left"
              title="Hablemos"
              description="Información de contacto y soporte."
              titleClassName={`${inter.className} text-[28px] font-bold tracking-[0.006em] text-foreground sm:text-[32px]`}
              descriptionClassName={`${inter.className} mt-1 max-w-[700px] text-[15px] font-normal text-muted-foreground sm:text-base`}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-3xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            Si tienes dudas o quieres solicitar instalación, contacta con
            nuestro equipo de soporte:
          </p>
          <div>
            <h4 className="text-sm font-semibold">Teléfono</h4>
            <p className="mt-1">
              <a
                href={`tel:${contact.phoneTel}`}
                className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
              >
                {contact.phoneDisplay}
              </a>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Email</h4>
            <p className="mt-1">
              <a
                href={`mailto:${contact.email}`}
                className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
              >
                {contact.email}
              </a>
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold">Dirección</h4>
            <p className="mt-1">
              <a
                href={siteContactMapsUrl(contact.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
                aria-label={`Abrir ${contact.address} en Google Maps`}
              >
                {contact.address}
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
