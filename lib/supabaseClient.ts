import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

/**
 * Cliente browser con cookies (PKCE) alineado al middleware.
 * En desarrollo (http://localhost) `secure: false` evita cookies de sesión rechazadas.
 */
export const createSupabaseBrowserClient = () => {
  if (!supabaseUrl?.trim() || !supabaseKey?.trim()) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o la clave pública (NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY). Revisa .env.local."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
};
