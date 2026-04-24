"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/I18nProvider";

type ChartItem = {
  brand: string;
  brandEn?: string | null;
  total: number;
};

type DashboardChartProps = {
  items: ChartItem[];
};

function colorByIndex(index: number): string {
  const palette = [
    "bg-sky-500/80",
    "bg-indigo-500/80",
    "bg-violet-500/80",
    "bg-cyan-500/80",
    "bg-blue-500/80",
    "bg-emerald-500/80",
  ];
  return palette[index % palette.length];
}

export function DashboardChart({ items }: DashboardChartProps) {
  const { t, locale } = useI18n();
  const numberLocale = locale === "en" ? "en-US" : "es-AR";
  const maxValue = Math.max(...items.map((item) => item.total), 1);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{t("admin.home.chart.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.home.chart.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item, index) => {
              const localizedBrand =
                locale === "en"
                  ? item.brandEn?.trim() || item.brand
                  : item.brand;
              const displayBrand =
                localizedBrand?.trim() || t("admin.home.chart.noBrand");
              const width = (item.total / maxValue) * 100;
              return (
                <li key={`${item.brand}-${index}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {displayBrand}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.total.toLocaleString(numberLocale)}
                    </p>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${colorByIndex(index)}`}
                      style={{ width: `${Math.max(width, 6)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
