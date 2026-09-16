"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createBrandFormSchema,
  type BrandFormValues,
} from "@/modules/admin/brands/brands.schema";
import type { Brand } from "@/modules/admin/brands/brands.types";
import { createBrandAction, updateBrandAction } from "./actions";
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
import { slugify } from "@/lib/slugify";

const BRAND_FORM_ID = "brand-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si null, modo crear */
  brand: Brand | null;
};

export function BrandFormDialog({ open, onOpenChange, brand }: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = createBrandFormSchema({
    nameRequired: t("admin.brands.form.errors.nameRequired"),
    nameEnRequired: t("admin.brands.form.errors.nameEnRequired"),
    maxChars: t("admin.brands.form.errors.maxChars"),
  });
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { name: "", nameEn: "", active: true },
  });

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    bindAdminAction(createBrandAction, locale),
    {
      successMessage: t("admin.brands.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    bindAdminAction(updateBrandAction, locale),
    {
      successMessage: t("admin.brands.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (brand) {
      form.reset({
        name: brand.name,
        nameEn: brand.nameEn ?? brand.name,
        active: brand.active,
      });
    } else {
      form.reset({ name: "", nameEn: "", active: true });
    }
  }, [open, brand, form]);

  const onSubmit = (values: BrandFormValues) => {
    const slug = slugify(values.name);

    if (brand) {
      executeUpdate(brand.id, { ...values, slug });
    } else {
      executeCreate({ ...values, slug });
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={brand ? t("admin.brands.form.titleEdit") : t("admin.brands.form.titleNew")}
      description={t("admin.brands.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.brands.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={BRAND_FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.brands.form.saving")}
          >
            {t("admin.brands.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form
        id={BRAND_FORM_ID}
        form={form}
        onSubmit={onSubmit}
        className="space-y-0"
      >
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormField
              name="name"
              label={t("admin.brands.form.labelName")}
              required
              disabled={isPending}
              error={errors.name?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="nameEn"
              label={t("admin.brands.form.labelNameEn")}
              required
              disabled={isPending}
              error={errors.nameEn?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<BrandFormValues>
                name="active"
                label={t("admin.brands.form.activeLabel")}
                description={t("admin.brands.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
