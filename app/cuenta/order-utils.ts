export const orderStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  paid: "bg-green-100 text-green-800",
  processing: "bg-primary/15 text-primary",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-900",
  confirmada: "bg-green-100 text-emerald-800",
  procesando: "bg-amber-100 text-amber-900",
  enviando: "bg-sky-100 text-sky-800",
  completada: "bg-violet-100 text-violet-900",
};

export function formatOrderDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatOrderCurrency(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}
