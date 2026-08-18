"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import {
  canGoBackInternally,
  consumeStorefrontProductBackHref,
  isStorefrontListingPath,
  isStorefrontProductDetailPath,
  recordStorefrontProductVisit,
  resetStorefrontProductNavStack,
  scrollStorefrontToPageTop,
  STOREFRONT_CATALOG_PATH,
} from "@/lib/storefront-product-nav";
import { cn } from "@/utils/cn";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";

type Props = {
  className?: string;
  /** Origen (`?from=`): listado o ficha anterior. */
  fromPath?: string | null;
};

export function StorefrontProductBackLink({ className, fromPath }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const fallbackHref =
    fromPath &&
    (isStorefrontListingPath(fromPath) || isStorefrontProductDetailPath(fromPath))
      ? fromPath
      : STOREFRONT_CATALOG_PATH;

  useEffect(() => {
    recordStorefrontProductVisit(fromPath);
  }, [fromPath]);

  const goTo = (href: string) => {
    router.push(href);
    scrollStorefrontToPageTop();
    window.setTimeout(scrollStorefrontToPageTop, 50);
  };

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
      event.preventDefault();
      resetStorefrontProductNavStack();
      goTo(fromPath);
      return;
    }

    if (fromPath && isStorefrontProductDetailPath(fromPath)) {
      event.preventDefault();
      const previousHref = consumeStorefrontProductBackHref();
      goTo(previousHref && isStorefrontProductDetailPath(previousHref)
        ? previousHref
        : fromPath);
      return;
    }

    if (canGoBackInternally()) {
      event.preventDefault();
      router.back();
      window.setTimeout(() => {
        scrollStorefrontToPageTop();
      }, 0);
      return;
    }
  };

  return (
    <Link
      href={fallbackHref}
      scroll
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
