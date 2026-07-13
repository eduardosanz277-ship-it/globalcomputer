import DOMPurify from "isomorphic-dompurify";
import { trimLeadingEmptyDescriptionBlocks } from "@/lib/normalizeProductDescriptionHtml";

/**
 * Opciones de DOMPurify para descripciones de producto enriquecidas:
 * listas, tablas, imágenes con src/alt, enlaces con rel seguro.
 * `isomorphic-dompurify` permite ejecutar el mismo saneado en servidor (RSC/SSR)
 * y en el navegador.
 */
const PURIFY_CONFIG: NonNullable<
  Parameters<typeof DOMPurify.sanitize>[1]
> = {
  ADD_TAGS: [
    "blockquote",
    "details",
    "summary",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "colgroup",
    "col",
  ],
  ADD_ATTR: ["target", "rel", "class", "style", "open"],
  ALLOW_DATA_ATTR: false,
};

/**
 * Devuelve HTML seguro para insertar en el DOM (vista pública o preview).
 * Siempre usar antes de `dangerouslySetInnerHTML`.
 */
export function sanitizeProductDescriptionHtml(dirty: string): string {
  const sanitized = DOMPurify.sanitize(dirty ?? "", PURIFY_CONFIG);
  return trimLeadingEmptyDescriptionBlocks(sanitized);
}
