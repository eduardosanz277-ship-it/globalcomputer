import { unstable_cache } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/** Segundos que las lecturas públicas del catálogo se sirven desde la caché de Next. */
export const CATALOG_CACHE_SECONDS = 60;
export const CATALOG_CACHE_TAG = "catalog";

function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Cliente para catálogo público (marcas, tipos, productos en tienda).
 * Si existe `SUPABASE_SERVICE_ROLE_KEY`, se usa el cliente con esa clave (bypass RLS).
 * No se inspecciona el JWT a mano: evita fallos al decodificar y dejar de usar el admin.
 */
export async function getCatalogSupabase() {
  if (hasServiceRoleKey()) {
    return createSupabaseAdminClient();
  }
  return createSupabaseServerClient();
}

/**
 * Comparte el resultado entre peticiones durante `CATALOG_CACHE_SECONDS`
 * (los argumentos forman parte de la clave). Se invalida con `CATALOG_CACHE_TAG`.
 * Solo con service role: el cliente con cookies no puede usarse dentro de `unstable_cache`.
 */
export function withCatalogCache<A extends unknown[], T>(
  key: string,
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<T> {
  const cached = unstable_cache(fn, [key], {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  });
  return (...args: A) => (hasServiceRoleKey() ? cached(...args) : fn(...args));
}
