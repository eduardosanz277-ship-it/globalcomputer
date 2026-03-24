/** Característica general de producto (tabla `product_characteristics_general`). */
export type GeneralCharacteristic = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeneralCharacteristicInsert = {
  name: string;
  active: boolean;
};

export type GeneralCharacteristicUpdate = {
  name: string;
  active: boolean;
};
