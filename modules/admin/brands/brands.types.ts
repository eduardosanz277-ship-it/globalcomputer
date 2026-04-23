/** Marca de producto (tabla `brands`). */
export type Brand = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandInsert = {
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
};

export type BrandUpdate = {
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
};
