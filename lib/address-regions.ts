import { State } from "country-state-city";
import type { SelectOption } from "@/components/ui/form-fields";

let cache: Map<string, SelectOption[]> | null = null;

function getCache(): Map<string, SelectOption[]> {
  if (cache) return cache;
  cache = new Map();
  return cache;
}

/** Devuelve las regiones (estados/provincias) de un país por su código ISO α2. */
export function getRegionsForCountry(isoCode: string): SelectOption[] {
  const c = getCache();
  if (c.has(isoCode)) return c.get(isoCode)!;

  const regions = State.getStatesOfCountry(isoCode).map((s) => ({
    value: s.name,
    label: s.name,
  }));

  c.set(isoCode, regions);
  return regions;
}

export function countryHasRegionList(isoCode: string): boolean {
  return getRegionsForCountry(isoCode).length > 0;
}
