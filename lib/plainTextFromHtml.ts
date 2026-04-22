/**
 * Convierte fragmentos HTML en texto plano para previews (cards, listados).
 * Elimina etiquetas y colapsa espacios en blanco.
 */
export function plainTextFromHtml(html: string | null | undefined): string {
  if (!html?.trim()) return "";
  const withoutTags = html.replace(/<[^>]*>/g, " ");
  return withoutTags.replace(/\s+/g, " ").trim();
}
