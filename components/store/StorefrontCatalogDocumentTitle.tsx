"use client";

import { StorefrontTieredDocumentTitle } from "@/components/store/StorefrontTieredDocumentTitle";

type Props = {
  categoryName: string;
  categoryNameEn: string | null;
  subcategoryName?: string;
  subcategoryNameEn?: string | null;
};

export function StorefrontCatalogDocumentTitle({
  categoryName,
  categoryNameEn,
  subcategoryName,
  subcategoryNameEn,
}: Props) {
  return (
    <StorefrontTieredDocumentTitle
      primaryName={categoryName}
      primaryNameEn={categoryNameEn}
      secondaryName={subcategoryName}
      secondaryNameEn={subcategoryNameEn}
    />
  );
}
