/** Marca de producto (tabla `brands`). */
export type Brand = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandInsert = {
  name: string;
  slug: string;
  active: boolean;
};

export type BrandUpdate = {
  name: string;
  slug: string;
  active: boolean;
};
