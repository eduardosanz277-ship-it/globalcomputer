/** Característica general de producto (tabla `product_characteristics_general`). */
export type GeneralCharacteristic = {
  id: string;
  name: string;
  nameEn: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  slug: string;
};

export type GeneralCharacteristicInsert = {
  name: string;
  nameEn: string;
  active: boolean;
  slug?: string;
};

export type GeneralCharacteristicUpdate = {
  name: string;
  nameEn: string;
  active: boolean;
  slug?: string;
};
