export type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
};

export type ProductCharacteristicValue = {
  id: string;
  specificId: string;
  specificName: string;
  specificNameEn: string | null;
  generalName: string;
  generalNameEn: string | null;
  value: string | null;
};

/** Producto (tabla `products`). */
export type Product = {
  id: string;
  sku: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  specifications: string | null;
  specificationsEn: string | null;
  stock: number;
  price: number;
  discountBusinessPct: number;
  discountClient: number;
  manualPdfUrl: string | null;
  active: boolean;
  /** Prioridad para bloques de destacados en la tienda (columna `featured`). */
  featured: boolean;
  brandId: string;
  brandName: string;
  brandNameEn: string | null;
  brandTypeId: string;
  brandTypeName: string;
  brandTypeNameEn: string | null;
  /** En BD: categoría directa, o null si el producto está en una subcategoría. */
  categoryId: string | null;
  /** En BD: subcategoría, o null si el producto está solo en categoría. */
  subcategoryId: string | null;
  /** Texto para tablas y detalle (ej. «Periféricos» o «Periféricos › Teclados»). */
  catalogLabel: string;
  /** Variante en inglés del texto de catálogo para vistas i18n. */
  catalogLabelEn: string;
  /**
   * Categoría padre en el formulario: si hay subcategoría, coincide con su `category_id`;
   * si no, es `category_id` del producto.
   */
  placementCategoryId: string;
  /** Subcategoría elegida en el formulario; vacío si el producto va solo en la categoría. */
  placementSubcategoryId: string;
  imageUrl: string | null;
  images: ProductImage[];
  characteristicValues: ProductCharacteristicValue[];
  createdAt: string;
  updatedAt: string;
  slug: string;
};

export type ProductInsert = {
  sku: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  specifications: string;
  specificationsEn: string;
  stock: number;
  price: number;
  discountBusinessPct: number;
  discountClient: number;
  manualPdfUrl: string;
  active: boolean;
  featured: boolean;
  brandId: string;
  brandTypeId: string;
  /** Categoría (padre si eliges subcategoría). */
  placementCategoryId: string;
  /** Vacío = producto en la categoría; UUID = producto en esa subcategoría. */
  placementSubcategoryId: string;
  slug?: string;
};

export type ProductUpdate = ProductInsert;

export type ProductCharacteristicValueInput = {
  specificId: string;
  value?: string;
};

export type ExistingProductImageOutput = {
  id: string;
  order: number;
  isPrimary: boolean;
};