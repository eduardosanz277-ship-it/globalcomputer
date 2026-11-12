import type { NextRequest } from "next/server";
import { updateSession } from "./supabase/middleware";

/** Next.js 16+: sustituye la convención `middleware.ts` (renombrada a proxy). */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

/**
 * Excluye estáticos, imágenes y los endpoints internos de Next (`/_next`, HMR).
 * Esas rutas no llevan sesión. Las páginas de la app siguen pasando por el proxy
 * en producción igual que antes.
 */
export const config = {
  matcher: [
    "/((?!_next/|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff2?|ttf|txt|xml)$).*)",
  ],
};
