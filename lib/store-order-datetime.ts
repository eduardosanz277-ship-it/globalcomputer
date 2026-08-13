/**
 * Fecha/hora de pedidos estable en SSR y cliente (evita hydration mismatch
 * por espacios Unicode de `Intl.DateTimeFormat`, p. ej. U+202F).
 */
export function formatStoreOrderDateTime(
  iso: string | null | undefined,
  localeTag: "es" | "en",
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const datePart =
    localeTag === "en" ? `${mm}/${dd}/${year}` : `${dd}/${mm}/${year}`;

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const isPm = hours >= 12;
  hours = hours % 12;
  if (hours === 0) hours = 12;

  const timePart =
    localeTag === "en"
      ? `${hours}:${minutes} ${isPm ? "PM" : "AM"}`
      : `${hours}:${minutes} ${isPm ? "p. m." : "a. m."}`;

  return `${datePart} ${timePart}`;
}
