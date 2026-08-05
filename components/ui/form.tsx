"use client";

import * as React from "react";
import {
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import { cn } from "@/utils/cn";
import { Label, RequiredMark } from "./label";
import { Input } from "./input";

interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  className?: string;
  /** p. ej. para asociar botones de envío fuera del `<form>` con `form={id}` */
  id?: string;
  children: React.ReactNode;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  className,
  id,
  children,
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form
        id={id}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}

interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string;
  label: string;
  type?: string;
  error?: string;
  /** Muestra * en la etiqueta y `aria-required` en el input (validación sigue siendo con zod). */
  required?: boolean;
  /**
   * `inline`: etiqueta e input en fila con alineación vertical centrada (p. ej. alias en slide-overs).
   * Por defecto la etiqueta va encima del input.
   */
  layout?: "stack" | "inline";
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      name,
      label,
      error,
      type = "text",
      required: fieldRequired,
      layout = "stack",
      ...props
    },
    ref
  ) => {
    const { register } = useFormContext();
    const registration = register(name);
    const { ref: registrationRef, ...rest } = registration;

    const inputEl = (
      <Input
        id={name}
        type={type}
        {...props}
        {...rest}
        aria-required={fieldRequired ? true : undefined}
        ref={(node) => {
          registrationRef(node);
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
      />
    );

    const labelEl = (
      <Label htmlFor={name} className={layout === "inline" ? "shrink-0" : undefined}>
        {label}
        {fieldRequired ? <RequiredMark /> : null}
      </Label>
    );

    return (
      <div className="space-y-2">
        {layout === "inline" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {labelEl}
            <div className="min-w-0 flex-1">{inputEl}</div>
          </div>
        ) : (
          <>
            {labelEl}
            {inputEl}
          </>
        )}
        {error ? (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";

