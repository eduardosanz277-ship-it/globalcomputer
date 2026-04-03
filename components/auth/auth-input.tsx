"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

/** Estilos compartidos para inputs en flujos de autenticación (48px, 16px, foco azul). */
export const authInputClassName =
  "h-12 w-full rounded-lg border border-border bg-white px-4 text-base text-foreground shadow-sm transition-[box-shadow,border-color] placeholder:text-[#aeaeae] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

export type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(authInputClassName, className)}
        ref={ref}
        {...props}
      />
    );
  },
);
AuthInput.displayName = "AuthInput";
