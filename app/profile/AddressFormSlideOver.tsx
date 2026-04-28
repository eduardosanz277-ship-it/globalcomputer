"use client";

import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import {
  FormSelectField,
  type SelectOption,
} from "@/components/ui/form-fields";
import { Form, FormField } from "@/components/ui/form";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  countryHasRegionList,
  getRegionsForCountry,
} from "@/lib/address-regions";
import {
  countryCodeToName,
  DEFAULT_COUNTRY_CODE,
} from "@/lib/countries-options";
import { useServerAction } from "@/hooks/use-server-action";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { addAddressAction, updateAddressAction } from "./actions";
import type { CuentaAddress } from "./types";

const ADDRESS_FORM_ID = "cuenta-address-form-slide-over";

/** País fijo: solo EE. UU.; el desplegable queda deshabilitado. */
const LOCKED_COUNTRY_OPTIONS: SelectOption[] = [
  {
    value: DEFAULT_COUNTRY_CODE,
    label: countryCodeToName(DEFAULT_COUNTRY_CODE),
  },
];

export type AddressFormValues = z.infer<ReturnType<typeof buildAddressSchema>>;

function buildAddressSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string(),
    lastName: z.string(),
    company: z.string(),
    apartment: z.string(),
    phone: z.string(),
    street: z.string().trim().min(1, t("profile.validationStreetRequired")),
    city: z.string().trim().min(1, t("profile.validationCityRequired")),
    state: z.string(),
    postalCode: z.string().trim().min(1, t("profile.validationPostalRequired")),
    countryCode: z.string().min(1),
    isDefault: z.boolean(),
  });
}

function emptyFormValues(): AddressFormValues {
  return {
    firstName: "",
    lastName: "",
    company: "",
    apartment: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    countryCode: DEFAULT_COUNTRY_CODE,
    isDefault: false,
  };
}

function addressToFormValues(address: CuentaAddress): AddressFormValues {
  return {
    firstName: address.firstName ?? "",
    lastName: address.lastName ?? "",
    company: address.company ?? "",
    apartment: address.apartment ?? "",
    phone: address.phone ?? "",
    street: address.street,
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode ?? "",
    countryCode: DEFAULT_COUNTRY_CODE,
    isDefault: address.isDefault,
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = nueva dirección */
  address: CuentaAddress | null;
};

export function AddressFormSlideOver({ open, onOpenChange, address }: Props) {
  const { t } = useI18n();
  const router = useRouter();

  const addressFormSchema = useMemo(() => buildAddressSchema(t), [t]);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: emptyFormValues(),
  });

  const countryCode = form.watch("countryCode");
  const regionOptions = getRegionsForCountry(countryCode);
  const showRegionSelect = countryHasRegionList(countryCode);

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    addAddressAction,
    {
      successMessage: t("profile.toastAddressAdded"),
      errorMessage: t("profile.toastAddressAddError"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateAddressAction,
    {
      successMessage: t("profile.toastAddressUpdated"),
      errorMessage: t("profile.toastAddressUpdateError"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;
  /** Al editar la que ya es predeterminada, no mostrar el check (sigue siendo predeterminada al guardar). */
  const showDefaultCheckbox = !address || !address.isDefault;

  useEffect(() => {
    if (!open) return;
    if (address) {
      form.reset(addressToFormValues(address));
    } else {
      form.reset(emptyFormValues());
    }
  }, [open, address, form]);

  const onSubmit = (values: AddressFormValues) => {
    const country = countryCodeToName(DEFAULT_COUNTRY_CODE);
    const isDefault =
      Boolean(address?.isDefault) || values.isDefault;
    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      company: values.company,
      apartment: values.apartment,
      phone: values.phone,
      street: values.street,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country,
      isDefault,
    };
    if (address) {
      executeUpdate({ addressId: address.id, ...payload });
    } else {
      executeCreate(payload);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        address ? t("profile.addressFormEdit") : t("profile.addressFormNew")
      }
      description={t("profile.addressFormDescription")}
      contentAriaLabel={t("profile.addressFormAria")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("profile.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={ADDRESS_FORM_ID}
            pending={isPending}
            pendingLabel={t("profile.saving")}
            skipMinWidth
            className="px-6"
          >
            {t("profile.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form
        id={ADDRESS_FORM_ID}
        form={form}
        onSubmit={onSubmit}
        className="space-y-0"
      >
        <section className={adminSlideOverSectionClassName}>
          <div className="flex flex-col gap-4">
            <FormField
              name="firstName"
              label={t("profile.labelFirstName")}
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="lastName"
              label={t("profile.labelLastName")}
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="company"
              label={t("profile.labelCompany")}
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="phone"
              label={t("profile.labelPhone")}
              type="tel"
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="street"
              label={t("profile.labelStreet")}
              required
              disabled={isPending}
              error={errors.street?.message}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="apartment"
              label={t("profile.labelApartment")}
              disabled={isPending}
              placeholder={t("profile.apartmentPlaceholder")}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="city"
              label={t("profile.labelCity")}
              required
              disabled={isPending}
              error={errors.city?.message}
              className={adminServiceLikeInputClassName}
            />
            <FormSelectField<AddressFormValues>
              name="countryCode"
              label={t("profile.labelCountry")}
              options={LOCKED_COUNTRY_OPTIONS}
              instanceId="cuenta-address-country"
              isDisabled
              isSearchable={false}
              useMenuPortal={false}
            />
            {showRegionSelect ? (
              <FormSelectField<AddressFormValues>
                key={`state-${countryCode}`}
                name="state"
                label={t("profile.labelRegion")}
                options={regionOptions}
                instanceId={`cuenta-address-region-${countryCode}`}
                isDisabled={isPending}
                isSearchable
                useMenuPortal
                placeholder={t("profile.regionSearchPlaceholder")}
              />
            ) : (
              <FormField
                name="state"
                label={t("profile.labelRegion")}
                disabled={isPending}
                className={adminServiceLikeInputClassName}
              />
            )}
            <FormField
              name="postalCode"
              label={t("profile.labelPostalCode")}
              required
              disabled={isPending}
              error={errors.postalCode?.message}
              className={adminServiceLikeInputClassName}
            />
            {showDefaultCheckbox ? (
              <Controller
                name="isDefault"
                control={form.control}
                render={({ field }) => (
                  <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/15 px-3 py-3">
                    <input
                      id="cuenta-address-is-default"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isPending}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                    <label
                      htmlFor="cuenta-address-is-default"
                      className="min-w-0 cursor-pointer text-sm leading-snug"
                    >
                      <span className="font-medium text-foreground">
                        {t("profile.defaultCheckboxTitle")}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        {t("profile.defaultCheckboxHint")}
                      </span>
                    </label>
                  </div>
                )}
              />
            ) : null}
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
