import { SITE_BRAND_NAME } from "@/lib/site";

/** Remitente alineado con el correo de código de acceso seguro (Supabase Auth). */
export const EMAIL_FROM_DEFAULT =
  "Global Computers USA <team@globalalarmsusa.online>";

export const EMAIL_BRAND_NAME = SITE_BRAND_NAME;

/**
 * Remitente de Resend: `EMAIL_FROM` si está definido; si no, el mismo From del OTP.
 */
export function resolveEmailFrom(): string {
  const fromEnv = process.env.EMAIL_FROM?.trim();
  if (fromEnv) return fromEnv;
  return EMAIL_FROM_DEFAULT;
}
