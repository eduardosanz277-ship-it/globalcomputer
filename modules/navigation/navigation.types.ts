export type NavigationCharacteristicSpecific = {
  id: string;
  name: string;
  nameEn?: string | null;
};

/** Fila principal Security System (`product_characteristics_general`). */
export type NavigationCharacteristicGeneral = {
  id: string;
  name: string;
  nameEn?: string | null;
  specifics: NavigationCharacteristicSpecific[];
};

export type NavigationBrandType = {
  id: string;
  name: string;
  nameEn?: string | null;
};

export type NavigationBrand = {
  id: string;
  name: string;
  nameEn?: string | null;
  brandTypes: NavigationBrandType[];
};

export type NavigationService = {
  id: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
};

/** Subcategoría de catálogo (`subcategories`). */
export type NavigationCatalogSubcategory = {
  id: string;
  name: string;
  nameEn?: string | null;
};

/** Categoría de producto con subcategorías (`categories` + `subcategories`). */
export type NavigationCatalogCategory = {
  id: string;
  name: string;
  nameEn?: string | null;
  subcategories: NavigationCatalogSubcategory[];
};

export type NavigationData = {
  characteristicsGeneral: NavigationCharacteristicGeneral[];
  brands: NavigationBrand[];
  services: NavigationService[];
  catalogCategories: NavigationCatalogCategory[];
};
