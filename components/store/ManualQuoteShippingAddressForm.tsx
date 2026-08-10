"use client";

import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Form, FormField } from "@/components/ui/form";
import {
  FormSelectField,
  type SelectOption,
} from "@/components/ui/form-fields";
import {
  countryHasRegionList,
  getRegionsForCountry,
} from "@/lib/address-regions";
import {
  countryCodeToName,
  DEFAULT_COUNTRY_CODE,
  storedCountryToCountryCode,
} from "@/lib/countries-options";
import { cn } from "@/utils/cn";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type ManualQuoteShippingAddressValues = {
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  addressLine: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type PrefillPayload = {
  address: {
    recipientName: string;
    recipientPhone: string;
    recipientEmail: string;
    addressLine: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  profile?: { fullName: string; email: string };
};

const LOCKED_COUNTRY_OPTIONS: SelectOption[] = [
  {
    value: DEFAULT_COUNTRY_CODE,
    label: countryCodeToName(DEFAULT_COUNTRY_CODE),
  },
];

function uncapitalizeLabel(label: string) {
  if (!label) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function requiredMessage(
  t: (key: string) => string,
  labelKey: string,
  gender: "m" | "f",
) {
  const label = uncapitalizeLabel(t(labelKey));
  const template = t(
    gender === "f"
      ? "storefront.cart.quoteAddressRequiredFeminine"
      : "storefront.cart.quoteAddressRequiredMasculine",
  );
  return template.replace("{label}", label);
}

function buildSchema(t: (key: string) => string) {
  return z.object({
    recipientName: z
      .string()
      .trim()
      .min(
        1,
        requiredMessage(t, "storefront.cart.quoteAddressRecipientName", "m"),
      ),
    recipientPhone: z
      .string()
      .trim()
      .min(
        1,
        requiredMessage(t, "storefront.cart.quoteAddressRecipientPhone", "m"),
      )
      .min(7, t("storefront.cart.quoteAddressPhoneInvalid")),
    recipientEmail: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || z.string().email().safeParse(v).success,
        t("storefront.cart.quoteAddressEmailInvalid"),
      ),
    addressLine: z
      .string()
      .trim()
      .min(1, requiredMessage(t, "storefront.cart.quoteAddressLine", "f")),
    addressLine2: z.string(),
    city: z
      .string()
      .trim()
      .min(1, requiredMessage(t, "storefront.cart.quoteAddressCity", "f")),
    state: z.string(),
    postalCode: z
      .string()
      .trim()
      .min(1, t("storefront.cart.quoteAddressPostalCodeRequired")),
    country: z.string().trim().min(2),
  });
}

function emptyValues(): ManualQuoteShippingAddressValues {
  return {
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    addressLine: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: DEFAULT_COUNTRY_CODE,
  };
}

type Props = {
  formId: string;
  /** Si false, no precarga (p. ej. panel cerrado). */
  active: boolean;
  submitting: boolean;
  onSubmit: (values: ManualQuoteShippingAddressValues) => void;
  className?: string;
};

export function ManualQuoteShippingAddressForm({
  formId,
  active,
  submitting,
  onSubmit,
  className,
}: Props) {
  const { t } = useI18n();
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [isNarrowMobile, setIsNarrowMobile] = useState(false);
  const schema = useMemo(() => buildSchema(t), [t]);
  const form = useForm<ManualQuoteShippingAddressValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues(),
  });

  const countryCode = form.watch("country") || DEFAULT_COUNTRY_CODE;
  const regionOptions = useMemo(
    () => getRegionsForCountry(countryCode),
    [countryCode],
  );
  const showRegionSelect = countryHasRegionList(countryCode);
  const errors = form.formState.errors;
  const busy = submitting || prefillLoading;
  const regionPlaceholder = isNarrowMobile
    ? t("storefront.cart.quoteAddressStatePlaceholderNarrow")
    : t("profile.regionSearchPlaceholder");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 374px)");
    const sync = () => setIsNarrowMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setPrefillLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/shop/shipping-address/default", {
          cache: "no-store",
        });
        const data = (await res.json()) as PrefillPayload;
        if (cancelled) return;
        if (data.address) {
          form.reset({
            recipientName:
              data.address.recipientName || data.profile?.fullName || "",
            recipientPhone: data.address.recipientPhone || "",
            recipientEmail:
              data.address.recipientEmail || data.profile?.email || "",
            addressLine: data.address.addressLine || "",
            addressLine2: data.address.addressLine2 || "",
            city: data.address.city || "",
            state: data.address.state || "",
            postalCode: data.address.postalCode || "",
            country: storedCountryToCountryCode(data.address.country),
          });
        } else {
          form.reset({
            ...emptyValues(),
            recipientName: data.profile?.fullName || "",
            recipientEmail: data.profile?.email || "",
          });
        }
      } catch {
        if (!cancelled) form.reset(emptyValues());
      } finally {
        if (!cancelled) setPrefillLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active, form]);

  function handleSubmit(values: ManualQuoteShippingAddressValues) {
    onSubmit({
      recipientName: values.recipientName.trim(),
      recipientPhone: values.recipientPhone.trim(),
      recipientEmail: values.recipientEmail.trim(),
      addressLine: values.addressLine.trim(),
      addressLine2: values.addressLine2.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      country: (values.country || DEFAULT_COUNTRY_CODE).trim().toUpperCase(),
    });
  }

  if (prefillLoading) {
    return (
      <div className="flex h-full min-h-[min(40vh,20rem)] w-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        <span>{t("storefront.cart.quoteAddressLoading")}</span>
      </div>
    );
  }

  return (
    <Form
      id={formId}
      form={form}
      onSubmit={handleSubmit}
      className={cn("space-y-0", className)}
    >
      <div className={cn(adminSlideOverSectionClassName, "p-4")}>
        <div className="flex flex-col gap-4">
          <FormField
            name="recipientName"
            label={t("storefront.cart.quoteAddressRecipientName")}
            required
            disabled={busy}
            autoComplete="name"
            error={errors.recipientName?.message}
            className={adminServiceLikeInputClassName}
          />
          <FormField
            name="recipientPhone"
            label={t("storefront.cart.quoteAddressRecipientPhone")}
            type="tel"
            required
            disabled={busy}
            autoComplete="tel"
            error={errors.recipientPhone?.message}
            className={adminServiceLikeInputClassName}
          />
          <FormField
            name="recipientEmail"
            label={t("storefront.cart.quoteAddressRecipientEmail")}
            type="email"
            disabled={busy}
            autoComplete="email"
            error={errors.recipientEmail?.message}
            className={adminServiceLikeInputClassName}
          />
          <FormField
            name="addressLine"
            label={t("storefront.cart.quoteAddressLine")}
            required
            disabled={busy}
            autoComplete="address-line1"
            error={errors.addressLine?.message}
            className={adminServiceLikeInputClassName}
          />
          <FormField
            name="addressLine2"
            label={t("storefront.cart.quoteAddressLine2")}
            disabled={busy}
            autoComplete="address-line2"
            className={adminServiceLikeInputClassName}
          />
          <FormField
            name="city"
            label={t("storefront.cart.quoteAddressCity")}
            required
            disabled={busy}
            autoComplete="address-level2"
            error={errors.city?.message}
            className={adminServiceLikeInputClassName}
          />
          <FormSelectField<ManualQuoteShippingAddressValues>
            name="country"
            label={t("storefront.cart.quoteAddressCountry")}
            options={LOCKED_COUNTRY_OPTIONS}
            instanceId={`${formId}-country`}
            isDisabled
            isSearchable={false}
            useMenuPortal
          />
          {showRegionSelect ? (
            <FormSelectField<ManualQuoteShippingAddressValues>
              key={`state-${countryCode}`}
              name="state"
              label={t("storefront.cart.quoteAddressState")}
              options={regionOptions}
              instanceId={`${formId}-region-${countryCode}`}
              isDisabled={busy}
              isSearchable
              useMenuPortal
              placeholder={regionPlaceholder}
            />
          ) : (
            <FormField
              name="state"
              label={t("storefront.cart.quoteAddressState")}
              disabled={busy}
              autoComplete="address-level1"
              className={adminServiceLikeInputClassName}
            />
          )}
          <FormField
            name="postalCode"
            label={t("storefront.cart.quoteAddressPostalCode")}
            required
            disabled={busy}
            autoComplete="postal-code"
            error={errors.postalCode?.message}
            className={adminServiceLikeInputClassName}
          />
        </div>
      </div>
    </Form>
  );
}
