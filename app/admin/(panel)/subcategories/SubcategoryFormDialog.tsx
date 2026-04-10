"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  subcategoryFormSchema,
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
  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategoryFormSchema),
    defaultValues: { categoryId: "", name: "", active: true },
  });

  const errors = form.formState.errors;

  const categoryOptions = useMemo(() => {
    const base = categories
      .filter((c) => c.active)
      .map((c) => ({ value: c.id, label: c.name }));
    if (
      subcategory &&
      !base.some((o) => o.value === subcategory.categoryId)
    ) {
      return [
        {
          value: subcategory.categoryId,
          label: subcategory.categoryName,
        },
        ...base,
      ];
    }
    return base;
  }, [categories, subcategory]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createSubcategoryAdminAction,
    {
      successMessage: "Subcategoría creada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateSubcategoryAdminAction,
    {
      successMessage: "Subcategoría actualizada",
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
        active: subcategory.active,
      });
    } else {
      form.reset({ categoryId: "", name: "", active: true });
    }
  }, [open, subcategory, form]);

  const onSubmit = (values: SubcategoryFormValues) => {
    if (subcategory) {
      executeUpdate(subcategory.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        subcategory ? "Editar subcategoría" : "Nueva subcategoría"
      }
      description="Cada subcategoría pertenece a una categoría; el nombre es único entre subcategorías activas de esa categoría."
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
            form={FORM_ID}
            pending={isPending}
            pendingLabel="Guardando"
          >
            Guardar
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">
            <FormSelectField<SubcategoryFormValues>
              name="categoryId"
              label="Categoría"
              instanceId="admin-subcategory-category"
              options={categoryOptions}
              placeholder="Selecciona una categoría"
              isDisabled={isPending}
              required
              useMenuPortal
            />
            <FormField
              name="name"
              label="Nombre de la subcategoría"
              required
              disabled={isPending}
              error={errors.name?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<SubcategoryFormValues>
                name="active"
                label="Activa"
                description="Si está desactivada, no se ofrece al clasificar productos."
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
