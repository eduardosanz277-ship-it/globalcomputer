/**
 * Stripe exige `country` en direcciones como código ISO-3166-1 alpha-2 (p. ej. ES).
 * La tabla `addresses.country` puede guardar nombre en español o ya el código.
 */
const NAME_TO_ISO2: Record<string, string> = {
  españa: "ES",
  spain: "ES",
  "españa (españa)": "ES",
  portugal: "PT",
  france: "FR",
  francia: "FR",
  alemania: "DE",
  germany: "DE",
  deutschland: "DE",
  italia: "IT",
  italy: "IT",
  "reino unido": "GB",
  "united kingdom": "GB",
  uk: "GB",
  ireland: "IE",
  irlanda: "IE",
  "estados unidos": "US",
  "united states": "US",
  usa: "US",
  mexico: "MX",
  méxico: "MX",
  argentina: "AR",
  colombia: "CO",
  chile: "CL",
  peru: "PE",
  perú: "PE",
  uruguay: "UY",
  brasil: "BR",
  brazil: "BR",
  andorra: "AD",
  suiza: "CH",
  switzerland: "CH",
  "países bajos": "NL",
  netherlands: "NL",
  holanda: "NL",
  belgica: "BE",
  bélgica: "BE",
  belgium: "BE",
  austria: "AT",
};

/** Devuelve código ISO2 o null si no se puede inferir. */
export function countryToStripeIso2(raw: string | null | undefined): string | null {
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  const upper = s.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper)) return upper;
  const key = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return NAME_TO_ISO2[key] ?? NAME_TO_ISO2[s.toLowerCase()] ?? null;
}
