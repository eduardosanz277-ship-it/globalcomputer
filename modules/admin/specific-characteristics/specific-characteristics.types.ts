/** Característica específica de producto (tabla `product_characteristics_specific`). */
export type SpecificCharacteristic = {
  id: string;
  generalId: string;
  generalName: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  slug: string;
};

export type SpecificCharacteristicInsert = {
  generalId: string;
  name: string;
  active: boolean;
  slug?: string;
};

export type SpecificCharacteristicUpdate = {
  generalId: string;
  name: string;
  active: boolean;
  slug?: string;
};
