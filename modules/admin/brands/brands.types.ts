/** Marca de producto (tabla `brands`). */
export type Brand = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandInsert = {
  name: string;
  active: boolean;
};

export type BrandUpdate = {
  name: string;
  active: boolean;
};
