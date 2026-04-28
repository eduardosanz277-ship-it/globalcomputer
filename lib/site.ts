/** Nombre comercial del sitio (marketing, admin, metadatos). */
export const SITE_BRAND_NAME = "Global Computers USA";

/** Contacto público (footer, /contact, etc.). Fallback si falta `support_address` en app_config. */
export const SITE_CONTACT_ADDRESS = "11629 SW 216th St, Miami, FL 33170";
export const SITE_CONTACT_PHONE_DISPLAY = "786-395-1076";
/** Para enlaces `tel:` (E.164 sin espacios). */
export const SITE_CONTACT_PHONE_TEL = "+17863951076";
export const SITE_CONTACT_EMAIL = "globalcomputer1024@gmail.com";
export const SITE_CONTACT_SUPPORT_HOURS = "Lun–Vie: 8 AM – 5 PM";

export type PublicSiteContact = {
  address: string;
  email: string;
  phoneDisplay: string;
  phoneTel: string;
};

export function siteContactMapsUrl(address: string = SITE_CONTACT_ADDRESS): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
