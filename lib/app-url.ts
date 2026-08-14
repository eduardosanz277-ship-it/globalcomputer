function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
}

/**
 * URL pública de la app (sin barra final).
 * Usada en callbacks de Stripe, magic links, emails, etc.
 *
 * Prioridad:
 * 1. `NEXT_PUBLIC_APP_URL` (si no es localhost cuando estamos en Vercel)
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (dominio de producción en Vercel)
 * 3. `VERCEL_URL` (URL del despliegue actual en Vercel)
 * 4. localhost (solo desarrollo local)
 */
export function getAppBaseUrl(): string {
  const onVercel = Boolean(process.env.VERCEL);
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    const normalized = normalizeBaseUrl(explicit);
    if (normalized && !(onVercel && isLocalhostUrl(normalized))) {
      return normalized;
    }
  }

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const normalized = normalizeBaseUrl(production);
    if (normalized) return normalized;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const normalized = normalizeBaseUrl(vercel);
    if (normalized) return normalized;
  }

  return "http://localhost:3000";
}
