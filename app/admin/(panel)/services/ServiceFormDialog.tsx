"use client";

import { useRouter } from "next/navigation";
import type { Service } from "@/modules/admin/services/services.types";
import {
  createServiceWithImageAction,
  updateServiceWithImageAction,
} from "./actions";
import { useServerAction } from "@/hooks/use-server-action";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  ServiceForm,
  type ExistingServiceImageInput,
  type ServiceFormSubmitData,
} from "@/components/admin/service-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
};

const SERVICE_FORM_ID = "service-form-dialog";

export function ServiceFormDialog({ open, onOpenChange, service }: Props) {
  const router = useRouter();

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createServiceWithImageAction,
    {
      successMessage: "Servicio creado",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateServiceWithImageAction,
    {
      successMessage: "Servicio actualizado",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;
  const existingImages: ExistingServiceImageInput[] =
    service?.images.map((img) => ({
      id: img.id,
      url: img.url,
      order: img.sortOrder,
      isPrimary: img.isPrimary,
    })) ?? [];

  const handleSubmit = (formData: ServiceFormSubmitData) => {
    const orderedNewImages = [...formData.newImages].sort(
      (a, b) => a.order - b.order,
    );
    const files = orderedNewImages.map((img) => img.file);
    const primaryImageIndex = orderedNewImages.findIndex(
      (img) => img.isPrimary,
    );

    if (service) {
      executeUpdate(
        service.id,
        { name: formData.name, description: formData.description },
        files,
        primaryImageIndex >= 0 ? primaryImageIndex : 0,
        formData.updatedExistingImages,
        formData.removedImages,
      );
      return;
    }

    executeCreate(
      { name: formData.name, description: formData.description },
      files,
      primaryImageIndex >= 0 ? primaryImageIndex : 0,
    );
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={service ? "Editar servicio" : "Nuevo servicio"}
      description="Gestiona nombre, descripción e imágenes del servicio."
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
            form={SERVICE_FORM_ID}
            pending={isPending}
            pendingLabel="Guardando"
          >
            Guardar
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <ServiceForm
        formId={SERVICE_FORM_ID}
        initialName={service?.name ?? ""}
        initialDescription={service?.description ?? ""}
        existingImages={existingImages}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        showActions={false}
      />
    </SlideOver>
  );
}
