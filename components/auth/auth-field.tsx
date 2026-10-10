"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Label, RequiredMark } from "@/components/ui/label";
import { limitUsPhoneDigits } from "@/modules/auth/auth.schema";
import { cn } from "@/utils/cn";
import { AuthInput } from "./auth-input";

export interface AuthFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string;
  label: string;
  type?: string;
  error?: string;
  required?: boolean;
  /** Si se indica, no se pueden escribir más dígitos que este máximo. */
  maxDigits?: number;
}

/**
 * Campo de formulario con etiqueta 14px e input estilo auth (react-hook-form).
 */
export const AuthField = React.forwardRef<HTMLInputElement, AuthFieldProps>(
  (
    {
      name,
      label,
      error,
      type = "text",
      required: fieldRequired,
      maxDigits,
      className,
      onChange,
      ...props
    },
    ref,
  ) => {
    const { register } = useFormContext();
    const registration = register(name);
    const { ref: registrationRef, onChange: registerOnChange, ...rest } =
      registration;
    const hasError = Boolean(error);

    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {label}
          {fieldRequired ? <RequiredMark /> : null}
        </Label>
        <AuthInput
          id={name}
          type={type}
          {...props}
          {...rest}
          onChange={(event) => {
            if (typeof maxDigits === "number") {
              event.target.value = limitUsPhoneDigits(
                event.target.value,
                maxDigits,
              );
            }
            void registerOnChange(event);
            onChange?.(event);
          }}
          aria-invalid={hasError ? true : undefined}
          aria-required={fieldRequired ? true : undefined}
          className={cn(
            className,
            hasError &&
              "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30",
          )}
          ref={(node) => {
            registrationRef(node);
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
AuthField.displayName = "AuthField";
