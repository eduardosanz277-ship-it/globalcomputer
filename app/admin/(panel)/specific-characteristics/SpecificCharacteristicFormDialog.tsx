"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  specificCharacteristicFormSchema,
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
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";

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
  const form = useForm<SpecificCharacteristicFormValues>({
    resolver: zodResolver(specificCharacteristicFormSchema),
    defaultValues: { generalId: "", name: "", active: true },
  });

  const errors = form.formState.errors;

  const generalOptions = useMemo(() => {
    const base = generalCharacteristics.map((g) => ({
      value: g.id,
      label: g.name,
    }));
    if (
      specificCharacteristic &&
      !base.some((o) => o.value === specificCharacteristic.generalId)
    ) {
      return [
        {
          value: specificCharacteristic.generalId,
          label: specificCharacteristic.generalName,
        },
        ...base,
      ];
    }
    return base;
  }, [generalCharacteristics, specificCharacteristic]);

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createSpecificCharacteristicAction,
    {
      successMessage: "Característica específica creada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    }
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateSpecificCharacteristicAction,
    {
      successMessage: "Característica específica actualizada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    }
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (specificCharacteristic) {
      form.reset({
        generalId: specificCharacteristic.generalId,
        name: specificCharacteristic.name,
        active: specificCharacteristic.active,
      });
    } else {
      form.reset({ generalId: "", name: "", active: true });
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
          ? "Editar característica específica"
          : "Nueva característica específica"
      }
      description="Cada valor específico pertenece a una característica general; el nombre es único dentro de esa característica general."
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
      <Form
        id={FORM_ID}
        form={form}
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <FormSelectField<SpecificCharacteristicFormValues>
          name="generalId"
          label="Característica general"
          instanceId="specific-characteristic-general"
          options={generalOptions}
          placeholder="Selecciona una característica general"
          isDisabled={isPending}
          required
        />
        <FormField
          name="name"
          label="Nombre del valor específico"
          required
          disabled={isPending}
          error={errors.name?.message}
          autoComplete="off"
        />
        <FormSwitchField<SpecificCharacteristicFormValues>
          name="active"
          label="Activo"
          description="Si está desactivado, el valor específico no se ofrece al configurar productos."
        />
      </Form>
    </SlideOver>
  );
}
