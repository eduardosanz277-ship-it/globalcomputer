"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonPending } from "@/components/ui/button-pending";
import { SlideOver, SlideOverFooter } from "@/components/ui/slide-over";
import {
  LeaveReviewForm,
  LEAVE_REVIEW_SITE_FORM_ID,
} from "@/components/site/LeaveReviewForm";

type Props = {
  open: boolean;
  onClose: () => void;
  refreshOnSuccess?: boolean;
};

export function LeaveReviewSiteFormSlideOver({
  open,
  onClose,
  refreshOnSuccess = true,
}: Props) {
  const router = useRouter();
  const [reviewFormPending, setReviewFormPending] = useState(false);

  const handleSuccess = () => {
    onClose();
    if (refreshOnSuccess) router.refresh();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Deja una reseña"
      description="Opina sobre tu experiencia de compra en la tienda. Si inicias sesión, podemos asociar tu comentario a tu cuenta."
      panelClassName="lg:max-w-[min(32rem,92vw)]"
      contentAriaLabel="Formulario de reseña de la tienda"
      footer={
        <SlideOverFooter>
          <Button
            type="button"
            variant="outline"
            disabled={reviewFormPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <ButtonPending
            type="submit"
            form={LEAVE_REVIEW_SITE_FORM_ID}
            pending={reviewFormPending}
            pendingLabel="Enviando"
          >
            Enviar reseña
          </ButtonPending>
        </SlideOverFooter>
      }
    >
      <LeaveReviewForm
        key={open ? "open" : "closed"}
        variant="panel"
        onSuccess={handleSuccess}
        onPendingChange={setReviewFormPending}
      />
    </SlideOver>
  );
}
