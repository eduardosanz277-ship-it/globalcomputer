"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";

type Props = {
  description: string | null;
  descriptionEn?: string | null;
  className?: string;
};

export function ServiceDescriptionContent({
  description,
  descriptionEn,
  className,
}: Props) {
  const { locale, t } = useI18n();
  const currentDescription =
    locale === "en" ? descriptionEn?.trim() || description : description;
  const hasDescription = Boolean(currentDescription?.trim());

  return (
    <section
      className={`rounded-2xl border border-border/60 bg-white px-5 py-3 shadow-sm ${className ?? ""}`}
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
