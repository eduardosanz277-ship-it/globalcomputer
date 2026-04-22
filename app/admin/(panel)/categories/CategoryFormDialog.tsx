 "use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/modules/admin/categories/categories.schema";
import type { CategoryAdmin } from "@/modules/admin/categories/categories.types";
import {
  createCategoryAdminAction,
  updateCategoryAdminAction,
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
import { slugify } from "@/lib/slugify";

const FORM_ID = "admin-category-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryAdmin | null;
};

export function CategoryFormDialog({ open, onOpenChange, category }: Props) {
  const router = useRouter();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", nameEn: "", active: true },
  });
  const { t } = useI18n();

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createCategoryAdminAction,
    {
      successMessage: t("admin.categories.toast.created"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateCategoryAdminAction,
    {
      successMessage: t("admin.categories.toast.updated"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (category) {
      form.reset({
        name: category.name,
        nameEn: category.nameEn ?? category.name,
        active: category.active,
      });
    } else {
      form.reset({ name: "", nameEn: "", active: true });
    }
  }, [open, category, form]);

  const onSubmit = (values: CategoryFormValues) => {
    const slug = slugify(values.name);

    if (category) {
      executeUpdate(category.id, { ...values, slug });
    } else {
      executeCreate({ ...values, slug });
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        category
          ? t("admin.categories.form.titleEdit")
          : t("admin.categories.form.titleNew")
      }
      description={t("admin.categories.form.description")}
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.categories.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.categories.form.save")}
          >
            {t("admin.categories.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormField
              name="name"
              label={t("admin.categories.form.labelName")}
              required
              disabled={isPending}
              error={errors.name?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <FormField
              name="nameEn"
              label={t("admin.categories.form.labelNameEn")}
              required
              disabled={isPending}
              error={errors.nameEn?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<CategoryFormValues>
                name="active"
                label={t("admin.categories.form.activeLabel")}
                description={t("admin.categories.form.activeDescription")}
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
