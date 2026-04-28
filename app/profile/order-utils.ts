import { formatUsd } from "@/components/store/store-cart-format";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";

export const orderStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-800",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-900",
  confirmada: "bg-sky-50 text-sky-600 border border-sky-100",
  procesando: "bg-amber-50 text-amber-600 border border-amber-100",
  enviando: "bg-violet-50 text-violet-600 border border-violet-100",
  completada: "bg-emerald-50 text-emerald-600 border border-emerald-100",
};

export function formatOrderDate(
  iso: string | null | undefined,
  localeTag: "es" | "en" = "es",
): string {
  return formatStoreOrderDateTime(iso, localeTag) ?? "—";
}

export function formatOrderCurrency(
  value: number,
  _localeTag?: "es" | "en",
): string {
  return formatUsd(value);
}
