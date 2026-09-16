import "server-only";

import type { BrandedEmailFooterContact } from "@/lib/email/templates/brandedEmailShell";
import { getPublicSiteContact } from "@/lib/site-contact.server";

/** Contacto del footer en emails de marca (desde Configuración del panel admin). */
export async function getBrandedEmailFooterContact(): Promise<BrandedEmailFooterContact> {
  const contact = await getPublicSiteContact();
  return {
    supportEmail: contact.email,
    phoneDisplay: contact.phoneDisplay,
    phoneTel: contact.phoneTel,
  };
}
