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
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  (
    { name, label, error, type = "text", required: fieldRequired, ...props },
    ref
  ) => {
    const { register } = useFormContext();
    const registration = register(name);
    const { ref: registrationRef, ...rest } = registration;

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {label}
          {fieldRequired ? <RequiredMark /> : null}
        </Label>
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

