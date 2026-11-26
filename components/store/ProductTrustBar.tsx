"use client";

import { Headset, ShieldCheck, Star, Truck } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/utils/cn";

/**
 * Reputación pública de la tienda en Google (ficha de Google Business).
 * Actualizar estos valores cuando cambie la ficha.
 */
const GOOGLE_RATING = 4.8;
const GOOGLE_REVIEW_COUNT = 70;

function GoogleStars({ rating }: { rating: number }) {
  return (
    <span className="relative inline-flex shrink-0" aria-hidden>
      <span className="flex gap-0.5 text-muted-foreground/40">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4" strokeWidth={1.75} />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-500"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-4 w-4 shrink-0 fill-amber-500"
            strokeWidth={1.75}
          />
        ))}
      </span>
    </span>
  );
}

/**
 * Franja de confianza de la ficha de producto: reputación en Google,
 * envío, garantía y soporte, visible junto a la zona de compra.
 */
export function ProductTrustBar({ className }: { className?: string }) {
  const { t } = useI18n();

  const items = [
    { icon: Truck, label: t("storefront.productDetail.trustShipping") },
    { icon: ShieldCheck, label: t("storefront.productDetail.trustWarranty") },
    { icon: Headset, label: t("storefront.productDetail.trustSupport") },
  ];

  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <GoogleStars rating={GOOGLE_RATING} />
        <span className="text-sm font-medium text-foreground">
          {t("storefront.productDetail.googleRatingLabel")
            .replace("{rating}", GOOGLE_RATING.toFixed(1))
            .replace("{count}", String(GOOGLE_REVIEW_COUNT))}
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-3">
        {items.map(({ icon: Icon, label }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
