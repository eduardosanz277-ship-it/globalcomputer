"use client";

import { usePathname } from "next/navigation";
import type { SessionUser } from "@/modules/auth/auth.types";
import { SiteHeader } from "./SiteHeader";

/**
 * Rutas donde no se muestra el header comercial (búsqueda, carrito, menú
 * público, etc.): autenticación, registro, panel admin y área de cuenta.
 */
function shouldShowMarketingHeader(pathname: string | null): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/cuenta")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/register")) return false;
  return true;
}

type Props = {
  user: SessionUser | null;
};

export function ConditionalSiteHeader({ user }: Props) {
  const pathname = usePathname();
  if (!shouldShowMarketingHeader(pathname)) return null;
  return <SiteHeader user={user} />;
}
