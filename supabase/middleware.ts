import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "@/lib/supabaseEnv";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function updateSession(request: NextRequest) {
  // En local el proxy corre en cada RSC, server action y API. Cada una llamaba
  // a Auth y, en paralelo, disparaba 429 e invalidaba la cookie.
  // La sesión en dev se lee de la cookie en el servidor (repoGetSessionUser).
  // Producción no entra en este return: sigue el getUser() de abajo.
  if (!IS_PRODUCTION) {
    return NextResponse.next({ request });
  }

  const { url: supabaseUrl, anonKey: supabaseKey } = getSupabasePublicEnv();
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: {
        name: string;
        value: string;
        options: CookieOptions;
      }[]) {
        // request.cookies en middleware solo acepta (name, value); las opciones van en la respuesta
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure: IS_PRODUCTION,
    },
  });

  // Refresca la sesión y propaga cookies; ignora refresh token inválido (cookies obsoletas).
  try {
    await supabase.auth.getUser();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isRefreshMissing =
      /refresh_token_not_found/i.test(message) ||
      /invalid refresh token/i.test(message) ||
      /refresh token not found/i.test(message);
    if (!isRefreshMissing) {
      throw error;
    }
  }

  return supabaseResponse;
}
