import { createClient } from "@supabase/supabase-js";
import { getSupabaseServiceEnv } from "@/lib/supabaseEnv";

/**
 * Cliente con **service role** (solo servidor: Server Actions / Route Handlers).
 * No importar desde componentes cliente.
 */
export function createSupabaseAdminClient() {
  const { url, serviceRoleKey: key } = getSupabaseServiceEnv();

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
