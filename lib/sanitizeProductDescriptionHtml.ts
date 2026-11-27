import sanitizeHtml from "sanitize-html";
import { trimLeadingEmptyDescriptionBlocks } from "@/lib/normalizeProductDescriptionHtml";

/**
 * Saneado de descripciones de producto enriquecidas: listas, tablas,
 * imágenes con src/alt, enlaces con rel seguro.
 *
 * Se usa `sanitize-html` (htmlparser2, sin jsdom) porque el saneador
 * anterior basado en jsdom rompía en el runtime serverless de Vercel
 * (ERR_REQUIRE_ESM al cargar @exodus/bytes) y devolvía 500 en las
 * fichas de producto renderizadas en servidor.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "a",
    "abbr",
    "b",
    "blockquote",
    "br",
    "caption",
    "code",
    "col",
    "colgroup",
    "details",
    "div",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "s",
    "section",
    "small",
    "span",
    "strong",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  allowedAttributes: {
    "*": ["class", "style", "id"],
    a: ["href", "target", "rel", "name"],
    img: ["src", "alt", "width", "height", "title"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
    col: ["span"],
    details: ["open"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"],
  },
  allowProtocolRelative: false,
};

/**
 * Devuelve HTML seguro para insertar en el DOM (vista pública o preview).
 * Siempre usar antes de `dangerouslySetInnerHTML`.
 */
export function sanitizeProductDescriptionHtml(dirty: string): string {
  const sanitized = sanitizeHtml(dirty ?? "", SANITIZE_OPTIONS);
  return trimLeadingEmptyDescriptionBlocks(sanitized);
}
