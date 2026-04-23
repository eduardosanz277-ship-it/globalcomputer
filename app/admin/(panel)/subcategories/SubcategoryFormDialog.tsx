"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  createSubcategoryFormSchema,
  type SubcategoryFormValues,
} from "@/modules/admin/subcategories/subcategories.schema";
import type { SubcategoryAdmin } from "@/modules/admin/subcategories/subcategories.types";
import type { CategoryAdmin } from "@/modules/admin/categories/categories.types";
import {
  createSubcategoryAdminAction,
  updateSubcategoryAdminAction,
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
import { slugify } from "@/lib/slugify";

const FORM_ID = "admin-subcategory-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory: SubcategoryAdmin | null;
  categories: CategoryAdmin[];
};

export function SubcategoryFormDialog({
  open,
  onOpenChange,
  subcategory,
  categories,
}: Props) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const localizedSchema = useMemo(
    () =>
      createSubcategoryFormSchema({
        categoryRequired: t("admin.subcategories.form.errors.categoryRequired"),
        categoryInvalid: t("admin.subcategories.form.errors.categoryInvalid"),
        nameRequired: t("admin.subcategories.form.errors.nameRequired"),
        nameEnRequired: t("admin.subcategories.form.errors.nameEnRequired"),
        maxChars: t("admin.subcategories.form.errors.maxChars"),
      }),
    [t],
  );
  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(localizedSchema),
    defaultValues: { categoryId: "", name: "", nameEn: "", active: true },
  });

  const errors = form.formState.errors;

  const categoryOptions = useMemo(() => {
    const base = categories
      .filter((c) => c.active)
      .map((c) => ({
        value: c.id,
        label: locale === "en" ? (c.nameEn ?? c.name) : c.name,
      }));
    if (subcategory && !base.some((o) => o.value === subcategory.categoryId)) {
      return [
        {
          value: subcategory.categoryId,
          label:
            locale === "en"
              ? categories.find((c) => c.id === subcategory.categoryId)?.nameEn ??
                subcategory.categoryName
              : subcategory.categoryName,
        },
        ...base,
      ];
    }
    return base;
  }, [categories, locale, subcategory]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createSubcategoryAdminAction,
    {
      successMessage: t("admin.subcategories.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateSubcategoryAdminAction,
    {
      successMessage: t("admin.subcategories.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (subcategory) {
      form.reset({
        categoryId: subcategory.categoryId,
        name: subcategory.name,
        nameEn: subcategory.nameEn ?? subcategory.name,
        active: subcategory.active,
      });
    } else {
      form.reset({ categoryId: "", name: "", nameEn: "", active: true });
    }
  }, [open, subcategory, form]);

  const onSubmit = (values: SubcategoryFormValues) => {
    const slug = slugify(values.name);

    if (subcategory) {
      executeUpdate(subcategory.id, { ...values, slug });
    } else {
      executeCreate({ ...values, slug });
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        subcategory
          ? t("admin.subcategories.form.titleEdit")
          : t("admin.subcategories.form.titleNew")
      }
      description={t("admin.subcategories.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.subcategories.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.subcategories.form.saving")}
          >
            {t("admin.subcategories.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormSelectField<SubcategoryFormValues>
              name="categoryId"
              label={t("admin.subcategories.form.labelCategory")}
              instanceId="admin-subcategory-category"
              options={categoryOptions}
              placeholder={t("admin.subcategories.form.placeholderCategory")}
              isDisabled={isPending}
              required
              useMenuPortal
            />
            {locale === "en" ? (
              <>
                <FormField
                  name="nameEn"
                  label={t("admin.subcategories.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="name"
                  label={t("admin.subcategories.form.labelName")}
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
                  label={t("admin.subcategories.form.labelName")}
                  required
                  disabled={isPending}
                  error={errors.name?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
                <FormField
                  name="nameEn"
                  label={t("admin.subcategories.form.labelNameEn")}
                  required
                  disabled={isPending}
                  error={errors.nameEn?.message}
                  autoComplete="off"
                  className={adminServiceLikeInputClassName}
                />
              </>
            )}
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<SubcategoryFormValues>
                name="active"
                label={t("admin.subcategories.form.activeLabel")}
                description={t("admin.subcategories.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
