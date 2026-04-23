/** Tipo de producto por marca (tabla `brand_types`). */
export type BrandType = {
  id: string;
  brandId: string;
  brandName: string;
  brandNameEn: string | null;
  name: string;
  nameEn: string | null;
  slug: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandTypeInsert = {
  brandId: string;
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
};

export type BrandTypeUpdate = {
  brandId: string;
  name: string;
  nameEn: string;
  slug: string;
  active: boolean;
};
