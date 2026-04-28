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

  const timePart = new Intl.DateTimeFormat(
    localeTag === "en" ? "en-US" : "es-ES",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  ).format(d);

  return `${datePart} ${timePart}`;
}
