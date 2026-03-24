"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  brandFormSchema,
  type BrandFormValues,
} from "@/modules/admin/brands/brands.schema";
import type { Brand } from "@/modules/admin/brands/brands.types";
import { createBrandAction, updateBrandAction } from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";

const BRAND_FORM_ID = "brand-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si null, modo crear */
  brand: Brand | null;
};

export function BrandFormDialog({ open, onOpenChange, brand }: Props) {
  const router = useRouter();
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: { name: "", active: true },
  });

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createBrandAction,
    {
      successMessage: "Marca creada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateBrandAction,
    {
      successMessage: "Marca actualizada",
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
      form.reset({ name: brand.name, active: brand.active });
    } else {
      form.reset({ name: "", active: true });
    }
  }, [open, brand, form]);

  const onSubmit = (values: BrandFormValues) => {
    if (brand) {
      executeUpdate(brand.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={brand ? "Editar marca" : "Nueva marca"}
      description="Define el nombre y si la marca se muestra en el catálogo público."
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
          <Button type="submit" form={BRAND_FORM_ID} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
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
              label="Nombre"
              required
              disabled={isPending}
              error={errors.name?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<BrandFormValues>
                name="active"
                label="Activa en catálogo"
                description="Si está desactivada, la marca no se muestra en el catálogo público."
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
