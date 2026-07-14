export type ServiceImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type ServiceBannerBreakpoint = "mobile" | "tablet" | "desktop";

export type ServiceBannerAsset = {
  url: string | null;
  storageBucket: string | null;
  storagePath: string | null;
};

/** Servicio (tabla `services`). */
export type ServiceTextAlign = "left" | "center" | "right";

export type Service = {
  id: string;
  name: string;
  nameEn: string | null;
  shortDescription: string | null;
  shortDescriptionEn: string | null;
  textAlign: ServiceTextAlign;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  images: ServiceImage[];
  bannerMobile: ServiceBannerAsset;
  bannerTablet: ServiceBannerAsset;
  bannerDesktop: ServiceBannerAsset;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInsert = {
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  textAlign: ServiceTextAlign;
  description: string;
  descriptionEn: string;
  slug?: string;
};

export type ServiceUpdate = {
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  textAlign: ServiceTextAlign;
  description: string;
  descriptionEn: string;
  slug?: string;
};

export type ServiceBannerFiles = {
  mobile?: File | null;
  tablet?: File | null;
  desktop?: File | null;
};

export type ServiceBannerRemovals = {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
};

export type ExistingServiceImageOutput = {
  id: string;
  order: number;
  isPrimary: boolean;
};
