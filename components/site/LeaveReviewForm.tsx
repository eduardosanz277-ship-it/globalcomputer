"use client";

import { useEffect, useId } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { Label, RequiredMark } from "@/components/ui/label";
import { RatingStarsInput } from "@/components/site/RatingStarsInput";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import {
  siteReviewFormSchema,
  type SiteReviewFormValues,
} from "@/modules/site/site-reviews.schema";
import { cn } from "@/utils/cn";

export const LEAVE_REVIEW_SITE_FORM_ID = "leave-review-site-form";

const defaultValues: SiteReviewFormValues = {
  name: "",
  email: "",
  rating: 5,
  comment: "",
};

const textareaPanelClassName = cn(
  "min-h-[140px] w-full resize-y rounded-lg border border-border/80 bg-white px-3 py-2 text-sm shadow-sm transition",
  "dark:bg-card",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);

type LeaveReviewFormProps = {
  /** Tras envío correcto (p. ej. cerrar panel y refrescar la página). */
  onSuccess?: () => void;
  /** Notifica si el envío está en curso (p. ej. botón en `SlideOverFooter`). */
  onPendingChange?: (pending: boolean) => void;
  /** `panel`: formulario dentro del slide-over (estructura alineada con formularios admin). */
  variant?: "default" | "panel";
};

export function LeaveReviewForm({
  onSuccess,
  onPendingChange,
  variant = "default",
}: LeaveReviewFormProps) {
  const uid = useId();
  const ratingFieldId = `${uid}-rating`;

  const form = useForm<SiteReviewFormValues>({
    resolver: zodResolver(siteReviewFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const {
    register,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    onPendingChange?.(isSubmitting);
  }, [isSubmitting, onPendingChange]);

  const onSubmit = async (values: SiteReviewFormValues) => {
    try {
      const response = await fetch("/api/site-reviews", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo enviar la reseña.");
      }

      reset(defaultValues);
      toast.success(
        "Reseña enviada. Gracias por compartir tu experiencia.",
      );
      if (onSuccess) {
        window.setTimeout(() => onSuccess(), 900);
      }
    } catch (error) {
      console.error("LeaveReviewForm submit", error);
      const message =
        error instanceof Error ? error.message : "Error inesperado.";
      toast.error(message);
    }
  };

  const fields = (
    <>
      <FormField
        name="name"
        label="Nombre"
        required
        disabled={isSubmitting}
        error={errors.name?.message}
        autoComplete="name"
        className={cn(adminServiceLikeInputClassName, "w-full")}
        placeholder="Tu nombre o alias"
      />

      <FormField
        name="email"
        label="Correo electrónico (opcional)"
        type="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        autoComplete="email"
        className={cn(adminServiceLikeInputClassName, "w-full")}
        placeholder="correo@ejemplo.com"
      />

      <div className="space-y-2">
        <Label id={`${ratingFieldId}-label`}>
          ¿Qué te pareció la tienda?
          <RequiredMark />
        </Label>
        <Controller
          name="rating"
          control={control}
          render={({ field }) => (
            <RatingStarsInput
              id={ratingFieldId}
              labelledBy={`${ratingFieldId}-label`}
              value={field.value}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
        {errors.rating?.message ? (
          <p className="text-sm text-destructive" role="alert">
            {errors.rating.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${uid}-comment`}>
          Comentario
          <RequiredMark />
        </Label>
        <textarea
          id={`${uid}-comment`}
          className={textareaPanelClassName}
          placeholder="Cuéntanos qué te gustó o qué podemos mejorar."
          disabled={isSubmitting}
          aria-invalid={errors.comment ? true : undefined}
          aria-describedby={
            errors.comment ? `${uid}-comment-error` : undefined
          }
          {...register("comment")}
        />
        {errors.comment?.message ? (
          <p
            id={`${uid}-comment-error`}
            className="text-sm text-destructive"
            role="alert"
          >
            {errors.comment.message}
          </p>
        ) : null}
      </div>
    </>
  );

  return (
    <Form
      id={variant === "panel" ? LEAVE_REVIEW_SITE_FORM_ID : undefined}
      form={form}
      onSubmit={onSubmit}
      className={variant === "panel" ? "space-y-4" : "space-y-6"}
    >
      {variant === "default" ? (
        <p className="text-sm text-muted-foreground">
          No necesitas tener cuenta: puedes enviar tu reseña como invitado. Si
          inicias sesión, la reseña puede asociarse a tu perfil.
        </p>
      ) : null}

      {variant === "panel" ? (
        <section className={adminSlideOverSectionClassName}>
          <div className="space-y-4">{fields}</div>
        </section>
      ) : (
        <>
          <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:bg-card">
            <div className="space-y-4">{fields}</div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Enviando reseña…" : "Enviar reseña"}
          </Button>
        </>
      )}
    </Form>
  );
}
