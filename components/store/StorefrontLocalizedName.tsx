"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { storefrontLocalizedText } from "@/modules/catalog/storefront-product.shared";

type Props = {
  name: string;
  nameEn?: string | null;
};

/** Texto visible según el idioma activo en la UI (`name` = ES, `name_en` = EN en catálogo). */
export function StorefrontLocalizedName({ name, nameEn }: Props) {
  const { locale } = useI18n();
  return <>{storefrontLocalizedText(locale, name, nameEn)}</>;
}
