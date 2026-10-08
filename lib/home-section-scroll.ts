const HOME_SECTION_IDS = ["destacados", "servicios", "ofertas", "marcas"] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export function parseHomeSectionId(
  href: string | null | undefined,
): HomeSectionId | null {
  if (!href) return null;
  const hashIndex = href.indexOf("#");
  if (hashIndex < 0) return null;
  const id = href.slice(hashIndex + 1).split("?")[0]?.trim() ?? "";
  return HOME_SECTION_IDS.includes(id as HomeSectionId)
    ? (id as HomeSectionId)
    : null;
}

/** Mismo `behavior: "smooth"` que el botón flotante de subir. */
export function smoothScrollToHomeSection(id: HomeSectionId): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}
