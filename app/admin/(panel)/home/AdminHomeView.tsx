"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardChart } from "@/components/dashboard/DashboardChart";
import {
  DashboardTable,
  type DashboardProductRow,
} from "@/components/dashboard/DashboardTable";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  Boxes,
  Building2,
  LayoutList,
  PackageCheck,
  PackageX,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";

type ChartItem = {
  brand: string;
  brandEn?: string | null;
  total: number;
};

type Props = {
  totalProducts: number;
  totalBrands: number;
  totalCategories: number;
  totalUsers: number;
  activeProducts: number;
  noStockProducts: number;
  availableServices: number;
  activeSubscriptions: number;
  totalSubcategories: number;
  totalBrandTypes: number;
  totalCharacteristics: number;
  chartItems: ChartItem[];
  recentProducts: DashboardProductRow[];
};

export function AdminHomeView({
  totalProducts,
  totalBrands,
  totalCategories,
  totalUsers,
  activeProducts,
  noStockProducts,
  availableServices,
  activeSubscriptions,
  totalSubcategories,
  totalBrandTypes,
  totalCharacteristics,
  chartItems,
  recentProducts,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("admin.home.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("admin.home.description")}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.home.stats.totalProducts")}
          value={totalProducts}
          icon={Boxes}
        />
        <StatCard
          label={t("admin.home.stats.totalBrands")}
          value={totalBrands}
          icon={Tags}
        />
        <StatCard
          label={t("admin.home.stats.totalCategories")}
          value={totalCategories}
          icon={LayoutList}
        />
        <StatCard
          label={t("admin.home.stats.totalUsers")}
          value={totalUsers}
          icon={Users}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("admin.home.stats.activeProducts")}
          value={activeProducts}
          icon={PackageCheck}
          hint={t("admin.home.stats.activeProductsHint")}
        />
        <StatCard
          label={t("admin.home.stats.noStockProducts")}
          value={noStockProducts}
          icon={PackageX}
          hint={t("admin.home.stats.noStockProductsHint")}
        />
        <StatCard
          label={t("admin.home.stats.availableServices")}
          value={availableServices}
          icon={ShieldCheck}
        />
        <StatCard
          label={t("admin.home.stats.activeSubscriptions")}
          value={activeSubscriptions}
          icon={Building2}
          hint={t("admin.home.stats.activeSubscriptionsHint")}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DashboardChart items={chartItems} />
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("admin.home.summary.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("admin.home.summary.categories")}
              </span>
              <span className="text-base font-semibold">{totalCategories}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("admin.home.summary.subcategories")}
              </span>
              <span className="text-base font-semibold">{totalSubcategories}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("admin.home.summary.brandTypes")}
              </span>
              <span className="text-base font-semibold">{totalBrandTypes}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
              <span className="text-sm text-muted-foreground">
                {t("admin.home.summary.registeredCharacteristics")}
              </span>
              <span className="text-base font-semibold">{totalCharacteristics}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <DashboardTable rows={recentProducts} />
      </section>
    </div>
  );
}
