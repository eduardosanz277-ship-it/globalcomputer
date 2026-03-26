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
  generalName: string;
  value: string | null;
};

/** Producto (tabla `products`). */
export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  stock: number;
  price: number;
  discountBusinessPct: number;
  discountClient: number;
  manualPdfUrl: string | null;
  brandId: string;
  brandName: string;
  brandTypeId: string;
  brandTypeName: string;
  imageUrl: string | null;
  images: ProductImage[];
  characteristicValues: ProductCharacteristicValue[];
  createdAt: string;
  updatedAt: string;
};

export type ProductInsert = {
  sku: string;
  name: string;
  description: string;
  stock: number;
  price: number;
  discountBusinessPct: number;
  discountClient: number;
  manualPdfUrl: string;
  brandId: string;
  brandTypeId: string;
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