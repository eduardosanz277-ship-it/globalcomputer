function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isLocalhostUrl(url: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url);
}

/** Localhost solo en desarrollo local. Producción y preview de Vercel no lo usan. */
function allowLocalhostFallback(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv === "production" || vercelEnv === "preview") return false;
  return process.env.NODE_ENV !== "production";
}

function firstPublicUrl(candidates: Array<string | undefined>): string {
  const allowLocal = allowLocalhostFallback();
  for (const raw of candidates) {
    const trimmed = raw?.trim();
    if (!trimmed) continue;
    const normalized = normalizeBaseUrl(trimmed);
    if (!normalized) continue;
    if (isLocalhostUrl(normalized) && !allowLocal) continue;
    return normalized;
  }
  return "";
}

/**
 * URL pública de la app (sin barra final).
 * Usada en callbacks de Stripe, magic links, emails, etc.
 *
 * Prioridad:
 * 1. `APP_URL` (solo servidor; no se incrusta en el build)
 * 2. `NEXT_PUBLIC_APP_URL` (se ignora si es localhost fuera de desarrollo)
 * 3. `VERCEL_PROJECT_PRODUCTION_URL`
 * 4. `VERCEL_URL`
 * 5. localhost (solo desarrollo local)
 */
export function getAppBaseUrl(): string {
  const url = firstPublicUrl([
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]);
  if (url) return url;

  if (!allowLocalhostFallback()) {
    console.warn(
      "[app-url] Falta APP_URL o NEXT_PUBLIC_APP_URL con el dominio de producción.",
    );
  }

  return "http://localhost:3000";
}
