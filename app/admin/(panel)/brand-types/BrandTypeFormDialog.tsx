"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  brandTypeFormSchema,
  type BrandTypeFormValues,
} from "@/modules/admin/brand-types/brand-types.schema";
import type { BrandType } from "@/modules/admin/brand-types/brand-types.types";
import type { Brand } from "@/modules/admin/brands/brands.types";
import { createBrandTypeAction, updateBrandTypeAction } from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Form, FormField } from "@/components/ui/form";
import { FormSelectField, FormSwitchField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";

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
  const form = useForm<BrandTypeFormValues>({
    resolver: zodResolver(brandTypeFormSchema),
    defaultValues: { brandId: "", name: "", active: true },
  });

  const errors = form.formState.errors;

  const brandOptions = useMemo(() => {
    const base = brands.map((b) => ({ value: b.id, label: b.name }));
    if (
      brandType &&
      !base.some((o) => o.value === brandType.brandId)
    ) {
      return [
        { value: brandType.brandId, label: brandType.brandName },
        ...base,
      ];
    }
    return base;
  }, [brands, brandType]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createBrandTypeAction,
    {
      successMessage: "Tipo creado",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateBrandTypeAction,
    {
      successMessage: "Tipo actualizado",
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
        active: brandType.active,
      });
    } else {
      form.reset({ brandId: "", name: "", active: true });
    }
  }, [open, brandType, form]);

  const onSubmit = (values: BrandTypeFormValues) => {
    if (brandType) {
      executeUpdate(brandType.id, {
        brandId: values.brandId,
        name: values.name,
        active: values.active,
      });
    } else {
      executeCreate({
        brandId: values.brandId,
        name: values.name,
        active: values.active,
      });
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={brandType ? "Editar tipo" : "Nuevo tipo"}
      description="El tipo queda asociado a una marca; el nombre es único dentro de esa marca."
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
          <Button type="submit" form={BRAND_TYPE_FORM_ID} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
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
              label="Marca"
              instanceId="brand-type-brand"
              options={brandOptions}
              placeholder="Selecciona una marca"
              isDisabled={isPending}
              required
            />
            <FormField
              name="name"
              label="Nombre del tipo"
              required
              disabled={isPending}
              error={errors.name?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />
            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<BrandTypeFormValues>
                name="active"
                label="Activo en catálogo"
                description="Si está desactivado, el tipo no se muestra para esa marca en el catálogo público."
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
