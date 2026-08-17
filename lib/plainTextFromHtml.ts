/**
 * Convierte fragmentos HTML en texto plano para previews (cards, listados).
 * Elimina etiquetas y colapsa espacios en blanco.
 */
export function plainTextFromHtml(html: string | null | undefined): string {
  if (!html?.trim()) return "";
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}

/** HTML del editor vacío (`<p></p>`, `&nbsp;`, etc.) no cuenta como contenido. */
export function hasPublishedRichHtml(html: string | null | undefined): boolean {
  const text = plainTextFromHtml(html)
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();
  return text.length > 0;
}

export function resolveLocalizedRichHtml(
  locale: string,
  esValue: string | null | undefined,
  enValue: string | null | undefined,
): string | null {
  if (locale === "en" && hasPublishedRichHtml(enValue)) {
    return String(enValue).trim();
  }
  if (hasPublishedRichHtml(esValue)) {
    return String(esValue).trim();
  }
  return null;
}
