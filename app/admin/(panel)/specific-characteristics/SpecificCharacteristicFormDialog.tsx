"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createSpecificCharacteristicFormSchema,
  type SpecificCharacteristicFormValues,
} from "@/modules/admin/specific-characteristics/specific-characteristics.schema";
import type { SpecificCharacteristic } from "@/modules/admin/specific-characteristics/specific-characteristics.types";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
import {
  createSpecificCharacteristicAction,
  updateSpecificCharacteristicAction,
} from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSelectField, FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import { useI18n } from "@/components/i18n/I18nProvider";

const FORM_ID = "specific-characteristic-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specificCharacteristic: SpecificCharacteristic | null;
  generalCharacteristics: GeneralCharacteristic[];
};

export function SpecificCharacteristicFormDialog({
  open,
  onOpenChange,
  specificCharacteristic,
  generalCharacteristics,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = useMemo(
    () =>
      createSpecificCharacteristicFormSchema({
        generalRequired: t("admin.specificCharacteristics.form.errors.generalRequired"),
        generalInvalid: t("admin.specificCharacteristics.form.errors.generalInvalid"),
        nameRequired: t("admin.specificCharacteristics.form.errors.nameRequired"),
        nameEnRequired: t("admin.specificCharacteristics.form.errors.nameEnRequired"),
        maxChars: t("admin.specificCharacteristics.form.errors.maxChars"),
      }),
    [t],
  );
  const form = useForm<SpecificCharacteristicFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { generalId: "", name: "", nameEn: "", active: true },
  });

  const errors = form.formState.errors;

  const generalOptions = useMemo(() => {
    const base = generalCharacteristics.map((g) => ({
      value: g.id,
      label: locale === "en" ? (g.nameEn ?? g.name) : g.name,
    }));
    if (
      specificCharacteristic &&
      !base.some((o) => o.value === specificCharacteristic.generalId)
    ) {
      return [
        {
          value: specificCharacteristic.generalId,
          label:
            locale === "en"
              ? (specificCharacteristic.generalNameEn ??
                specificCharacteristic.generalName)
              : specificCharacteristic.generalName,
        },
        ...base,
      ];
    }
    return base;
  }, [generalCharacteristics, locale, specificCharacteristic]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createSpecificCharacteristicAction,
    {
      successMessage: t("admin.specificCharacteristics.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateSpecificCharacteristicAction,
    {
      successMessage: t("admin.specificCharacteristics.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (specificCharacteristic) {
      form.reset({
        generalId: specificCharacteristic.generalId,
        name: specificCharacteristic.name,
        nameEn: specificCharacteristic.nameEn ?? specificCharacteristic.name,
        active: specificCharacteristic.active,
      });
    } else {
      form.reset({ generalId: "", name: "", nameEn: "", active: true });
    }
  }, [open, specificCharacteristic, form]);

  const onSubmit = (values: SpecificCharacteristicFormValues) => {
    if (specificCharacteristic) {
      executeUpdate(specificCharacteristic.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        specificCharacteristic
          ? t("admin.specificCharacteristics.form.titleEdit")
          : t("admin.specificCharacteristics.form.titleNew")
      }
      description={t("admin.specificCharacteristics.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.specificCharacteristics.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.specificCharacteristics.form.saving")}
          >
            {t("admin.specificCharacteristics.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          {/* <header className="flex items-center gap-2">
            <ListChecks
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              Información del valor
            </h2>
          </header> */}

          <div className="space-y-4">
            <FormSelectField<SpecificCharacteristicFormValues>
              name="generalId"
              label={t("admin.specificCharacteristics.form.labelGeneral")}
              instanceId="specific-characteristic-general"
              options={generalOptions}
              placeholder={t("admin.specificCharacteristics.form.placeholderGeneral")}
              isDisabled={isPending}
              required
            />
            {locale === "en" ? (
              <>
                <FormField
                  name="nameEn"
                  label={t("admin.specificCharacteristics.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="name"
                  label={t("admin.specificCharacteristics.form.labelName")}
                  required
                  disabled={isPending}
                  error={errors.name?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </>
            ) : (
              <>
                <FormField
                  name="name"
                  label={t("admin.specificCharacteristics.form.labelName")}
                  required
                  disabled={isPending}
                  error={errors.name?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="nameEn"
                  label={t("admin.specificCharacteristics.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </>
            )}
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<SpecificCharacteristicFormValues>
                name="active"
                label={t("admin.specificCharacteristics.form.activeLabel")}
                description={t("admin.specificCharacteristics.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
