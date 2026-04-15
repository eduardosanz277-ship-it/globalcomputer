export type CuentaAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  apartment: string | null;
  phone: string | null;
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
  amountSubtotal: number;
  amountTax: number;
  amountShipping: number;
  stripeAmountTotal: number;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};
