import {
  formatDateDdMmYyyyHhMm,
  type AppDateLocale,
} from "@/utils/formatDateTime";

function capitalizeFirst(text: string, locale: AppDateLocale): string {
  const t = text.trim();
  if (!t) return text;
  const tag = locale === "en" ? "en-US" : "es-ES";
  return t.charAt(0).toLocaleUpperCase(tag) + t.slice(1);
}

/**
 * Texto relativo tipo “último acceso”; pasado ~30 días muestra fecha absoluta.
 */
export function formatRelativeLastAccess(
  value: string | Date | null | undefined,
  locale: AppDateLocale = "es",
): string | null {
  if (value == null) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;

  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return formatDateDdMmYyyyHhMm(d, locale);

  const tag = locale === "en" ? "en-US" : "es-ES";
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hours = Math.floor(min / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDateDdMmYyyyHhMm(d, locale);

  if (days > 0) return capitalizeFirst(rtf.format(-days, "day"), locale);
  if (hours > 0) return capitalizeFirst(rtf.format(-hours, "hour"), locale);
  if (min > 0) return capitalizeFirst(rtf.format(-min, "minute"), locale);
  return locale === "en"
    ? "Just now"
    : capitalizeFirst("hace un momento", locale);
}
