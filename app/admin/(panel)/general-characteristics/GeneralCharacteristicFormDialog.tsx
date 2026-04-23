"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createGeneralCharacteristicFormSchema,
  type GeneralCharacteristicFormValues,
} from "@/modules/admin/general-characteristics/general-characteristics.schema";
import type { GeneralCharacteristic } from "@/modules/admin/general-characteristics/general-characteristics.types";
import {
  createGeneralCharacteristicAction,
  updateGeneralCharacteristicAction,
} from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
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

const FORM_ID = "general-characteristic-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characteristic: GeneralCharacteristic | null;
};

export function GeneralCharacteristicFormDialog({
  open,
  onOpenChange,
  characteristic,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = createGeneralCharacteristicFormSchema({
    nameRequired: t("admin.generalCharacteristics.form.errors.nameRequired"),
    nameEnRequired: t("admin.generalCharacteristics.form.errors.nameEnRequired"),
    maxChars: t("admin.generalCharacteristics.form.errors.maxChars"),
  });
  const form = useForm<GeneralCharacteristicFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { name: "", nameEn: "", active: true },
  });

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createGeneralCharacteristicAction,
    {
      successMessage: t("admin.generalCharacteristics.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateGeneralCharacteristicAction,
    {
      successMessage: t("admin.generalCharacteristics.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (characteristic) {
      form.reset({
        name: characteristic.name,
        nameEn: characteristic.nameEn ?? characteristic.name,
        active: characteristic.active,
      });
    } else {
      form.reset({ name: "", nameEn: "", active: true });
    }
  }, [open, characteristic, form]);

  const onSubmit = (values: GeneralCharacteristicFormValues) => {
    if (characteristic) {
      executeUpdate(characteristic.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        characteristic
          ? t("admin.generalCharacteristics.form.titleEdit")
          : t("admin.generalCharacteristics.form.titleNew")
      }
      description={t("admin.generalCharacteristics.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.generalCharacteristics.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.generalCharacteristics.form.saving")}
          >
            {t("admin.generalCharacteristics.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            {locale === "en" ? (
              <>
                <FormField
                  name="nameEn"
                  label={t("admin.generalCharacteristics.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="name"
                  label={t("admin.generalCharacteristics.form.labelName")}
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
                  label={t("admin.generalCharacteristics.form.labelName")}
                  required
                  disabled={isPending}
                  error={errors.name?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="nameEn"
                  label={t("admin.generalCharacteristics.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </>
            )}
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<GeneralCharacteristicFormValues>
                name="active"
                label={t("admin.generalCharacteristics.form.activeLabel")}
                description={t("admin.generalCharacteristics.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
