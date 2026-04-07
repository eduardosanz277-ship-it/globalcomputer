import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import {
  SITE_CONTACT_ADDRESS,
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_CONTACT_PHONE_TEL,
  siteContactMapsUrl,
} from "@/lib/site";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Contacto"
        title="Hablemos"
        description="Información de contacto y soporte."
      />
      <div className="mt-8 space-y-4 rounded-2xl border border-border/50 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Si tienes dudas o quieres solicitar instalación, contacta con nuestro
          equipo de soporte:
        </p>
        <div>
          <h4 className="text-sm font-semibold">Teléfono</h4>
          <p className="mt-1">
            <a
              href={`tel:${SITE_CONTACT_PHONE_TEL}`}
              className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              {SITE_CONTACT_PHONE_DISPLAY}
            </a>
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Email</h4>
          <p className="mt-1">
            <a
              href={`mailto:${SITE_CONTACT_EMAIL}`}
              className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
            >
              {SITE_CONTACT_EMAIL}
            </a>
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Dirección</h4>
          <p className="mt-1">
            <a
              href={siteContactMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 transition hover:text-primary hover:underline"
              aria-label={`Abrir ${SITE_CONTACT_ADDRESS} en Google Maps`}
            >
              {SITE_CONTACT_ADDRESS}
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
