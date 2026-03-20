"use client";

import * as React from "react";
import {
  FieldValues,
  FormProvider,
  useFormContext,
  UseFormReturn,
} from "react-hook-form";
import { cn } from "@/utils/cn";
import { Label } from "./label";
import { Input } from "./input";

interface FormProps<TFieldValues extends FieldValues> {
  form: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  className?: string;
  children: React.ReactNode;
}

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
      >
        {children}
      </form>
    </FormProvider>
  );
}

interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  type?: string;
  error?: string;
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ name, label, error, type = "text", ...props }, ref) => {
    const { register } = useFormContext();
    const registration = register(name);
    const { ref: registrationRef, ...rest } = registration;

    return (
      <div className="space-y-1">
        <Label htmlFor={name}>{label}</Label>
        <Input
          id={name}
          type={type}
          {...props}
          {...rest}
          ref={(node) => {
            registrationRef(node);
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
        />
        {error ? (
          <p className="text-xs text-destructive mt-1">{error}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = "FormField";

