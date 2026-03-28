import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

/**
 * Cliente para catálogo público (marcas, tipos, productos en tienda).
 * Si existe `SUPABASE_SERVICE_ROLE_KEY`, se usa el cliente con esa clave (bypass RLS).
 * No se inspecciona el JWT a mano: evita fallos al decodificar y dejar de usar el admin.
 */
export async function getCatalogSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (key) {
    return createSupabaseAdminClient();
  }
  return createSupabaseServerClient();
}
