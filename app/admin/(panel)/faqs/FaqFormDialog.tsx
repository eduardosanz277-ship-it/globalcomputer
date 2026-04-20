"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  faqFormSchema,
  type FaqFormValues,
} from "@/modules/admin/faqs/faqs.schema";
import type { FaqAdmin } from "@/modules/admin/faqs/faqs.types";
import { createFaqAdminAction, updateFaqAdminAction } from "./actions";
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
import { Label, RequiredMark } from "@/components/ui/label";
import { cn } from "@/utils/cn";

const FORM_ID = "admin-faq-form-slide-over";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FaqAdmin | null;
};

export function FaqFormDialog({ open, onOpenChange, faq }: Props) {
  const router = useRouter();
  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqFormSchema),
    defaultValues: { question: "", answer: "", active: true },
  });

  const errors = form.formState.errors;
  const { register } = form;

  const { execute: executeCreate, isPending: isCreating } = useServerAction(
    createFaqAdminAction,
    {
      successMessage: "Pregunta frecuente creada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const { execute: executeUpdate, isPending: isUpdating } = useServerAction(
    updateFaqAdminAction,
    {
      successMessage: "Pregunta frecuente actualizada",
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    },
  );

  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (!open) return;
    if (faq) {
      form.reset({
        question: faq.question,
        answer: faq.answer,
        active: faq.active,
      });
    } else {
      form.reset({ question: "", answer: "", active: true });
    }
  }, [open, faq, form]);

  const onSubmit = (values: FaqFormValues) => {
    if (faq) {
      executeUpdate(faq.id, values);
    } else {
      executeCreate(values);
    }
  };

  return (
    <SlideOver
      open={open}
      onClose={() => onOpenChange(false)}
      title={faq ? "Editar pregunta frecuente" : "Nueva pregunta frecuente"}
      description="Gestiona la pregunta, su respuesta y si estará visible en el home."
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
            <FormField
              name="question"
              label="Pregunta"
              required
              disabled={isPending}
              error={errors.question?.message}
              autoComplete="off"
              className={adminServiceLikeInputClassName}
            />

            <div className="space-y-2">
              <Label htmlFor="answer">
                Respuesta
                <RequiredMark />
              </Label>
              <textarea
                id="answer"
                rows={6}
                disabled={isPending}
                {...register("answer")}
                className={cn(
                  "w-full rounded-lg border border-border/80 bg-white px-3 py-2.5 shadow-sm transition",
                  "min-h-[9rem] resize-y leading-relaxed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                  "dark:bg-card",
                )}
              />
              {errors.answer?.message ? (
                <p className="text-sm text-destructive" role="alert">
                  {errors.answer.message}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/50 pt-4">
              <FormSwitchField<FaqFormValues>
                name="active"
                label="Activa"
                description="Si está desactivada, no se mostrará en la sección de Preguntas frecuentes del home."
              />
            </div>
          </div>
        </section>
      </Form>
    </SlideOver>
  );
}
