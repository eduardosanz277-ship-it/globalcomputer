"use client";

import { useEffect, useMemo, useRef } from "react";
import { sanitizeProductDescriptionHtml } from "@/lib/sanitizeProductDescriptionHtml";
import { setupSpecAccordionAnimations } from "@/lib/setupSpecAccordionAnimations";
import { useI18n } from "@/components/i18n/I18nProvider";

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
  const { t } = useI18n();
  const safe = useMemo(
    () => sanitizeProductDescriptionHtml(html ?? ""),
    [html],
  );

  const hasRenderableContent = useMemo(() => {
    const textOnly = safe
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/\u00a0/g, " ")
      .trim();
    if (textOnly.length > 0) return true;
    return /<(img|table|ul|ol|blockquote|hr|iframe)\b/i.test(safe);
  }, [safe]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    return setupSpecAccordionAnimations(el);
  }, [safe]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">
        {t("admin.richTextEditor.preview.title")}
      </p>
      <div
        className={`rounded-lg border border-dashed border-border/80 bg-muted/15 px-4 py-2 ${className ?? ""}`}
      >
        {hasRenderableContent ? (
          <div
            ref={containerRef}
            className="product-description-html max-w-none"
            dangerouslySetInnerHTML={{ __html: safe }}
          />
        ) : (
          <p className="min-h-6 truncate text-sm italic leading-6 text-muted-foreground">
            {t("admin.richTextEditor.preview.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
