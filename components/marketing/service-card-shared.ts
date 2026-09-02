export type ServiceRow = {
  id: string;
  name: string;
  name_en?: string | null;
  description: string | null;
  description_en?: string | null;
  short_description?: string | null;
  short_description_en?: string | null;
  slug?: string | null;
  service_images?: Array<{
    id: string;
    url: string;
    is_primary: boolean;
    sort_order: number | null;
  }> | null;
};

export function clampText(text: string, maxLen: number) {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

export function resolvePrimaryServiceImage(
  images: ServiceRow["service_images"],
): string | null {
  if (!images || images.length === 0) return null;
  const ordered = images
    .slice()
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
    })
    .filter((img) => Boolean(img.url));
  return ordered[0]?.url ?? null;
}

/** Imágenes del servicio para el catálogo público, sin la principal. */
export function resolveServiceGalleryImages(
  images: ServiceRow["service_images"],
): Array<{ id: string; url: string }> {
  if (!images || images.length === 0) return [];
  return images
    .filter((img) => Boolean(img.url?.trim()) && !img.is_primary)
    .slice()
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
    .map((img) => ({ id: img.id, url: img.url }));
}
