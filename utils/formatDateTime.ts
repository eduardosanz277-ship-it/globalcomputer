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

/**
 * dd/MM/yyyy h:mm AM|PM (hora local, 12 horas, sufijo en mayúsculas).
 */
export function formatDateDdMmYyyyHhMm(
  value: string | Date | null | undefined
): string {
  if (value == null) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hour24 = d.getHours();
  const min = String(d.getMinutes()).padStart(2, "0");
  const suffix = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${dd}/${mm}/${yyyy} ${hour12}:${min} ${suffix}`;
}
