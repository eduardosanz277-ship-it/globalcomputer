export type NavigationCharacteristicSpecific = {
  id: string;
  name: string;
};

/** Fila principal Security System (`product_characteristics_general`). */
export type NavigationCharacteristicGeneral = {
  id: string;
  name: string;
  specifics: NavigationCharacteristicSpecific[];
};

export type NavigationBrandType = {
  id: string;
  name: string;
};

export type NavigationBrand = {
  id: string;
  name: string;
  brandTypes: NavigationBrandType[];
};

export type NavigationService = {
  id: string;
  name: string;
  description?: string | null;
};

/** Subcategoría de catálogo (`subcategories`). */
export type NavigationCatalogSubcategory = {
  id: string;
  name: string;
};

/** Categoría de producto con subcategorías (`categories` + `subcategories`). */
export type NavigationCatalogCategory = {
  id: string;
  name: string;
  subcategories: NavigationCatalogSubcategory[];
};

export type NavigationData = {
  characteristicsGeneral: NavigationCharacteristicGeneral[];
  brands: NavigationBrand[];
  services: NavigationService[];
  catalogCategories: NavigationCatalogCategory[];
};
