"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * En navegaciones SPA, Next a veces mantiene el scroll del documento anterior.
 * Fuerza el inicio de página al cambiar de ruta (p. ej. home → /brands/...).
 */
export function ScrollToTopOnPathname() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
