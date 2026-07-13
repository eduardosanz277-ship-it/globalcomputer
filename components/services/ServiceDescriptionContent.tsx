"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";
import { isEffectivelyEmptyDescriptionHtml } from "@/lib/normalizeProductDescriptionHtml";
import { cn } from "@/utils/cn";

type Props = {
  description: string | null;
  descriptionEn?: string | null;
  className?: string;
};

function resolveServiceDescription(
  locale: string,
  description: string | null,
  descriptionEn?: string | null,
): string | null {
  if (locale !== "en") return description;

  const english = descriptionEn?.trim();
  if (english && !isEffectivelyEmptyDescriptionHtml(english)) {
    return english;
  }

  return description;
}

export function ServiceDescriptionContent({
  description,
  descriptionEn,
  className,
}: Props) {
  const { locale, t } = useI18n();
  const currentDescription = resolveServiceDescription(
    locale,
    description,
    descriptionEn,
  );
  const hasDescription = Boolean(currentDescription?.trim());

  return (
    <section
      className={cn(
        "w-full rounded-2xl border border-border/60 bg-white py-3 shadow-sm",
        "max-lg:relative max-lg:z-20 max-lg:max-w-none max-lg:rounded-b-none max-lg:rounded-t-2xl max-lg:border-b-0 max-lg:border-t max-lg:px-4 max-lg:pb-4 max-lg:pt-4 max-lg:shadow-none",
        "lg:isolate lg:bg-white lg:px-5",
        className,
      )}
    >
      <div>
        {hasDescription ? (
          <ProductDescriptionViewer descripcion={currentDescription ?? ""} />
        ) : (
          <p className="text-sm italic text-muted-foreground">
            {t("admin.products.detail.noDescription")}
          </p>
        )}
      </div>
    </section>
  );
}
