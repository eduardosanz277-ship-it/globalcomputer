"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import {
  canGoBackInternally,
  isStorefrontListingPath,
  STOREFRONT_CATALOG_PATH,
} from "@/lib/storefront-product-nav";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";

type Props = {
  className?: string;
  /** Listado de origen (`?from=`), p. ej. `/catalog/alarmas`. */
  fromPath?: string | null;
};

export function StorefrontProductBackLink({ className, fromPath }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const listingHref =
    fromPath && isStorefrontListingPath(fromPath)
      ? fromPath
      : STOREFRONT_CATALOG_PATH;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }
    if (fromPath && isStorefrontListingPath(fromPath)) {
      return;
    }
    if (!canGoBackInternally()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Link
      href={listingHref}
      onClick={handleClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 self-start border-0 bg-transparent p-0 text-[16px] font-medium leading-none text-muted-foreground no-underline transition-colors hover:text-primary",
        className,
      )}
    >
      <ArrowLeft className="h-[18px] w-[18px] shrink-0" aria-hidden strokeWidth={2} />
      {t("storefront.productDetail.back")}
    </Link>
  );
}
