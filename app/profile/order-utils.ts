import { formatUsd } from "@/components/store/store-cart-format";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";

export const orderStatusStyles: Record<string, string> = {
  pending: "bg-slate-50 text-slate-600 border border-slate-100",
  confirmed: "bg-sky-50 text-sky-600 border border-sky-100",
  processing: "bg-amber-50 text-amber-600 border border-amber-100",
  shipping: "bg-violet-50 text-violet-600 border border-violet-100",
  completed: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  cancelled: "bg-red-50 text-red-600 border border-red-100",
  /** Legado (por si quedan datos sin migrar en cliente). */
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
