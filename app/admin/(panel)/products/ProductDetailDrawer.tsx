"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  ImageOff,
  PencilLine,
  Trash2,
} from "lucide-react";
import type { Product } from "@/modules/admin/products/products.types";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateDdMmYyyyHhMm } from "@/utils/formatDateTime";
import { ProductDescriptionViewer } from "@/components/ProductDescriptionViewer";
import { useI18n } from "@/components/i18n/I18nProvider";
import { hasPublishedRichHtml } from "@/lib/plainTextFromHtml";

type Props = {
  product: Product | null;
  onClose: () => void;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
};

function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").filter(Boolean).at(-1);
    return last || "manual.pdf";
  } catch {
    const fallback = url.split("/").filter(Boolean).at(-1);
    return fallback || "manual.pdf";
  }
}

function stockBadgeClass(stock: number): string {
  return stock <= 0
    ? "inline-flex items-center rounded-full bg-neutral-600 px-2.5 py-1 text-xs font-medium text-white"
    : "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700";
}

function activeBadgeClass(active: boolean): string {
  return active
    ? "inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
    : "inline-flex items-center rounded-full border border-slate-200/90 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700";
}

export function ProductDetailDrawer({
  product,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const { t, locale } = useI18n();
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [specificCharacteristicsOpen, setSpecificCharacteristicsOpen] =
    useState(false);
  const [specificationsOpen, setSpecificationsOpen] = useState(false);
  const [accessoriesOpen, setAccessoriesOpen] = useState(false);
  const open = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setDescriptionOpen(false);
    setSpecificCharacteristicsOpen(false);
    setSpecificationsOpen(false);
    setAccessoriesOpen(false);
  }, [open, product?.id]);

  const characteristicGroups = useMemo(() => {
    if (!product) return [];
    const groups = new Map<string, typeof product.characteristicValues>();
    for (const item of product.characteristicValues) {
      const key =
        (locale === "en"
          ? item.generalNameEn?.trim() || item.generalName
          : item.generalName) || t("admin.products.detail.noGeneralCategory");
      const list = groups.get(key) ?? [];
      list.push(item);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [product, t, locale]);

  if (!product) {
    return (
      <SlideOver
        open={open}
        onClose={onClose}
        title={t("admin.products.detail.title")}
        description={t("admin.products.detail.description")}
        panelClassName="md:w-[min(90vw,42rem)] lg:w-[55%] lg:max-w-none"
        contentAriaLabel={t("admin.products.detail.aria")}
      >
        <p className="text-sm text-muted-foreground">
          {t("admin.products.detail.noneSelected")}
        </p>
      </SlideOver>
    );
  }

  const localizedCatalogLabel =
    locale === "en" ? product.catalogLabelEn || product.catalogLabel : product.catalogLabel;
  const localizedBrandName =
    locale === "en" ? product.brandNameEn?.trim() || product.brandName : product.brandName;
  const localizedBrandTypeName =
    locale === "en"
      ? product.brandTypeNameEn?.trim() || product.brandTypeName
      : product.brandTypeName;

  const catalogParts = localizedCatalogLabel
    .split(/\s*›\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  const categoryName = catalogParts[0] ?? "—";
  const subcategoryName = catalogParts[1] ?? "—";
  const hasCategory = categoryName !== "—";
  const hasSubcategory = subcategoryName !== "—";
  const hasBrandType =
    Boolean(localizedBrandTypeName?.trim()) && localizedBrandTypeName !== "—";

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={t("admin.products.detail.title")}
      description={t("admin.products.detail.description")}
      panelClassName="md:w-[min(90vw,42rem)] lg:w-[55%] lg:max-w-none"
      contentAriaLabel={t("admin.products.detail.aria")}
    >
      <div className="space-y-4 md:space-y-5">
        <header className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              {product.imageUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-muted">
                  <Image
                    src={product.imageUrl}
                    alt={locale === "en" ? (product.nameEn ?? product.name) : product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted text-muted-foreground">
                  <ImageOff className="h-9 w-9" aria-hidden />
                  <span className="sr-only">{t("admin.products.table.noImage")}</span>
                </span>
              )}
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-xl font-semibold text-foreground md:text-2xl">
                  {locale === "en" ? (product.nameEn ?? product.name) : product.name}
                </h2>
                <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
                  <p>
                    <span className="font-medium">SKU:</span> {product.sku}
                  </p>

                  {hasCategory ? (
                    <>
                      <p className="hidden sm:block">
                        {categoryName}
                        {hasSubcategory ? ` · ${subcategoryName}` : ""}
                      </p>
                      <div className="space-y-0.5 sm:hidden">
                        <p>{categoryName}</p>
                        {hasSubcategory ? (
                          <p className="text-[11px] text-muted-foreground/80">
                            {subcategoryName}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}

                  <div>
                    <p className="hidden sm:block">
                      {localizedBrandName}
                      {hasBrandType ? ` · ${localizedBrandTypeName}` : ""}
                    </p>
                    <div className="space-y-0.5 sm:hidden">
                      <p>{localizedBrandName}</p>
                      {hasBrandType ? (
                        <p className="text-[11px] text-muted-foreground/80">
                          {localizedBrandTypeName}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <TooltipProvider delayDuration={120}>
              <div className="flex items-center gap-1 self-end sm:self-start">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => onEdit?.(product)}
                      aria-label={t("admin.products.detail.editAria")}
                    >
                      <PencilLine className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                  >
                    <span className="block font-medium">
                      {t("admin.products.detail.editAria")}
                    </span>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => onDelete?.(product)}
                      aria-label={t("admin.products.detail.deleteAria")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    align="start"
                    className="rounded-xl border-border/60 bg-popover px-3 py-2 text-[11px] text-popover-foreground shadow-xl"
                  >
                    <span className="block font-medium">
                      {t("admin.products.detail.deleteAria")}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => setDescriptionOpen((prev) => !prev)}
            aria-expanded={descriptionOpen}
            aria-label={
              descriptionOpen
                ? t("admin.products.detail.collapseDescription")
                : t("admin.products.detail.expandDescription")
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/20"
          >
            <span className="text-sm font-medium text-foreground">
              {t("admin.products.form.tabs.description")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${descriptionOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${descriptionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden border-t border-border/70">
              {hasPublishedRichHtml(
                locale === "en"
                  ? (product.descriptionEn ?? product.description)
                  : product.description,
              ) ? (
                <div className="px-4 pb-2.5 pt-4 text-sm">
                  <ProductDescriptionViewer
                    descripcion={
                      locale === "en"
                        ? (product.descriptionEn ?? product.description ?? "")
                        : (product.description ?? "")
                    }
                  />
                </div>
              ) : (
                <div className="m-4 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {t("admin.products.detail.noDescription")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            {t("admin.products.detail.commercialInfo")}
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                {t("admin.products.form.pricing.fields.clientPrice")}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrencyUsd(product.priceClient)}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("admin.products.form.pricing.fields.businessPrice")}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formatCurrencyUsd(product.priceBusiness)}
              </p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">
                  {t("admin.products.table.discounts")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t("admin.products.detail.business")}{" "}
                    {product.discountBusinessPct}%
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {t("admin.products.detail.client")}{" "}
                    {product.discountClientPct}%
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.products.table.stock")}
                  </p>
                  <div className="mt-2">
                    <span className={stockBadgeClass(product.stock)}>
                      {product.stock <= 0
                        ? t("admin.products.detail.outOfStock")
                        : `${product.stock} ${t("admin.products.table.inStock")}`}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("admin.products.table.status")}
                  </p>
                  <div className="mt-2">
                    <span className={activeBadgeClass(product.active)}>
                      {product.active
                        ? t("admin.products.table.statusActive")
                        : t("admin.products.table.statusInactive")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            {t("admin.products.detail.imagesTitle")}
          </h3>
          {product.images.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]">
              {product.images.map((image) => (
                <article
                  key={image.id}
                  className="group relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted sm:w-40"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={image.url}
                      alt={`${locale === "en" ? (product.nameEn ?? product.name) : product.name} - ${t("admin.products.detail.imageAltSuffix")}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 160px"
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  </div>
                  {image.isPrimary ? (
                    <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                      {t("admin.products.detail.primary")}
                    </span>
                  ) : null}
                </article>
              ))}
            </div>
          ) : product.imageUrl ? (
            <div className="mt-3 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:thin]">
              <article className="relative w-36 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted sm:w-40">
                <div className="relative aspect-square">
                  <Image
                    src={product.imageUrl}
                    alt={`${locale === "en" ? (product.nameEn ?? product.name) : product.name} - ${t("admin.products.detail.imageAltSuffix")}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 160px"
                    className="object-cover"
                  />
                </div>
                <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-primary/25">
                  {t("admin.products.detail.primary")}
                </span>
              </article>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {t("admin.products.detail.noImages")}
            </div>
          )}

          <div className="mt-4 border-t border-border/60 pt-4">
            <h4 className="text-sm font-medium text-foreground">
              {t("admin.products.detail.attachments")}
            </h4>
            {product.manualPdfUrl?.trim() ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {getFileNameFromUrl(product.manualPdfUrl)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t("admin.products.detail.manualPdf")}
                    </p>
                  </div>
                </div>
                <a
                  href={product.manualPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="sr-only">
                    {t("admin.products.detail.viewManual")}
                  </span>
                </a>
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {t("admin.products.detail.noAttachment")}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => setSpecificCharacteristicsOpen((prev) => !prev)}
            aria-expanded={specificCharacteristicsOpen}
            aria-label={
              specificCharacteristicsOpen
                ? t("admin.products.detail.collapseSpecificCharacteristics")
                : t("admin.products.detail.expandSpecificCharacteristics")
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/20"
          >
            <span className="text-sm font-medium text-foreground">
              {t("admin.products.detail.specificCharacteristics")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${specificCharacteristicsOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${specificCharacteristicsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden border-t border-border/70">
              {characteristicGroups.length > 0 ? (
                <div className="space-y-3 p-4">
                  {characteristicGroups.map(([generalName, rows]) => (
                    <article
                      key={generalName}
                      className="overflow-hidden rounded-lg border border-border/70 bg-muted/20"
                    >
                      <header className="border-b border-border/70 bg-muted/40 px-3 py-2">
                        <p className="text-xs font-medium tracking-wide text-foreground">
                          {generalName}
                        </p>
                      </header>
                      <div className="flex flex-wrap gap-2 p-3">
                        {rows.map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5"
                          >
                            <p className="truncate text-sm font-medium text-foreground">
                              {locale === "en"
                                ? item.specificNameEn?.trim() ||
                                  item.specificName
                                : item.specificName}
                            </p>
                            {item.value?.trim() ? (
                              <p className="truncate text-xs text-muted-foreground">
                                · {item.value}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="m-4 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {t("admin.products.detail.noSpecificCharacteristics")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => setSpecificationsOpen((prev) => !prev)}
            aria-expanded={specificationsOpen}
            aria-label={
              specificationsOpen
                ? t("admin.products.detail.collapseSpecifications")
                : t("admin.products.detail.expandSpecifications")
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/20"
          >
            <span className="text-sm font-medium text-foreground">
              {t("admin.products.detail.specifications")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${specificationsOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${specificationsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden border-t border-border/70">
              {hasPublishedRichHtml(
                locale === "en"
                  ? (product.specificationsEn ?? product.specifications)
                  : product.specifications,
              ) ? (
                <div className="min-w-0 max-w-full overflow-x-auto px-4 py-2.5 text-sm sm:pb-2.5 sm:pt-4">
                  <ProductDescriptionViewer
                    className="admin-product-specs max-w-full break-words [&_img]:max-w-full"
                    descripcion={
                      locale === "en"
                        ? (product.specificationsEn ?? product.specifications ?? "")
                        : (product.specifications ?? "")
                    }
                  />
                </div>
              ) : (
                <div className="m-4 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {t("admin.products.detail.noSpecifications")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <button
            type="button"
            onClick={() => setAccessoriesOpen((prev) => !prev)}
            aria-expanded={accessoriesOpen}
            aria-label={
              accessoriesOpen
                ? t("admin.products.detail.collapseAccessories")
                : t("admin.products.detail.expandAccessories")
            }
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/20"
          >
            <span className="text-sm font-medium text-foreground">
              {t("admin.products.detail.accessories")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${accessoriesOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${accessoriesOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden border-t border-border/70">
              {(product?.accessories?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2 p-4">
                  {product?.accessories.map((item) => (
                    <div
                      key={item.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 py-1.5"
                    >
                      <p className="truncate text-sm font-medium text-foreground">
                        {locale === "en"
                          ? item.nameEn?.trim() || item.name
                          : item.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        · {item.sku}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="m-4 rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {t("admin.products.detail.noAccessories")}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h3 className="text-sm font-medium text-foreground">
            {t("admin.products.detail.metadata")}
          </h3>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="h-4 w-4" aria-hidden />
            <span>
              {t("admin.products.detail.updatedOn")}{" "}
              {formatDateDdMmYyyyHhMm(product.updatedAt, locale).replace(", ", " ")}
            </span>
          </div>
        </section>
      </div>
    </SlideOver>
  );
}
