import { Country } from "country-state-city";
import type { SelectOption } from "@/components/ui/form-fields";

/** País por defecto al crear dirección (formulario cuenta). */
export const DEFAULT_COUNTRY_CODE = "US";

let cachedOptions: SelectOption[] | null = null;

/** Opciones de país (ISO α2 → nombre en inglés), ordenadas alfabéticamente. */
export function getCountryOptions(): SelectOption[] {
  if (cachedOptions) return cachedOptions;
  cachedOptions = Country.getAllCountries()
    .map((c) => ({ value: c.isoCode, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label, "en"));
  return cachedOptions;
}

/** Devuelve el nombre del país a partir de su código ISO α2. */
export function countryCodeToName(code: string): string {
  return Country.getCountryByCode(code)?.name ?? code;
}

/**
 * Convierte un valor guardado en BD (nombre en inglés, en español o alias) al código ISO.
 * Necesario para abrir el formulario de edición en direcciones antiguas con nombre en español.
 */
export function storedCountryToCountryCode(stored: string | null | undefined): string {
  const trimmed = (stored ?? "").trim();
  if (!trimmed) return DEFAULT_COUNTRY_CODE;

  const upper = trimmed.toUpperCase();

  // ya es código ISO α2
  if (upper.length === 2 && Country.getCountryByCode(upper)) return upper;

  // busca por nombre (inglés)
  const byEn = Country.getAllCountries().find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (byEn) return byEn.isoCode;

  // alias y nombres en español más habituales
  const aliases: Record<string, string> = {
    "españa": "ES",
    "espana": "ES",
    "estados unidos": "US",
    "ee.uu.": "US",
    "usa": "US",
    "méxico": "MX",
    "mexico": "MX",
    "alemania": "DE",
    "reino unido": "GB",
    "gran bretaña": "GB",
    "gran bretana": "GB",
    "brasil": "BR",
    "japón": "JP",
    "japon": "JP",
    "rusia": "RU",
    "corea del sur": "KR",
    "corea del norte": "KP",
    "china": "CN",
    "india": "IN",
    "indonesia": "ID",
    "pakistán": "PK",
    "pakistan": "PK",
    "argentina": "AR",
    "colombia": "CO",
    "chile": "CL",
    "perú": "PE",
    "peru": "PE",
    "venezuela": "VE",
    "ecuador": "EC",
    "cuba": "CU",
    "guatemala": "GT",
    "haití": "HT",
    "haiti": "HT",
    "república dominicana": "DO",
    "republica dominicana": "DO",
    "honduras": "HN",
    "paraguay": "PY",
    "el salvador": "SV",
    "nicaragua": "NI",
    "costa rica": "CR",
    "panamá": "PA",
    "panama": "PA",
    "uruguay": "UY",
    "bolivia": "BO",
    "puerto rico": "PR",
    "canada": "CA",
    "canadá": "CA",
    "portugal": "PT",
    "italia": "IT",
    "francia": "FR",
    "países bajos": "NL",
    "paises bajos": "NL",
    "bélgica": "BE",
    "belgica": "BE",
    "suecia": "SE",
    "noruega": "NO",
    "dinamarca": "DK",
    "suiza": "CH",
    "austria": "AT",
    "grecia": "GR",
    "turquía": "TR",
    "turquia": "TR",
    "polonia": "PL",
    "ucrania": "UA",
    "australia": "AU",
    "nueva zelanda": "NZ",
    "sudáfrica": "ZA",
    "sudafrica": "ZA",
    "marruecos": "MA",
    "egipto": "EG",
    "nigeria": "NG",
    "kenya": "KE",
    "ghana": "GH",
    "filipinas": "PH",
    "vietnam": "VN",
    "tailandia": "TH",
    "corea": "KR",
    "arabia saudita": "SA",
    "arabia saudí": "SA",
    "emiratos arabes unidos": "AE",
    "emiratos árabes unidos": "AE",
    "israel": "IL",
    "irak": "IQ",
    "irán": "IR",
    "iran": "IR",
    "afganistán": "AF",
    "afganistan": "AF",
    "singapur": "SG",
    "malasia": "MY",
    "bangladesh": "BD",
    "nepal": "NP",
    "sri lanka": "LK",
  };
  const found = aliases[trimmed.toLowerCase()];
  if (found) return found;

  return DEFAULT_COUNTRY_CODE;
}
