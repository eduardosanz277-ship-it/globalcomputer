import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";

/**
 * Misma apariencia que la descripción vacía en la tabla de servicios
 * (`italic text-muted-foreground/80`).
 */
export const adminTableEmptyEmDashClassName = "italic text-muted-foreground/80";

export function AdminTableEmptyEmDash({
  className,
  block,
}: {
  className?: string;
  /** Para celdas con truncate (p. ej. descripción larga). */
  block?: boolean;
}) {
  return (
    <span
      className={cn(
        adminTableEmptyEmDashClassName,
        block && "block min-w-0 max-w-full truncate",
        className,
      )}
    >
      —
    </span>
  );
}

/** Fecha formateada o guión en gris si no hay valor / no es válida. */
export function adminTableDateCell(
  value: Parameters<typeof formatDateDdMmYyyyHhMm>[0],
): ReactNode {
  const s = formatDateDdMmYyyyHhMm(value);
  if (s === "—") return <AdminTableEmptyEmDash />;
  return s;
}

/** Texto recortado o guión en gris si está vacío. */
export function adminTableOptionalString(
  value: string | null | undefined,
  opts?: {
    classNameWhenPresent?: string;
    block?: boolean;
  },
): ReactNode {
  const v = value?.trim();
  if (!v) return <AdminTableEmptyEmDash block={opts?.block} />;
  return <span className={opts?.classNameWhenPresent}>{v}</span>;
}
