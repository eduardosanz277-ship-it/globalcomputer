import { getAppBaseUrl } from "@/lib/app-url";

function requestHost(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return (forwarded || req.headers.get("host") || "").toLowerCase();
}

function hostFromUrl(raw: string): string | null {
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

function allowedHosts(): Set<string> {
  const hosts = new Set<string>();
  for (const raw of [
    getAppBaseUrl(),
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ]) {
    if (!raw?.trim()) continue;
    const host = hostFromUrl(
      /^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`,
    );
    if (host) hosts.add(host);
  }
  return hosts;
}

/**
 * Acepta POST del formulario de contacto solo si Origin/Referer
 * coincide con el host de la petición o con las URLs públicas de la app.
 */
export function isSameOriginFormRequest(req: Request): boolean {
  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();
  const candidate = origin || referer;
  if (!candidate) return false;

  const candidateHost = hostFromUrl(candidate);
  if (!candidateHost) return false;

  const host = requestHost(req);
  if (host && candidateHost === host) return true;

  return allowedHosts().has(candidateHost);
}
