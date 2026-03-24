"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  generalCharacteristicFormSchema,
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
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";

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
  const form = useForm<GeneralCharacteristicFormValues>({
    resolver: zodResolver(generalCharacteristicFormSchema),
    defaultValues: { name: "", active: true },
  });

  const errors = form.formState.errors;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createGeneralCharacteristicAction,
    {
      successMessage: "Característica creada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateGeneralCharacteristicAction,
    {
      successMessage: "Característica actualizada",
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
      form.reset({ name: characteristic.name, active: characteristic.active });
    } else {
      form.reset({ name: "", active: true });
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
          ? "Editar característica general"
          : "Nueva característica general"
      }
      description="Nombre único en el catálogo. Si está inactiva, no se ofrece al configurar productos."
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
          <Button type="submit" form={FORM_ID} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </SlideOverFooter>
      }
    >
      <Form id={FORM_ID} form={form} onSubmit={onSubmit} className="space-y-0">
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
              <FormSwitchField<GeneralCharacteristicFormValues>
                name="active"
                label="Activa"
                description="Si está desactivada, no se muestra al asignar características a productos."
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
