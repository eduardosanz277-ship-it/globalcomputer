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

export type ServiceFormSubmitData = {
  name: string;
  description: string;
  newImages: NewServiceImageOutput[];
  updatedExistingImages: ExistingServiceImageOutput[];
  removedImages: string[];
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
