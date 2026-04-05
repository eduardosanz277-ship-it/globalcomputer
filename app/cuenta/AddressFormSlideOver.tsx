"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import {
  FormSelectField,
  type SelectOption,
} from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import {
  countryCodeToName,
  DEFAULT_COUNTRY_CODE,
} from "@/lib/countries-options";
import {
  countryHasRegionList,
  getRegionsForCountry,
} from "@/lib/address-regions";
import { addAddressAction, updateAddressAction } from "./actions";
import type { CuentaAddress } from "./types";

const ADDRESS_FORM_ID = "cuenta-address-form-slide-over";

const addressFormSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  company: z.string(),
  apartment: z.string(),
  phone: z.string(),
  street: z.string().trim().min(1, "La calle es obligatoria"),
  city: z.string().trim().min(1, "La ciudad es obligatoria"),
  state: z.string(),
  postalCode: z.string().trim().min(1, "El código postal es obligatorio"),
  countryCode: z.string().min(1),
  isDefault: z.boolean(),
});

/** País fijo: solo EE. UU.; el desplegable queda deshabilitado. */
const LOCKED_COUNTRY_OPTIONS: SelectOption[] = [
  {
    value: DEFAULT_COUNTRY_CODE,
    label: countryCodeToName(DEFAULT_COUNTRY_CODE),
  },
];

export type AddressFormValues = z.infer<typeof addressFormSchema>;

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
  const router = useRouter();
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
      successMessage: "Dirección agregada",
      errorMessage: "No se pudo guardar la dirección",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateAddressAction,
    {
      successMessage: "Dirección actualizada",
      errorMessage: "No se pudo actualizar la dirección",
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
      title={address ? "Editar dirección" : "Nueva dirección"}
      description="Completa tus datos de contacto, la dirección postal y el estado. Puedes marcar una dirección como predeterminada."
      contentAriaLabel="Formulario de dirección"
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <ButtonPending
            type="submit"
            form={ADDRESS_FORM_ID}
            pending={isPending}
            pendingLabel="Guardando"
            skipMinWidth
            className="px-6"
          >
            Guardar
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
              label="Nombre"
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="lastName"
              label="Apellido"
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="company"
              label="Compañía"
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="phone"
              label="Teléfono"
              type="tel"
              disabled={isPending}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="street"
              label="Calle"
              required
              disabled={isPending}
              error={errors.street?.message}
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="apartment"
              label="Apartamento"
              disabled={isPending}
              placeholder="Apto., suite, etc."
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="city"
              label="Ciudad"
              required
              disabled={isPending}
              error={errors.city?.message}
              className={adminServiceLikeInputClassName}
            />
            <FormSelectField<AddressFormValues>
              name="countryCode"
              label="País"
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
                label="Provincia / Estado"
                options={regionOptions}
                instanceId={`cuenta-address-region-${countryCode}`}
                isDisabled={isPending}
                isSearchable
                useMenuPortal
                placeholder="Buscar provincia o estado…"
              />
            ) : (
              <FormField
                name="state"
                label="Provincia / Estado"
                disabled={isPending}
                className={adminServiceLikeInputClassName}
              />
            )}
            <FormField
              name="postalCode"
              label="Código postal"
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
                        Dirección por defecto
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        Se usará como predeterminada en envíos cuando no elijas
                        otra.
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
