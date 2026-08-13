import type { OrderShippingRecipient } from "@/lib/order-shipping-recipient";
import type { StoreOrderStatusHistoryRow } from "@/modules/commerce/store-order-status-history";

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
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string | null;
  itemsCount: number;
  amountSubtotal: number;
  amountTax: number;
  amountShipping: number;
  amountDiscount: number;
  stripeAmountTotal: number;
  shippingAddress: OrderShippingRecipient | null;
  statusHistory: StoreOrderStatusHistoryRow[];
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
};
