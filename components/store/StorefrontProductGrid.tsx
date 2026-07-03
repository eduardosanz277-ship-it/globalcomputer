"use client";

import { StorefrontProductCard } from "@/components/store/StorefrontProductCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { StorefrontPriceTier } from "@/lib/storefront-pricing";
import type { StorefrontProduct } from "@/modules/catalog/storefront-product.shared";
import { cn } from "@/utils/cn";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export function StorefrontProductGrid({
  products,
  priceTier,
  gridClassName,
}: {
  products: StorefrontProduct[];
  priceTier: StorefrontPriceTier;
  gridClassName?: string;
}) {
  const { t } = useI18n();

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-12 text-center text-sm text-muted-foreground">
        {t("storefront.grid.emptySection")}
      </p>
    );
  }

  return (
    <ul
      className={cn(
        "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
        gridClassName,
      )}
    >
      {products.map((p) => (
        <StorefrontProductCard
          key={p.id}
          product={p}
          priceTier={priceTier}
          interClassName={inter.className}
        />
      ))}
    </ul>
  );
}
