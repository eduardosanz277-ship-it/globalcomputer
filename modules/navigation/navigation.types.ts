export type NavigationCharacteristicSpecific = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
};

/** Fila principal Security System (`product_characteristics_general`). */
export type NavigationCharacteristicGeneral = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  specifics: NavigationCharacteristicSpecific[];
};

export type NavigationBrandType = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
};

export type NavigationBrand = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  brandTypes: NavigationBrandType[];
};

export type NavigationService = {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  slug: string;
};

/** Subcategoría de catálogo (`subcategories`). */
export type NavigationCatalogSubcategory = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
};

/** Categoría de producto con subcategorías (`categories` + `subcategories`). */
export type NavigationCatalogCategory = {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  subcategories: NavigationCatalogSubcategory[];
};

export type NavigationData = {
  characteristicsGeneral: NavigationCharacteristicGeneral[];
  brands: NavigationBrand[];
  services: NavigationService[];
  catalogCategories: NavigationCatalogCategory[];
};
