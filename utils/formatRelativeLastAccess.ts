import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

function capitalizeFirst(text: string): string {
  const t = text.trim();
  if (!t) return text;
  return t.charAt(0).toLocaleUpperCase("es") + t.slice(1);
}

/**
 * Texto para “último acceso”: relativo en español si es reciente;
 * si supera ~30 días, fecha absoluta (dd/MM/yyyy h:mm AM/PM).
 * Las cadenas relativas empiezan en mayúscula (p. ej. “Hace 5 minutos”).
 */
export function formatRelativeLastAccess(
  value: string | Date | null | undefined,
): string | null {
  if (value == null) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;

  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 0) return formatDateDdMmYyyyHhMm(d);

  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hours = Math.floor(min / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDateDdMmYyyyHhMm(d);

  if (days > 0) return capitalizeFirst(rtf.format(-days, "day"));
  if (hours > 0) return capitalizeFirst(rtf.format(-hours, "hour"));
  if (min > 0) return capitalizeFirst(rtf.format(-min, "minute"));
  return capitalizeFirst("hace un momento");
}
