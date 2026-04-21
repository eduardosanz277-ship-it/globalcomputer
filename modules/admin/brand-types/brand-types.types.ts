/** Tipo de producto por marca (tabla `brand_types`). */
export type BrandType = {
  id: string;
  brandId: string;
  brandName: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandTypeInsert = {
  brandId: string;
  name: string;
  slug: string;
  active: boolean;
};

export type BrandTypeUpdate = {
  brandId: string;
  name: string;
  slug: string;
  active: boolean;
};
