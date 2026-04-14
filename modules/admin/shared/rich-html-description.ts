/**
 * Límite único para descripciones en HTML (Tiptap) en productos y servicios.
 * Las columnas en Supabase son `text` (sin tope de VARCHAR).
 */
export const RICH_HTML_DESCRIPTION_MAX_LENGTH = 200_000 as const;

export const RICH_HTML_DESCRIPTION_MAX_ERROR =
  "La descripción HTML supera el tamaño máximo permitido" as const;
