"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Building2, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { adminServiceLikeInputClassName } from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  computePricesForStrategy,
  previewPriceAfterDiscount,
  type PricingStrategy,
} from "@/modules/admin/products/product-pricing-calculator";
import type { ProductFormValues } from "@/modules/admin/products/products.schema";

type Props = {
  form: UseFormReturn<ProductFormValues>;
  isPending: boolean;
  sectionClassName: string;
};

const STRATEGIES: PricingStrategy[] = [
  "cost",
  "manual",
  "client_price",
  "business_price",
];

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function formatMoney(value: number, locale: "es" | "en"): string {
  const numberLocale = locale === "en" ? "en-US" : "es-AR";
  const amount = new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
  return `$${amount}`;
}

type PricingInputFieldProps = {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: string;
};

function PricingInputField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  min = 0,
  max,
  step = "0.01",
}: PricingInputFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(adminServiceLikeInputClassName, "tabular-nums")}
      />
      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PreviewCard({
  icon,
  title,
  amount,
  subtitle,
  accentClass,
}: {
  icon: ReactNode;
  title: string;
  amount: string;
  subtitle: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br p-4 shadow-sm",
        accentClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {icon}
            {title}
          </div>
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {amount}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function toInputString(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "";
  return String(value);
}

export function ProductPricingTab({
  form,
  isPending,
  sectionClassName,
}: Props) {
  const { t, locale } = useI18n();
  const errors = form.formState.errors;

  const pricingStrategy = form.watch("pricingStrategy");
  const cost = form.watch("cost");
  const marginClientPct = form.watch("marginClientPct");
  const marginBusinessPct = form.watch("marginBusinessPct");
  const priceClient = form.watch("priceClient");
  const priceBusiness = form.watch("priceBusiness");
  const discountClientPct = form.watch("discountClientPct");
  const discountBusinessPct = form.watch("discountBusinessPct");
  const stock = form.watch("stock");

  useEffect(() => {
    if (pricingStrategy === "manual") return;

    const computed = computePricesForStrategy(pricingStrategy, {
      cost: Number(cost) || 0,
      marginClientPct: Number(marginClientPct) || 0,
      marginBusinessPct: Number(marginBusinessPct) || 0,
      priceClient: Number(priceClient) || 0,
      priceBusiness: Number(priceBusiness) || 0,
    });

    if (computed.priceClient !== priceClient) {
      form.setValue("priceClient", computed.priceClient, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    if (computed.priceBusiness !== priceBusiness) {
      form.setValue("priceBusiness", computed.priceBusiness, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    form,
    pricingStrategy,
    cost,
    marginClientPct,
    marginBusinessPct,
    priceClient,
    priceBusiness,
  ]);

  const clientFinal = useMemo(
    () =>
      previewPriceAfterDiscount(
        Number(priceClient) || 0,
        Number(discountClientPct) || 0,
      ),
    [priceClient, discountClientPct],
  );

  const businessFinal = useMemo(
    () =>
      previewPriceAfterDiscount(
        Number(priceBusiness) || 0,
        Number(discountBusinessPct) || 0,
      ),
    [priceBusiness, discountBusinessPct],
  );

  const setStrategy = (strategy: PricingStrategy) => {
    form.setValue("pricingStrategy", strategy, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const setMoneyField = (
    name: "cost" | "priceClient" | "priceBusiness",
    raw: string,
  ) => {
    const n = Number(raw);
    form.setValue(name, Number.isFinite(n) ? Math.max(0, n) : 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const setPercentField = (
    name:
      | "marginClientPct"
      | "marginBusinessPct"
      | "discountClientPct"
      | "discountBusinessPct",
    raw: string,
  ) => {
    const n = Number(raw);
    form.setValue(name, Number.isFinite(n) ? Math.max(0, n) : 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const setStockField = (raw: string) => {
    const n = Number(raw);
    form.setValue("stock", Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const strategyLabels: Record<PricingStrategy, string> = {
    cost: t("admin.products.form.pricing.modes.fromCost"),
    client_price: t("admin.products.form.pricing.modes.fromPublic"),
    business_price: t("admin.products.form.pricing.modes.fromBusiness"),
    manual: t("admin.products.form.pricing.modes.manual"),
  };

  const strategyHints: Record<PricingStrategy, string> = {
    cost: t("admin.products.form.pricing.modeHints.fromCost"),
    client_price: t("admin.products.form.pricing.modeHints.fromPublic"),
    business_price: t("admin.products.form.pricing.modeHints.fromBusiness"),
    manual: t("admin.products.form.pricing.modeHints.manual"),
  };

  const clientSubtitle = formatTemplate(
    t("admin.products.form.pricing.preview.clientSubtitle"),
    {
      list: formatMoney(Number(priceClient) || 0, locale),
      discount: Number(discountClientPct) || 0,
    },
  );

  const businessSubtitle = formatTemplate(
    t("admin.products.form.pricing.preview.businessSubtitle"),
    {
      list: formatMoney(Number(priceBusiness) || 0, locale),
      discount: Number(discountBusinessPct) || 0,
    },
  );

  return (
    <section className={cn(sectionClassName, "space-y-6")}>
      <PricingInputField
        id="product-stock"
        label={t("admin.products.form.fields.stock")}
        value={toInputString(stock)}
        onChange={setStockField}
        disabled={isPending}
        min={0}
        step="1"
      />

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t("admin.products.form.pricing.strategyTitle")}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("admin.products.form.pricing.strategyDescription")}
          </p>
        </div>

        <div
          role="tablist"
          aria-label={t("admin.products.form.pricing.modesAria")}
          className="-mx-1 flex min-w-0 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain border-b border-border/60 pb-3 [scrollbar-width:thin]"
        >
          {STRATEGIES.map((item) => {
            const active = pricingStrategy === item;
            return (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isPending}
                onClick={() => setStrategy(item)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/80 bg-muted/25 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                {strategyLabels[item]}
              </button>
            );
          })}
        </div>

        <p className="rounded-xl border border-border/50 bg-muted/25 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {strategyHints[pricingStrategy]}
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 shadow-sm sm:p-5">
        {pricingStrategy === "cost" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PricingInputField
              id="pricing-cost"
              label={t("admin.products.form.pricing.fields.cost")}
              hint={t("admin.products.form.pricing.fields.costHint")}
              value={toInputString(cost)}
              onChange={(value) => setMoneyField("cost", value)}
              disabled={isPending}
            />
            <PricingInputField
              id="pricing-client-margin"
              label={t("admin.products.form.pricing.fields.clientMargin")}
              hint={t("admin.products.form.pricing.fields.clientMarginHint")}
              value={toInputString(marginClientPct)}
              onChange={(value) => setPercentField("marginClientPct", value)}
              disabled={isPending}
              max={100}
            />
            <PricingInputField
              id="pricing-business-margin"
              label={t("admin.products.form.pricing.fields.businessMargin")}
              hint={t("admin.products.form.pricing.fields.businessMarginHint")}
              value={toInputString(marginBusinessPct)}
              onChange={(value) => setPercentField("marginBusinessPct", value)}
              disabled={isPending}
              max={100}
            />
          </div>
        ) : null}

        {pricingStrategy === "client_price" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PricingInputField
              id="pricing-client-price"
              label={t("admin.products.form.pricing.fields.clientPrice")}
              hint={t("admin.products.form.pricing.fields.clientPriceHint")}
              value={toInputString(priceClient)}
              onChange={(value) => setMoneyField("priceClient", value)}
              disabled={isPending}
            />
            <PricingInputField
              id="pricing-business-margin-from-client"
              label={t("admin.products.form.pricing.fields.businessMargin")}
              hint={t(
                "admin.products.form.pricing.fields.businessMarginFromClientHint",
              )}
              value={toInputString(marginBusinessPct)}
              onChange={(value) => setPercentField("marginBusinessPct", value)}
              disabled={isPending}
              max={100}
            />
          </div>
        ) : null}

        {pricingStrategy === "business_price" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PricingInputField
              id="pricing-business-price"
              label={t("admin.products.form.pricing.fields.businessPrice")}
              hint={t("admin.products.form.pricing.fields.businessPriceHint")}
              value={toInputString(priceBusiness)}
              onChange={(value) => setMoneyField("priceBusiness", value)}
              disabled={isPending}
            />
            <PricingInputField
              id="pricing-client-margin-from-business"
              label={t("admin.products.form.pricing.fields.clientMargin")}
              hint={t(
                "admin.products.form.pricing.fields.clientMarginFromBusinessHint",
              )}
              value={toInputString(marginClientPct)}
              onChange={(value) => setPercentField("marginClientPct", value)}
              disabled={isPending}
              max={100}
            />
          </div>
        ) : null}

        {pricingStrategy === "manual" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PricingInputField
              id="pricing-manual-client-price"
              label={t("admin.products.form.pricing.fields.clientPrice")}
              hint={t("admin.products.form.pricing.fields.clientPriceHint")}
              value={toInputString(priceClient)}
              onChange={(value) => setMoneyField("priceClient", value)}
              disabled={isPending}
            />
            <PricingInputField
              id="pricing-manual-business-price"
              label={t("admin.products.form.pricing.fields.businessPrice")}
              hint={t("admin.products.form.pricing.fields.businessPriceHint")}
              value={toInputString(priceBusiness)}
              onChange={(value) => setMoneyField("priceBusiness", value)}
              disabled={isPending}
            />
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/50 pt-4 sm:grid-cols-2">
          <PricingInputField
            id="pricing-discount-client"
            label={t("admin.products.form.pricing.fields.clientDiscount")}
            hint={t("admin.products.form.pricing.fields.clientDiscountHint")}
            value={toInputString(discountClientPct)}
            onChange={(value) => setPercentField("discountClientPct", value)}
            disabled={isPending}
            max={100}
          />
          <PricingInputField
            id="pricing-discount-business"
            label={t("admin.products.form.pricing.fields.businessDiscount")}
            hint={t("admin.products.form.pricing.fields.businessDiscountHint")}
            value={toInputString(discountBusinessPct)}
            onChange={(value) => setPercentField("discountBusinessPct", value)}
            disabled={isPending}
            max={100}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {t("admin.products.form.pricing.previewTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("admin.products.form.pricing.previewDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PreviewCard
            icon={<UserRound className="h-3.5 w-3.5" aria-hidden />}
            title={t("admin.products.detail.client")}
            amount={formatMoney(clientFinal, locale)}
            subtitle={clientSubtitle}
            accentClass="from-sky-500/[0.07] via-card to-card"
          />
          <PreviewCard
            icon={<Building2 className="h-3.5 w-3.5" aria-hidden />}
            title={t("admin.products.detail.business")}
            amount={formatMoney(businessFinal, locale)}
            subtitle={businessSubtitle}
            accentClass="from-violet-500/[0.07] via-card to-card"
          />
        </div>

        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
          {formatTemplate(t("admin.products.form.pricing.storedSummary"), {
            client: formatMoney(Number(priceClient) || 0, locale),
            business: formatMoney(Number(priceBusiness) || 0, locale),
            discountClient: Number(discountClientPct) || 0,
            discountBusiness: Number(discountBusinessPct) || 0,
          })}
        </div>

        {errors.stock?.message ||
        errors.priceClient?.message ||
        errors.priceBusiness?.message ||
        errors.discountBusinessPct?.message ||
        errors.discountClientPct?.message ||
        errors.cost?.message ||
        errors.marginClientPct?.message ||
        errors.marginBusinessPct?.message ? (
          <p className="text-sm text-destructive">
            {errors.stock?.message ??
              errors.priceClient?.message ??
              errors.priceBusiness?.message ??
              errors.discountBusinessPct?.message ??
              errors.discountClientPct?.message ??
              errors.cost?.message ??
              errors.marginClientPct?.message ??
              errors.marginBusinessPct?.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
