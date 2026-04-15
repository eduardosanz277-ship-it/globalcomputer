"use client";

import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Form, FormField } from "@/components/ui/form";
import { Label, RequiredMark } from "@/components/ui/label";
import { RatingStarsInput } from "@/components/site/RatingStarsInput";
import {
  adminServiceLikeInputClassName,
  adminSlideOverSectionClassName,
} from "@/components/admin/admin-form-classes";
import {
  productReviewFormSchema,
  type ProductReviewFormValues,
} from "@/modules/site/product-reviews.schema";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { cn } from "@/utils/cn";

export const PRODUCT_REVIEW_FORM_ID = "product-review-form";

const textareaPanelClassName = cn(
  "min-h-[140px] w-full resize-y rounded-lg border border-border/80 bg-white px-3 py-2 text-sm shadow-sm transition",
  "dark:bg-card",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-0",
  "placeholder:text-muted-foreground/70",
);

type ProductReviewFormProps = {
  productId: string;
  productName: string;
  onSuccess?: () => void;
  onPendingChange?: (pending: boolean) => void;
};

export function ProductReviewForm({
  productId,
  productName,
  onSuccess,
  onPendingChange,
}: ProductReviewFormProps) {
  const uid = useId();
  const ratingFieldId = `${uid}-rating`;
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const form = useForm<ProductReviewFormValues>({
    resolver: zodResolver(productReviewFormSchema),
    defaultValues: { productId, name: "", email: "", rating: 5, comment: "" },
    mode: "onSubmit",
  });

  const {
    register,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    reset({
      productId,
      name: getValues("name"),
      email: getValues("email"),
      rating: 5,
      comment: "",
    });
  }, [productId, reset, getValues]);

  useEffect(() => {
    let active = true;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        const user = data.user;
        if (!user) return;
        const metaName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name.trim()
            : "";
        const currentName = getValues("name").trim();
        if (metaName && !currentName) {
          setValue("name", metaName, { shouldValidate: true });
        }
        const email = user.email?.trim() ?? "";
        const currentEmail = (getValues("email") ?? "").trim();
        if (email && !currentEmail) {
          setValue("email", email, { shouldValidate: true });
        }
      })
      .finally(() => {
        if (!active) return;
        setIsProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getValues, setValue]);

  useEffect(() => {
    onPendingChange?.(isSubmitting || isProfileLoading);
  }, [isSubmitting, isProfileLoading, onPendingChange]);

  const onSubmit = async (values: ProductReviewFormValues) => {
    try {
      const response = await fetch("/api/product-reviews", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "No se pudo enviar la reseña.");
      }

      reset({
        productId,
        name: getValues("name"),
        email: getValues("email"),
        rating: 5,
        comment: "",
      });
      if (onSuccess) {
        onSuccess();
        window.setTimeout(() => {
          toast.success("Reseña enviada. Gracias por valorar este producto.");
        }, 150);
      } else {
        toast.success("Reseña enviada. Gracias por valorar este producto.");
      }
    } catch (error) {
      console.error("ProductReviewForm submit", error);
      const message =
        error instanceof Error ? error.message : "Error inesperado.";
      toast.error(message);
    }
  };

  return (
    <Form
      id={PRODUCT_REVIEW_FORM_ID}
      form={form}
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <section className={cn(adminSlideOverSectionClassName, "relative")}>
        {isProfileLoading ? (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-background/70 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                aria-hidden
              />
              Cargando datos
            </div>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{productName}</p>
          <p className="text-xs text-muted-foreground">
            Tu opinión ayuda a otros clientes a decidir su compra.
          </p>
        </div>

        <div className="space-y-4">
          <input type="hidden" {...register("productId")} />

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
              ¿Qué te pareció este producto?
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
              placeholder="Cuéntanos tu experiencia con este producto."
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
        </div>
      </section>
    </Form>
  );
}
