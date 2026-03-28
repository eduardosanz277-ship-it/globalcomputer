import { HomeSectionHeading } from "@/components/marketing/HomeSectionHeading";
import { repoGetAppConfigByKeys } from "@/modules/admin/app-config/app-config.repository";
import { APP_CONFIG_KEYS } from "@/modules/admin/app-config/app-config.types";

export default async function ContactPage() {
  // Server-side: leer ajustes de contacto desde app_config (service role)
  let supportEmail = "";
  let supportPhone = "";
  try {
    const rows = await repoGetAppConfigByKeys(["support_email", "support_phone"]);
    for (const r of rows) {
      if (r.key === "support_email" && typeof r.value === "string") supportEmail = r.value;
      if (r.key === "support_phone" && typeof r.value === "string") supportPhone = r.value;
    }
  } catch (e) {
    // silently ignore if repo fails (no service key); fall back to env
    supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
    supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";
  }
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <HomeSectionHeading
        eyebrow="Contacto"
        title="Hablemos"
        description="Información de contacto y soporte."
      />
      <div className="mt-8 space-y-4 rounded-2xl border border-border/50 bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Si tienes dudas o quieres solicitar instalación, contacta con nuestro equipo de soporte:
        </p>
        <div>
          <h4 className="text-sm font-semibold">Correo</h4>
          <p className="text-foreground">{supportEmail || "—"}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Teléfono</h4>
          <p className="text-foreground">{supportPhone || "—"}</p>
        </div>
      </div>
    </main>
  );
}

