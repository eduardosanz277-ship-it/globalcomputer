/**
 * True si el HTML no tiene texto visible (solo etiquetas vacías, espacios o &nbsp;).
 */
export function isEffectivelyEmptyDescriptionHtml(html: string | null | undefined): boolean {
  if (!html?.trim()) return true;
  const text = html
    .replace(/<br[^>]*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();
  return text.length === 0;
}

/** Quita párrafos/divs vacíos al inicio (común en descripciones EN del editor). */
export function trimLeadingEmptyDescriptionBlocks(html: string): string {
  if (!html) return "";
  let result = html.trim();
  const emptyBlock =
    /^\s*<(p|div)(\s[^>]*)?>(?:\s|&nbsp;|&#160;|<br[^>]*\/?>)*<\/\1>\s*/i;

  let previous = "";
  while (emptyBlock.test(result) && result !== previous) {
    previous = result;
    result = result.replace(emptyBlock, "");
  }

  return result.trim();
}
