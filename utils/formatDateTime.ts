/**
 * Fecha/hora estable entre SSR y cliente (evita hydration mismatch).
 * Usa locale y zona fijas; los timestamps de Supabase suelen venir en UTC.
 */
const formatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatDateTimeUtc(
  value: string | Date | null | undefined
): string {
  if (value == null) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return `${formatter.format(d)} UTC`;
}

export type AppDateLocale = "es" | "en";

/**
 * Fecha/hora local: `es` mantiene dd/MM/yyyy 12h; `en` usa formato corto en-US.
 */
export function formatDateDdMmYyyyHhMm(
  value: string | Date | null | undefined,
  dateLocale: AppDateLocale = "es",
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  if (dateLocale === "en") {
    return new Intl.DateTimeFormat("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hour24 = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${dd}/${mm}/${yyyy} ${hour12}:${min} ${suffix}`;
}
