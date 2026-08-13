"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { formatStoreOrderDateTime } from "@/lib/store-order-datetime";
import type { StoreOrderStatusHistoryRow } from "@/modules/commerce/store-order-status-history";
import type { SiteOrderStatus } from "@/modules/commerce/store-orders.service";
import { cn } from "@/utils/cn";

const STATUS_DOT_CLASSES: Record<SiteOrderStatus, string> = {
  pending: "bg-slate-500 ring-slate-200",
  confirmed: "bg-sky-500 ring-sky-200",
  processing: "bg-amber-500 ring-amber-200",
  shipping: "bg-violet-500 ring-violet-200",
  completed: "bg-emerald-500 ring-emerald-200",
  cancelled: "bg-red-500 ring-red-200",
};

/**
 * Centro vertical de la bolita: top-1.5 (0.375rem) + mitad de h-2.5 (0.3125rem).
 * La línea empieza/termina aquí para no sobresalir del primer/último estado.
 */
const DOT_CENTER = "0.6875rem";
/** Centro horizontal de la bolita (left-0 + mitad de w-2.5). */
const DOT_CENTER_X = "0.3125rem";

type Props = {
  entries: StoreOrderStatusHistoryRow[];
  statusLabels: Record<SiteOrderStatus, string>;
  statusBadgeClass: (status: SiteOrderStatus) => string;
  /** Si es false, no muestra quién realizó el cambio (p. ej. panel de cliente). */
  showActor?: boolean;
  /**
   * En viewports menores a 375px, la fecha va siempre debajo del estado
   * (útil en consulta pública en pantallas muy estrechas).
   */
  stackDateBelowOnNarrow?: boolean;
};

/** Línea de tiempo de cambios de estado del pedido. */
export function OrderStatusHistoryTimeline({
  entries,
  statusLabels,
  statusBadgeClass,
  showActor = true,
  stackDateBelowOnNarrow = false,
}: Props) {
  const { t, locale } = useI18n();
  const showConnectors = entries.length > 1;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t("admin.orders.history.title")}
      </h3>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          {t("admin.orders.history.empty")}
        </p>
      ) : (
        <ol className="space-y-0">
          {entries.map((entry, index) => {
            const isFirst = index === 0;
            const isLast = index === entries.length - 1;
            const when =
              formatStoreOrderDateTime(entry.createdAt, locale) ?? "—";
            const actor = entry.changedByName?.trim()
              ? entry.changedByName.trim()
              : t("admin.orders.history.systemActor");
            return (
              <li key={entry.id} className="relative pb-5 pl-6 last:pb-0">
                {/* Une con el estado siguiente (desde el centro de la bolita). */}
                {showConnectors && !isLast ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 w-0.5 -translate-x-1/2 bg-border/80"
                    style={{ left: DOT_CENTER_X, top: DOT_CENTER }}
                  />
                ) : null}
                {showConnectors && !isFirst ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 w-0.5 -translate-x-1/2 bg-border/80"
                    style={{ left: DOT_CENTER_X, height: DOT_CENTER }}
                  />
                ) : null}
                <span
                  className={cn(
                    "absolute left-0 top-1.5 z-10 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                    STATUS_DOT_CLASSES[entry.status],
                    isLast && "ring-primary/15",
                  )}
                  aria-hidden
                />
                <div className="space-y-1.5">
                  <div
                    className={cn(
                      "flex flex-wrap items-center gap-2",
                      stackDateBelowOnNarrow &&
                        "max-[374px]:flex-col max-[374px]:items-start max-[374px]:gap-1",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex",
                        statusBadgeClass(entry.status),
                      )}
                    >
                      {statusLabels[entry.status]}
                    </span>
                    <time
                      dateTime={entry.createdAt}
                      className="text-xs tabular-nums text-muted-foreground"
                    >
                      {when}
                    </time>
                  </div>
                  {showActor ? (
                    <p className="text-xs text-muted-foreground">
                      {t("admin.orders.history.changedBy").replace(
                        "{name}",
                        actor,
                      )}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
