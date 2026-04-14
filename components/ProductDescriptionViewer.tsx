"use client";

import { useMemo } from "react";
import { sanitizeProductDescriptionHtml } from "@/lib/sanitizeProductDescriptionHtml";
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

  if (!safe.trim()) {
    return null;
  }

  return (
    <div
      className={cn("product-description-html max-w-none", className)}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
