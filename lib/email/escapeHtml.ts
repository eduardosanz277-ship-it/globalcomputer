export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SKU_EMAIL_SEGMENT_STYLE =
  "font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:inherit;text-decoration:none !important;";

function skuEmailSegment(text: string): string {
  return `<span x-apple-data-detectors="false" style="${SKU_EMAIL_SEGMENT_STYLE}">${escapeHtml(text)}</span>`;
}

function skuEmailDot(): string {
  return `<span x-apple-data-detectors="false" aria-hidden="true" style="${SKU_EMAIL_SEGMENT_STYLE}">&#46;&#8203;</span>`;
}

/**
 * Valor del SKU en HTML de correo: cada segmento va en un `<span>` distinto y los
 * puntos usan entidad + zero-width space. Evita auto-enlaces en Gmail/iOS cuando
 * el sufijo parece TLD (p. ej. `59359.94.NC` → `.NC` es dominio válido).
 */
export function renderSkuValueForEmailHtml(
  sku: string,
  options?: { color?: string; fontSize?: string },
): string {
  const trimmed = sku.trim();
  if (!trimmed) return "";

  const color = options?.color ?? "inherit";
  const fontSize = options?.fontSize ?? "inherit";
  const style = `${SKU_EMAIL_SEGMENT_STYLE}color:${color};font-size:${fontSize};`;

  const segment = (text: string) =>
    `<span x-apple-data-detectors="false" style="${style}">${escapeHtml(text)}</span>`;
  const dot = () =>
    `<span x-apple-data-detectors="false" aria-hidden="true" style="${style}">&#46;&#8203;</span>`;

  const parts = trimmed.split(".");
  if (parts.length === 1) {
    return segment(parts[0]!);
  }

  return parts
    .map((part, index) => (index === 0 ? segment(part) : `${dot()}${segment(part)}`))
    .join("");
}