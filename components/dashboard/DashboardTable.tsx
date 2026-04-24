"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useI18n } from "@/components/i18n/I18nProvider";

export type DashboardProductRow = {
  id: string;
  name: string;
  nameEn?: string | null;
  brand: string;
  brandEn?: string | null;
  price: number;
  stock: number;
  active: boolean;
};

type DashboardTableProps = {
  rows: DashboardProductRow[];
};

/** Solo visibilidad en catálogo (`products.active`). El stock va en la columna Stock. */
function catalogStatusPill(active: boolean, t: (key: string) => string) {
  if (!active) {
    return (
      <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
        {t("admin.home.table.statusInactive")}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {t("admin.home.table.statusActive")}
    </span>
  );
}

export function DashboardTable({ rows }: DashboardTableProps) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "en" ? "en-US" : "es-AR";
  const moneyFormatter = new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t("admin.home.table.title")}</CardTitle>
        <CardDescription>
          {t("admin.home.table.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.home.table.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-3 font-medium">{t("admin.home.table.product")}</th>
                  <th className="px-2 py-3 font-medium">{t("admin.home.table.brand")}</th>
                  <th className="px-2 py-3 font-medium">{t("admin.home.table.price")}</th>
                  <th className="px-2 py-3 font-medium">{t("admin.home.table.stock")}</th>
                  <th className="px-2 py-3 font-medium">{t("admin.home.table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-2 py-3 font-medium text-foreground">
                      {locale === "en" ? row.nameEn?.trim() || row.name : row.name}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {(locale === "en" ? row.brandEn?.trim() || row.brand : row.brand) ||
                        t("admin.home.chart.noBrand")}
                    </td>
                    <td className="px-2 py-3">
                      {moneyFormatter.format(row.price)}
                    </td>
                    <td className="px-2 py-3">
                      {row.stock.toLocaleString(numberLocale)}
                    </td>
                    <td className="px-2 py-3">
                      {catalogStatusPill(row.active, t)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
