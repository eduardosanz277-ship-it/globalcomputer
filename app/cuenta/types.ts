export type CuentaAddress = {
  id: string;
  label: string | null;
  street: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
};

export type CuentaOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string | null;
  itemsCount: number;
};
