"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  SHIPPING_RATE_RANGE_ERROR,
  shippingRateFormSchema,
  type ShippingRateFormValues,
} from "@/modules/shipping/shipping.schema";
import type { ShippingRate } from "@/modules/shipping/shipping.types";
import {
  createShippingRateAdminAction,
  updateShippingRateAdminAction,
} from "@/modules/shipping/shipping.actions";
import { useServerAction } from "@/hooks/use-server-action";
import { bindAdminAction } from "@/lib/admin/bind-admin-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";

const FORM_ID = "shipping-rate-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate: ShippingRate | null;
};

function emptyValues(): ShippingRateFormValues {
  return {
    minAmount: undefined as unknown as number,
    maxAmount: undefined as unknown as number,
    cost: undefined as unknown as number,
    active: true,
    sortOrder: 0,
  };
}

function valuesFromRate(rate: ShippingRate): ShippingRateFormValues {
  return {
    minAmount: rate.minAmount,
    maxAmount: rate.maxAmount,
    cost: rate.cost,
    active: rate.active,
    sortOrder: rate.sortOrder,
  };
}

export function ShippingRateFormDialog({
  open,
  onOpenChange,
  rate,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const form = useForm<ShippingRateFormValues>({
    resolver: zodResolver(shippingRateFormSchema),
    defaultValues: emptyValues(),
  });

  const { errors, isSubmitted } = form.formState;
  /** Live del rango solo tras editar Desde/Hasta en esta apertura del form. */
  const [rangeLive, setRangeLive] = useState(false);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    bindAdminAction(createShippingRateAdminAction, locale),
    {
      successMessage: t("admin.shipping.rates.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    bindAdminAction(updateShippingRateAdminAction, locale),
    {
      successMessage: t("admin.shipping.rates.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  /** Antes del paint: reset limpio sin errores al abrir. */
  useLayoutEffect(() => {
    if (!open) {
      setRangeLive(false);
      return;
    }
    setRangeLive(false);
    form.reset(rate ? valuesFromRate(rate) : emptyValues(), {
      keepErrors: false,
      keepDirty: false,
      keepTouched: false,
      keepIsSubmitted: false,
      keepSubmitCount: false,
    });
    form.clearErrors();
  }, [open, rate, form]);

  /** Revalida el rango solo cuando el usuario cambia Desde o Hasta. */
  useEffect(() => {
    if (!open) return;

    const subscription = form.watch((_values, info) => {
      // `reset` / updates globales vienen sin `name`; solo reaccionamos a edición de campos.
      if (info.name !== "minAmount" && info.name !== "maxAmount") return;

      setRangeLive(true);

      const from = Number(form.getValues("minAmount"));
      const to = Number(form.getValues("maxAmount"));
      if (!Number.isFinite(from) || !Number.isFinite(to)) {
        if (
          form.getFieldState("maxAmount").error?.message ===
          SHIPPING_RATE_RANGE_ERROR
        ) {
          form.clearErrors("maxAmount");
        }
        return;
      }
      void form.trigger("maxAmount");
    });

    return () => subscription.unsubscribe();
  }, [open, form]);

  const fieldError = (name: keyof ShippingRateFormValues) => {
    const message = errors[name]?.message;
    if (!message) return undefined;
    if (isSubmitted) return message;
    if (
      rangeLive &&
      name === "maxAmount" &&
      message === SHIPPING_RATE_RANGE_ERROR
    ) {
      return message;
    }
    return undefined;
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        rate
          ? t("admin.shipping.rates.form.editTitle")
          : t("admin.shipping.rates.form.createTitle")
      }
      description={t("admin.shipping.rates.form.description")}
      contentAriaLabel={t("admin.shipping.rates.form.ariaLabel")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("admin.shipping.rates.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.shipping.rates.form.saving")}
          >
            {t("admin.shipping.rates.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form
        id={FORM_ID}
        form={form}
        onSubmit={(values) => {
          if (rate) executeUpdate(rate.id, values);
          else executeCreate(values);
        }}
        className="space-y-0"
      >
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormField
              name="minAmount"
              label={t("admin.shipping.rates.form.minAmount")}
              type="number"
              step="0.01"
              min={0}
              required
              disabled={isPending}
              error={fieldError("minAmount")}
              placeholder={t("admin.shipping.rates.form.minAmountPlaceholder")}
              className={adminServiceLikeInputClassName}
              autoComplete="off"
            />
            <FormField
              name="maxAmount"
              label={t("admin.shipping.rates.form.maxAmount")}
              type="number"
              step="0.01"
              min={0}
              required
              disabled={isPending}
              error={fieldError("maxAmount")}
              placeholder={t("admin.shipping.rates.form.maxAmountPlaceholder")}
              className={adminServiceLikeInputClassName}
              autoComplete="off"
            />
            <FormField
              name="cost"
              label={t("admin.shipping.rates.form.cost")}
              type="number"
              step="0.01"
              min={0.01}
              required
              disabled={isPending}
              error={fieldError("cost")}
              placeholder={t("admin.shipping.rates.form.costPlaceholder")}
              className={adminServiceLikeInputClassName}
              autoComplete="off"
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<ShippingRateFormValues>
                name="active"
                label={t("admin.shipping.rates.form.active")}
                description={t("admin.shipping.rates.form.activeHint")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
