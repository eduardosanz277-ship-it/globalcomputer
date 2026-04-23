"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createBrandTypeFormSchema,
  type BrandTypeFormValues,
} from "@/modules/admin/brand-types/brand-types.schema";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import { createBrandTypeAction, updateBrandTypeAction } from "./actions";
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
import { slugify } from "@/lib/slugify";

const BRAND_TYPE_FORM_ID = "brand-type-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si null, modo crear */
  brandType: BrandType | null;
  brands: Brand[];
};

export function BrandTypeFormDialog({
  open,
  onOpenChange,
  brandType,
  brands,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = useMemo(
    () =>
      createBrandTypeFormSchema({
        brandRequired: t("admin.brandTypes.form.errors.brandRequired"),
        brandInvalid: t("admin.brandTypes.form.errors.brandInvalid"),
        nameRequired: t("admin.brandTypes.form.errors.nameRequired"),
        nameEnRequired: t("admin.brandTypes.form.errors.nameEnRequired"),
        maxChars: t("admin.brandTypes.form.errors.maxChars"),
      }),
    [t],
  );
  const form = useForm<BrandTypeFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { brandId: "", name: "", nameEn: "", active: true },
  });

  const errors = form.formState.errors;

  const brandOptions = useMemo(() => {
    const base = brands.map((b) => ({
      value: b.id,
      label: locale === "en" ? (b.nameEn ?? b.name) : b.name,
    }));
    if (brandType && !base.some((o) => o.value === brandType.brandId)) {
      return [
        {
          value: brandType.brandId,
          label:
            locale === "en"
              ? (brandType.brandNameEn ?? brandType.brandName)
              : brandType.brandName,
        },
        ...base,
      ];
    }
    return base;
  }, [brands, brandType, locale]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createBrandTypeAction,
    {
      successMessage: t("admin.brandTypes.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateBrandTypeAction,
    {
      successMessage: t("admin.brandTypes.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (brandType) {
      form.reset({
        brandId: brandType.brandId,
        name: brandType.name,
        nameEn: brandType.nameEn ?? brandType.name,
        active: brandType.active,
      });
    } else {
      form.reset({ brandId: "", name: "", nameEn: "", active: true });
    }
  }, [open, brandType, form]);

  const onSubmit = (values: BrandTypeFormValues) => {
    const slug = slugify(values.name);

    if (brandType) {
      executeUpdate(brandType.id, {
        brandId: values.brandId,
        name: values.name,
        nameEn: values.nameEn,
        slug,
        active: values.active,
      });
    } else {
      executeCreate({
        brandId: values.brandId,
        name: values.name,
        nameEn: values.nameEn,
        slug,
        active: values.active,
      });
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        brandType
          ? t("admin.brandTypes.form.titleEdit")
          : t("admin.brandTypes.form.titleNew")
      }
      description={t("admin.brandTypes.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.brandTypes.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={BRAND_TYPE_FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.brandTypes.form.saving")}
          >
            {t("admin.brandTypes.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form
        id={BRAND_TYPE_FORM_ID}
        form={form}
        onSubmit={onSubmit}
        className="space-y-0"
      >
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormSelectField<BrandTypeFormValues>
              name="brandId"
              label={t("admin.brandTypes.form.labelBrand")}
              instanceId="brand-type-brand"
              options={brandOptions}
              placeholder={t("admin.brandTypes.form.placeholderBrand")}
              isDisabled={isPending}
              required
            />
            {locale === "en" ? (
              <>
                <FormField
                  name="nameEn"
                  label={t("admin.brandTypes.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="name"
                  label={t("admin.brandTypes.form.labelName")}
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
                  label={t("admin.brandTypes.form.labelName")}
                  required
                  disabled={isPending}
                  error={errors.name?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="nameEn"
                  label={t("admin.brandTypes.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </>
            )}
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<BrandTypeFormValues>
                name="active"
                label={t("admin.brandTypes.form.activeLabel")}
                description={t("admin.brandTypes.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
