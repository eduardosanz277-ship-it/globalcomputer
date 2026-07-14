"use client";

export type ExistingServiceImageInput = {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
};

export type ExistingServiceImageOutput = {
  id: string;
  order: number;
  isPrimary: boolean;
};

export type NewServiceImageOutput = {
  file: File;
  order: number;
  isPrimary: boolean;
};

export type ServiceBannerBreakpoint = "mobile" | "tablet" | "desktop";

export type ServiceFormSubmitData = {
  name: string;
  nameEn: string;
  shortDescription: string;
  shortDescriptionEn: string;
  textAlign: "left" | "center" | "right";
  description: string;
  descriptionEn: string;
  newImages: NewServiceImageOutput[];
  updatedExistingImages: ExistingServiceImageOutput[];
  removedImages: string[];
  bannerMobileFile: File | null;
  bannerTabletFile: File | null;
  bannerDesktopFile: File | null;
  removeBannerMobile: boolean;
  removeBannerTablet: boolean;
  removeBannerDesktop: boolean;
};

export type ServiceImageItem = {
  key: string;
  source: "existing" | "new";
  existingId?: string;
  file?: File;
  url: string;
  order: number;
  isPrimary: boolean;
};
