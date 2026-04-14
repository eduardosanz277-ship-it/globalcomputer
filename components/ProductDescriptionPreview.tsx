"use client";

import { useMemo } from "react";
import { sanitizeProductDescriptionHtml } from "@/lib/sanitizeProductDescriptionHtml";

type Props = {
  /** HTML crudo del editor (se sanea antes de pintar). */
  html: string;
  className?: string;
};

/**
 * Vista previa bajo el editor: mismo saneado y clases que la ficha pública
 * para que el admin vea el resultado final.
 */
export function ProductDescriptionPreview({ html, className }: Props) {
  const safe = useMemo(
    () => sanitizeProductDescriptionHtml(html ?? ""),
    [html],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
        Vista previa
      </p>
      <div
        className={`rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-4 ${className ?? ""}`}
      >
        {safe.trim() ? (
          <div
            className="product-description-html max-w-none"
            // HTML ya filtrado con DOMPurify
            dangerouslySetInnerHTML={{ __html: safe }}
          />
        ) : (
          <p className="text-sm italic text-muted-foreground">
            La vista previa aparecerá cuando escribas contenido.
          </p>
        )}
      </div>
    </div>
  );
}
