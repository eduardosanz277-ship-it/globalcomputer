"use client";

import { useEffect, useMemo, useRef } from "react";
import { sanitizeProductDescriptionHtml } from "@/lib/sanitizeProductDescriptionHtml";
import { setupSpecAccordionAnimations } from "@/lib/setupSpecAccordionAnimations";
import { cn } from "@/utils/cn";

type Props = {
  /** Texto/HTML almacenado en `productos.descripcion`. */
  descripcion: string | null | undefined;
  className?: string;
};

/**
 * Renderiza la descripción en la tienda: sanea el HTML y aplica estilos de
 * tipografía, tablas e imágenes alineados al editor del panel.
 */
export function ProductDescriptionViewer({ descripcion, className }: Props) {
  const safe = useMemo(
    () => sanitizeProductDescriptionHtml(descripcion ?? ""),
    [descripcion],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return setupSpecAccordionAnimations(el);
  }, [safe]);

  if (!safe.trim()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn("product-description-html max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
