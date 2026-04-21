export type ServiceImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

/** Servicio (tabla `services`). */
export type Service = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  images: ServiceImage[];
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceInsert = {
  name: string;
  description: string;
  slug?: string;
};

export type ServiceUpdate = {
  name: string;
  description: string;
  slug?: string;
};

export type ExistingServiceImageOutput = {
  id: string;
  order: number;
  isPrimary: boolean;
};
