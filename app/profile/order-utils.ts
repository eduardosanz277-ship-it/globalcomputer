import { formatUsd } from "@/components/store/store-cart-format";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";

export const orderStatusStyles: Record<string, string> = {
  pending: "bg-slate-50 text-slate-700 border border-slate-200",
  confirmed: "bg-sky-50 text-sky-700 border border-sky-200",
  processing: "bg-amber-50 text-amber-700 border border-amber-200",
  shipping: "bg-violet-50 text-violet-700 border border-violet-200",
  completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border border-red-200",
  /** Legado (por si quedan datos sin migrar en cliente). */
  confirmada: "bg-sky-50 text-sky-700 border border-sky-200",
  procesando: "bg-amber-50 text-amber-700 border border-amber-200",
  enviando: "bg-violet-50 text-violet-700 border border-violet-200",
  completada: "bg-emerald-50 text-emerald-700 border border-emerald-200",
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
