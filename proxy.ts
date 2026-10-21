import type { NextRequest } from "next/server";
import { updateSession } from "./supabase/middleware";

/** Next.js 16+: sustituye la convención `middleware.ts` (renombrada a proxy). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

/** Excluye estáticos e imágenes: cada ejecución llama a `auth.getUser()`. */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf|txt|xml)$).*)",
  ],
};
