"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import {
  parseHomeSectionId,
  smoothScrollToHomeSection,
} from "@/lib/home-section-scroll";

/**
 * En navegaciones SPA, Next a veces mantiene el scroll del documento anterior.
 * Fuerza el inicio de página al cambiar de ruta (p. ej. home → /brands/...).
 * Si la ruta es el home con ancla de sección, hace scroll suave como el botón flotante.
 */
export function ScrollToTopOnPathname() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const sectionId = parseHomeSectionId(window.location.hash);
    const shouldSmoothHomeSection = pathname === "/" && sectionId != null;

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    if (!shouldSmoothHomeSection || !sectionId) return;

    let cancelled = false;
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) smoothScrollToHomeSection(sectionId);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
