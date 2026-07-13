export type ServiceHeroBannerSources = {
  mobileUrl?: string | null;
  tabletUrl?: string | null;
  desktopUrl?: string | null;
  shortDescription?: string | null;
  shortDescriptionEn?: string | null;
};

/** Fallbacks en `/public` cuando el servicio no tiene banners en BD. */
export const SERVICE_HERO_DEFAULT_BANNERS = {
  mobile: "/images/services/banner-mobile.jpg",
  tablet: "/images/services/banner-tablet.jpg",
  desktop: "/images/services/banner-desktop.jpg",
} as const;

export function hasServiceHeroBanner(
  _sources?: ServiceHeroBannerSources,
): boolean {
  // Siempre hay hero: DB o imágenes por defecto en public.
  return true;
}

export function resolveServiceHeroContent(sources: ServiceHeroBannerSources): {
  mobileSrc: string;
  tabletSrc: string;
  desktopSrc: string;
  summaryEs: string;
  summaryEn: string;
  usingDefaults: boolean;
} {
  const mobile = sources.mobileUrl?.trim() || "";
  const tablet = sources.tabletUrl?.trim() || "";
  const desktop = sources.desktopUrl?.trim() || "";
  const hasAnyConfigured = Boolean(mobile || tablet || desktop);

  const summaryEs = sources.shortDescription?.trim() || "";
  const summaryEn =
    sources.shortDescriptionEn?.trim() ||
    sources.shortDescription?.trim() ||
    "";

  if (!hasAnyConfigured) {
    return {
      mobileSrc: SERVICE_HERO_DEFAULT_BANNERS.mobile,
      tabletSrc: SERVICE_HERO_DEFAULT_BANNERS.tablet,
      desktopSrc: SERVICE_HERO_DEFAULT_BANNERS.desktop,
      summaryEs,
      summaryEn,
      usingDefaults: true,
    };
  }

  return {
    mobileSrc: mobile || tablet || desktop,
    tabletSrc: tablet || desktop || mobile,
    desktopSrc: desktop || tablet || mobile,
    summaryEs,
    summaryEn,
    usingDefaults: false,
  };
}
