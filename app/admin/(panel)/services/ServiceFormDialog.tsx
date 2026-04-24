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
import { useI18n } from "@/components/i18n/I18nProvider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
};

const SERVICE_FORM_ID = "service-form-dialog";

export function ServiceFormDialog({ open, onOpenChange, service }: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createServiceWithImageAction,
    {
      successMessage: t("admin.services.toast.created"),
      errorMessage: t("admin.services.toast.createError"),
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateServiceWithImageAction,
    {
      successMessage: t("admin.services.toast.updated"),
      errorMessage: t("admin.services.toast.updateError"),
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
        {
          name: formData.name,
          nameEn: formData.nameEn,
          description: formData.description,
          descriptionEn: formData.descriptionEn,
        },
        files,
        primaryImageIndex >= 0 ? primaryImageIndex : 0,
        formData.updatedExistingImages,
        formData.removedImages,
      );
      return;
    }

    executeCreate(
      {
        name: formData.name,
        nameEn: formData.nameEn,
        description: formData.description,
        descriptionEn: formData.descriptionEn,
      },
      files,
      primaryImageIndex >= 0 ? primaryImageIndex : 0,
    );
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={
        service
          ? t("admin.services.form.titleEdit")
          : t("admin.services.form.titleNew")
      }
      description={t("admin.services.form.description")}
      panelClassName="md:w-[min(90vw,42rem)] lg:w-[50%] lg:max-w-none"
      contentClassName="bg-background px-4 pb-4 pt-0"
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.services.form.cancel")}
          </Button>
          <ButtonPending
            type="submit"
            form={SERVICE_FORM_ID}
            pending={isPending}
            pendingLabel={t("admin.services.form.saving")}
          >
            {t("admin.services.form.save")}
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <ServiceForm
        formId={SERVICE_FORM_ID}
        initialName={service?.name ?? ""}
        initialNameEn={service?.nameEn ?? service?.name ?? ""}
        initialDescription={service?.description ?? ""}
        initialDescriptionEn={service?.descriptionEn ?? service?.description ?? ""}
        existingImages={existingImages}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        showActions={false}
      />
    </SlideOver>
  );
}
